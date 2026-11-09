// grammora-showcase/src/process-logo.js
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logoPath = path.resolve(__dirname, '../assets/new-grammora-logo.png');
  const b64 = fs.readFileSync(logoPath).toString('base64');
  const dataUrl = 'data:image/png;base64,' + b64;

  await page.setContent(`
    <img id="img" src="${dataUrl}" />
    <canvas id="c" width="1254" height="1254"></canvas>
  `);

  await page.waitForFunction(() => document.getElementById('img').naturalWidth > 0);

  const pngBase64 = await page.evaluate(() => {
    const img = document.getElementById('img');
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');
    const w = 1254;
    const h = 1254;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    // Breadth-First Flood Fill from corners
    // Any pixel connected to corners with brightness > threshold is background
    const visited = new Uint8Array(w * h);
    const queue = [];

    function isBgColor(r, g, b) {
      // Check if pixel is near-white (background)
      return (r >= 235 && g >= 235 && b >= 235);
    }

    // Seed corners and entire outer border
    for (let x = 0; x < w; x++) {
      queue.push([x, 0], [x, h - 1]);
      visited[0 * w + x] = 1;
      visited[(h - 1) * w + x] = 1;
    }
    for (let y = 0; y < h; y++) {
      queue.push([0, y], [w - 1, y]);
      visited[y * w + 0] = 1;
      visited[y * w + (w - 1)] = 1;
    }

    let head = 0;
    while (head < queue.length) {
      const [cx, cy] = queue[head++];
      const idx = (cy * w + cx) * 4;
      const r = d[idx];
      const g = d[idx + 1];
      const b = d[idx + 2];

      if (isBgColor(r, g, b)) {
        // Mark as background (transparent)
        d[idx + 3] = 0;

        // Check 4 neighbors
        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const nIdx = ny * w + nx;
            if (!visited[nIdx]) {
              visited[nIdx] = 1;
              const nR = d[nIdx * 4];
              const nG = d[nIdx * 4 + 1];
              const nB = d[nIdx * 4 + 2];
              if (isBgColor(nR, nG, nB)) {
                queue.push([nx, ny]);
              }
            }
          }
        }
      }
    }

    // Edge antialiasing pass: for pixels adjacent to transparent pixels that are light, soften alpha
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        if (d[idx + 3] > 0) {
          const r = d[idx];
          const g = d[idx + 1];
          const b = d[idx + 2];
          // If close to white and near transparent neighbor
          const brightness = (r + g + b) / 3;
          if (brightness > 200) {
            const hasTransparentNeighbor = (
              d[((y - 1) * w + x) * 4 + 3] === 0 ||
              d[((y + 1) * w + x) * 4 + 3] === 0 ||
              d[(y * w + (x - 1)) * 4 + 3] === 0 ||
              d[(y * w + (x + 1)) * 4 + 3] === 0
            );
            if (hasTransparentNeighbor) {
              // Smooth feathering
              const alphaRatio = 1 - ((brightness - 200) / 55);
              d[idx + 3] = Math.round(Math.max(0, Math.min(255, alphaRatio * 255)));
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return c.toDataURL('image/png');
  });

  const outBuf = Buffer.from(pngBase64.split(',')[1], 'base64');
  const transparentLogoPath = path.resolve(__dirname, '../assets/grammora-logo-transparent.png');
  fs.writeFileSync(transparentLogoPath, outBuf);
  console.log(`Saved transparent logo to ${transparentLogoPath} (${outBuf.length} bytes)`);

  // Update logo-data.js so animation.html has it immediately embedded
  const logoDataJsPath = path.resolve(__dirname, 'logo-data.js');
  fs.writeFileSync(logoDataJsPath, `window.GRAMMORA_LOGO_B64 = "data:image/png;base64,${pngBase64.split(',')[1]}";\n`, 'utf8');
  console.log(`Updated logo-data.js with new transparent logo!`);

  await browser.close();
})();

