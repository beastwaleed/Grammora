// grammora-showcase/src/render-video.js
// Frame-accurate 1080p @ 30fps multi-worker video renderer for Grammora SaaS Showcase

import { chromium } from 'playwright';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOTAL_FRAMES = 1200; // 40 seconds @ 30 fps
const FPS = 30;
const NUM_WORKERS = 6;
const FRAMES_PER_WORKER = Math.ceil(TOTAL_FRAMES / NUM_WORKERS);

const outputDir = path.resolve(__dirname, '../output');
const framesDir = path.join(outputDir, 'frames');
const audioPath = path.join(outputDir, 'soundtrack.wav');
const final1080pPath = path.join(outputDir, 'grammora-showcase-1080p.mp4');
const final4x5Path = path.join(outputDir, 'grammora-showcase-4x5.mp4');
const coverPath = path.join(outputDir, 'grammora-showcase-cover.png');
const htmlPath = path.resolve(__dirname, 'animation.html');

// Ensure clean frames directory
if (fs.existsSync(framesDir)) {
  const existingFiles = fs.readdirSync(framesDir);
  for (const f of existingFiles) {
    fs.unlinkSync(path.join(framesDir, f));
  }
} else {
  fs.mkdirSync(framesDir, { recursive: true });
}

async function renderWorker(browser, workerId, startFrame, endFrame) {
  console.log(`[Worker ${workerId}] Starting frames ${startFrame} to ${endFrame}...`);
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/') + '?render=1';
  await page.goto(fileUrl);
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  await page.waitForTimeout(1000); // Wait for fonts and logo to settle

  const canvas = await page.$('#canvas');

  for (let f = startFrame; f <= endFrame; f++) {
    await page.evaluate((frameIdx) => window.renderFrame(frameIdx), f);
    const buf = await canvas.screenshot({ type: 'png' });
    const framePath = path.join(framesDir, `frame_${String(f).padStart(4, '0')}.png`);
    fs.writeFileSync(framePath, buf);

    if ((f - startFrame + 1) % 40 === 0 || f === endFrame) {
      const progress = (((f - startFrame + 1) / (endFrame - startFrame + 1)) * 100).toFixed(1);
      console.log(`[Worker ${workerId}] Frame ${f}/${endFrame} (${progress}%) completed`);
    }
  }

  await page.close();
  console.log(`[Worker ${workerId}] Finished all assigned frames.`);
}

(async () => {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('   GRAMMORA CINEMATIC SAAS SHOWCASE VIDEO RENDERER  ');
  console.log('====================================================');
  console.log(`Total Frames: ${TOTAL_FRAMES} (40.0s @ 30 FPS)`);
  console.log(`Native Resolution: 1920x1080`);
  console.log(`Parallel Workers: ${NUM_WORKERS}`);
  console.log(`Output Directory: ${outputDir}`);

  // 1. Launch Browser
  const browser = await chromium.launch({ headless: true });

  // 2. Spawn Parallel Workers
  const workerPromises = [];
  for (let w = 0; w < NUM_WORKERS; w++) {
    const start = w * FRAMES_PER_WORKER;
    const end = Math.min(TOTAL_FRAMES - 1, (w + 1) * FRAMES_PER_WORKER - 1);
    workerPromises.push(renderWorker(browser, w + 1, start, end));
  }

  await Promise.all(workerPromises);
  await browser.close();

  const renderElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nAll 1200 frames rendered in ${renderElapsed}s!`);

  // 3. Verify Audio Exists
  if (!fs.existsSync(audioPath)) {
    console.log('Audio file not found, generating now...');
    spawnSync('node', [path.resolve(__dirname, 'generate-audio.js')], { stdio: 'inherit' });
  }

  // 4. Encode Master 1080p Video via FFmpeg
  console.log('\n--- Encoding Master 1080p MP4 (H.264 + 48kHz AAC) ---');
  const inputFrames = path.join(framesDir, 'frame_%04d.png');
  const ffmpegArgs = [
    '-y',
    '-framerate', '30',
    '-i', inputFrames,
    '-i', audioPath,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'high',
    '-level', '4.2',
    '-crf', '17',
    '-preset', 'medium',
    '-c:a', 'aac',
    '-b:a', '320k',
    '-ar', '48000',
    '-shortest',
    '-movflags', '+faststart',
    final1080pPath
  ];

  const res1080p = spawnSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });
  if (res1080p.status !== 0) {
    throw new Error(`FFmpeg 1080p encoding failed with exit code ${res1080p.status}`);
  }
  console.log(`Master video generated: ${final1080pPath}`);

  // 5. Generate 4:5 Mobile LinkedIn Cut (1080x1350)
  console.log('\n--- Generating 4:5 LinkedIn Mobile Adaptation (1080x1350) ---');
  const cropArgs = [
    '-y',
    '-i', final1080pPath,
    '-vf', 'crop=864:1080:528:0,scale=1080:1350',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '18',
    '-preset', 'medium',
    '-c:a', 'copy',
    '-movflags', '+faststart',
    final4x5Path
  ];

  const resCrop = spawnSync('ffmpeg', cropArgs, { stdio: 'inherit' });
  if (resCrop.status !== 0) {
    throw new Error(`FFmpeg 4:5 crop failed with exit code ${resCrop.status}`);
  }
  console.log(`4:5 video generated: ${final4x5Path}`);

  // 6. Generate 1920x1080 Poster Cover Thumbnail from Climax Frame 1080
  console.log('\n--- Generating 1920x1080 Cover Poster Thumbnail ---');
  const coverSourceFrame = path.join(framesDir, 'frame_1080.png');
  if (fs.existsSync(coverSourceFrame)) {
    fs.copyFileSync(coverSourceFrame, coverPath);
    console.log(`Cover image generated: ${coverPath}`);
  }

  // 7. Clean up frames
  console.log('\nCleaning up individual frame images...');
  const frameFiles = fs.readdirSync(framesDir);
  for (const file of frameFiles) {
    if (file.endsWith('.png')) {
      fs.unlinkSync(path.join(framesDir, file));
    }
  }
  fs.rmdirSync(framesDir);
  console.log('Frames cleaned up successfully.');

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n====================================================');
  console.log(`✨ ALL RENDER DELIVERABLES READY in ${totalElapsed}s!`);
  console.log(`1. Landscape 1080p: ${final1080pPath}`);
  console.log(`2. Vertical 4:5:    ${final4x5Path}`);
  console.log(`3. Cover Poster:    ${coverPath}`);
  console.log('====================================================');
})();
