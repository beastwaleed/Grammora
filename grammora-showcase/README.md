# Grammora Cinematic SaaS Product Showcase

This folder contains the complete, deterministic motion-graphics engine, synthesized sound design system, 9-panel interactive storyboard, and rendered video deliverables for **Grammora** — the AI-powered Chrome writing assistant.

---

## 📁 Directory Structure

```text
grammora-showcase/
├── assets/
│   ├── Grammora-Logo.png          # Official brand squircle logo (1254x1254)
│   └── icon/                      # Extension vector & raster icons
│       ├── icon.svg
│       ├── 16.png, 32.png, 48.png, 128.png
├── output/
│   ├── grammora-showcase-1080p.mp4 # Master Landscape (1920x1080 @ 30fps, H.264/AAC)
│   ├── grammora-showcase-4x5.mp4   # LinkedIn Mobile Feed Cut (1080x1350 @ 30fps)
│   ├── grammora-showcase-cover.png # 1920x1080 High-Res Poster Thumbnail
│   └── soundtrack.wav              # 48kHz Stereo Master Sound Design
├── src/
│   ├── animation.html             # HTML5 Canvas 2D Motion Graphics Engine
│   ├── generate-audio.js          # Deterministic 48kHz audio synthesizer
│   ├── render-video.js            # Multi-worker Playwright frame renderer & FFmpeg muxer
│   ├── encode-logo.js             # Base64 logo pre-loader
│   └── logo-data.js               # Synchronous embedded logo data
├── storyboard.html                # 9-Panel interactive storyboard & audio preview
└── README.md                      # This documentation
```

---

## 🎬 Deliverables Specification

1. **Master Landscape Video:** `output/grammora-showcase-1080p.mp4`
   - **Resolution:** 1920 × 1080 (16:9)
   - **Framerate:** 30.00 FPS (1,200 frames total)
   - **Duration:** 40.00 seconds
   - **Video Codec:** H.264 (High Profile, Level 4.2, CRF 17)
   - **Audio Codec:** AAC-LC (48,000 Hz, stereo, 320 kbps)
   - **Size:** ~8.4 MB

2. **LinkedIn Mobile Vertical Cut:** `output/grammora-showcase-4x5.mp4`
   - **Resolution:** 1080 × 1350 (4:5 aspect ratio optimized for LinkedIn mobile feed)
   - **Framerate:** 30.00 FPS
   - **Duration:** 40.00 seconds
   - **Video Codec:** H.264 (CRF 18)
   - **Audio Codec:** AAC (passthrough copy)
   - **Size:** ~6.6 MB

3. **High-Resolution Poster Cover:** `output/grammora-showcase-cover.png`
   - **Resolution:** 1920 × 1080 PNG (1.26 MB)
   - Captured from frame 1080 (climax scene featuring the glowing Grammora emblem, typography, and call-to-action).

---

## 🎮 Interactive Real-Time Preview

You can preview and scrub through the animation in real-time in any modern web browser:

1. **Interactive Storyboard:** Open `storyboard.html` in your browser to view all 9 scene stills with sound triggers.
2. **Real-time Canvas Animation:** Open `src/animation.html` in your browser.
   - Click **Play / Pause** to watch with audio at 60 fps.
   - Use the scrubber slider to jump to any frame (0 – 1199) or scene.

---

## 🛠️ How to Modify or Re-render

### 1. Modifying Animation Visuals or Copy
All visual logic, easing curves, camera motion, and on-screen text are organized cleanly in `src/animation.html`:
- `renderScene1(t)`: The Hook ("Writing shouldn't slow you down.")
- `renderScene2(t)`: Logo Reveal ("Meet Grammora. Your AI writing companion.")
- `renderScene3(t)`: Next-Word Prediction ("Predict your next word.")
- `renderScene4(t)`: Multi-Word Autocomplete ("From a few words to a complete thought.")
- `renderScene5(t)`: Grammar Correction ("Fix grammar in a click.")
- `renderScene6(t)`: Expressive Rephrasing ("Say it better.")
- `renderScene7(t)`: Tone Adjustment ("Your message. Your tone.")
- `renderScene8(t)`: Core Benefits ("Write smarter. Stay focused. Keep your flow.")
- `renderScene9(t)`: Final Brand Lockup & CTA

### 2. Regenerating Sound Design
To modify or regenerate the 48 kHz stereo audio:
```bash
node grammora-showcase/src/generate-audio.js
```
This produces `grammora-showcase/output/soundtrack.wav`.

### 3. Re-rendering Master Videos
Prerequisites: Node.js, Playwright, and FFmpeg installed on your system.

Run the multi-worker renderer:
```bash
node grammora-showcase/src/render-video.js
```

This automated pipeline will:
1. Launch 6 parallel headless Chromium workers via Playwright.
2. Render all 1,200 native 1920×1080 frames in parallel.
3. Automatically encode `grammora-showcase-1080p.mp4` via FFmpeg with synced 48kHz AAC audio.
4. Generate the 4:5 vertical adaptation `grammora-showcase-4x5.mp4`.
5. Extract the 1920×1080 cover thumbnail `grammora-showcase-cover.png`.
6. Automatically clean up temporary frame files.

---

## 🚀 LinkedIn Publishing Guide

- **Recommended Video File for Mobile Feed:** `output/grammora-showcase-4x5.mp4` (occupies maximum screen estate in the LinkedIn mobile app).
- **Recommended Video File for Desktop / Video Tab:** `output/grammora-showcase-1080p.mp4`
- **Thumbnail:** Set `output/grammora-showcase-cover.png` as the custom thumbnail.
- **Copy:** Use the provided launch caption located in `showcase_delivery.md`.

