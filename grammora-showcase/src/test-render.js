// grammora-showcase/src/test-render.js
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log('Testing true 1920x1080 capture...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  const htmlPath = path.resolve(__dirname, 'animation.html');
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/') + '?render=1');
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  await page.waitForTimeout(1000);

  await page.evaluate(() => window.renderFrame(100));
  const canvas = await page.$('#canvas');
  const buf = await canvas.screenshot();

  console.log('Screenshot PNG byte length:', buf.length);
  console.log('PNG Width:', buf.readUInt32BE(16), 'Height:', buf.readUInt32BE(20));

  await browser.close();
})();
