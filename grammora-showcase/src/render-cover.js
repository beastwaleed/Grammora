// grammora-showcase/src/render-cover.js
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log('Rendering 1920x1080 Grammora Feature Cover Image...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  const htmlPath = path.resolve(__dirname, 'cover-design.html');
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'));

  // Ensure fonts and logo image are loaded
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  await page.waitForFunction(() => {
    const img = document.getElementById('logoImg');
    return img && img.complete && img.naturalWidth > 0;
  });
  await page.waitForTimeout(800); // Allow styles and shadows to settle

  const outputDir = path.resolve(__dirname, '../output');
  const coverPath1 = path.join(outputDir, 'grammora-showcase-cover.png');
  const coverPath2 = path.join(outputDir, 'grammora-feature-cover.png');

  await page.screenshot({ path: coverPath1, type: 'png' });
  await page.screenshot({ path: coverPath2, type: 'png' });

  const stats = fs.statSync(coverPath1);
  console.log(`✨ Cover Image successfully generated!`);
  console.log(`File: ${coverPath1} (${(stats.size / 1024 / 1024).toFixed(2)} MB, 1920x1080 PNG)`);

  await browser.close();
})();
