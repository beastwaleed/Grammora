// grammora-showcase/src/generate-audio.js
// 48 kHz, 16-bit stereo PCM WAV sound design generator for Grammora SaaS showcase video

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_RATE = 48000;
const DURATION = 40.0; // 40 seconds
const TOTAL_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);

// Create left and right channel float buffers
const left = new Float32Array(TOTAL_SAMPLES);
const right = new Float32Array(TOTAL_SAMPLES);

// Helper: add sine tone with ADSR envelope
function addTone(freq, startTime, duration, gain = 0.2, pan = 0.0, harmonic = false) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + numSamples);

  const leftGain = gain * Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = gain * Math.sin((pan + 1) * Math.PI / 4);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const progress = t / duration;

    // Smooth attack and decay envelope
    let env = 1.0;
    const attack = Math.min(0.04, duration * 0.15);
    const decay = duration * 0.4;
    if (t < attack) {
      env = t / attack;
    } else {
      env = Math.exp(-(t - attack) / decay);
    }

    let val = Math.sin(2 * Math.PI * freq * t);
    if (harmonic) {
      val += 0.4 * Math.sin(4 * Math.PI * freq * t) + 0.15 * Math.sin(6 * Math.PI * freq * t);
      val /= 1.55;
    }

    left[i] += val * env * leftGain;
    right[i] += val * env * rightGain;
  }
}

// Helper: add mechanical keyboard click sound
function addKeyClick(time, gain = 0.12, pan = 0.0) {
  const startSample = Math.floor(time * SAMPLE_RATE);
  const numSamples = Math.floor(0.025 * SAMPLE_RATE); // 25ms
  const endSample = Math.min(TOTAL_SAMPLES, startSample + numSamples);

  const leftGain = gain * Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = gain * Math.sin((pan + 1) * Math.PI / 4);
  const clickFreq = 1800 + Math.random() * 800;

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const env = Math.exp(-t * 220); // rapid decay
    const noise = (Math.random() * 2 - 1) * 0.6;
    const tone = Math.sin(2 * Math.PI * clickFreq * t) * 0.4;
    const val = (noise + tone) * env;

    left[i] += val * leftGain;
    right[i] += val * rightGain;
  }
}

// Helper: add UI click / pop sound
function addUIPop(time, freq = 900, gain = 0.22, pan = 0.0) {
  const startSample = Math.floor(time * SAMPLE_RATE);
  const numSamples = Math.floor(0.045 * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + numSamples);

  const leftGain = gain * Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = gain * Math.sin((pan + 1) * Math.PI / 4);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const env = Math.exp(-t * 110);
    const val = Math.sin(2 * Math.PI * freq * (1 - t * 8) * t) * env;

    left[i] += val * leftGain;
    right[i] += val * rightGain;
  }
}

// Helper: add swoosh / whoosh transition
function addWhoosh(startTime, duration = 0.6, gain = 0.16, reverse = false) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + numSamples);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / duration;
    const env = Math.sin(Math.PI * t);
    const filterFreq = reverse ? (1.0 - t) * 3000 + 400 : t * 3000 + 400;
    const noise = (Math.random() * 2 - 1);
    const val = noise * env * Math.sin(2 * Math.PI * filterFreq * (t * duration));

    left[i] += val * gain * 0.4;
    right[i] += val * gain * 0.4;
  }
}

// Helper: add sub-bass boom
function addBassBoom(startTime, duration = 1.2, gain = 0.3) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + numSamples);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const env = Math.exp(-t * 3.5);
    const freq = Math.max(38, 90 * Math.exp(-t * 4));
    const val = Math.sin(2 * Math.PI * freq * t) * env;

    left[i] += val * gain;
    right[i] += val * gain;
  }
}

// Helper: add ambient chord pad
function addChordPad(startTime, duration, freqs, gain = 0.08) {
  freqs.forEach((freq, idx) => {
    const pan = (idx / (freqs.length - 1 || 1)) * 1.4 - 0.7;
    addTone(freq, startTime, duration, gain / freqs.length, pan, true);
  });
}

// Helper: add brand chime (C5 -> E5 -> G5 -> C6)
function addBrandChime(startTime, gain = 0.25) {
  const notes = [
    { f: 523.25, t: startTime + 0.00, d: 1.6 },
    { f: 659.25, t: startTime + 0.12, d: 1.8 },
    { f: 783.99, t: startTime + 0.24, d: 2.2 },
    { f: 1046.5, t: startTime + 0.36, d: 2.5 }
  ];
  notes.forEach((n, idx) => {
    const pan = (idx - 1.5) * 0.4;
    addTone(n.f, n.t, n.d, gain, pan, true);
  });
}

console.log('Synthesizing Grammora Sound Design...');

// 1. Ambient harmonic background pads throughout the 40 seconds
// Warm modern tech chords: Cmaj9 -> Am9 -> Fmaj9 -> G6 -> Cmaj9
const padProgressions = [
  { t: 0.0, d: 6.0, freqs: [130.81, 196.00, 261.63, 329.63, 392.00] }, // Cmaj9
  { t: 6.0, d: 10.0, freqs: [146.83, 220.00, 293.66, 369.99, 440.00] }, // D/A
  { t: 16.0, d: 10.0, freqs: [174.61, 261.63, 329.63, 392.00, 523.25] }, // Fmaj9
  { t: 26.0, d: 9.0, freqs: [196.00, 246.94, 293.66, 392.00, 493.88] }, // G6
  { t: 35.0, d: 5.0, freqs: [130.81, 196.00, 261.63, 329.63, 523.25] }  // Final Cmaj
];

padProgressions.forEach(p => {
  addChordPad(p.t, p.d, p.freqs, 0.09);
});

// 2. SCENE 1: The Hook (0.0s - 3.0s)
addBassBoom(0.1, 1.4, 0.28);
addWhoosh(0.15, 0.7, 0.14);
// Typing friction keystrokes & backspaces
const s1Keystrokes = [0.8, 0.92, 1.05, 1.15, 1.28, 1.39, 1.52, 1.62, 1.74, 2.1, 2.18, 2.26, 2.34];
s1Keystrokes.forEach((t, i) => addKeyClick(t, 0.10, (i % 2 === 0 ? -0.2 : 0.2)));

// 3. SCENE 2: Introducing Grammora (3.0s - 6.0s)
addWhoosh(2.9, 0.9, 0.18);
addBassBoom(3.1, 1.2, 0.22);
addBrandChime(3.25, 0.28);

// 4. SCENE 3: Next-Word Prediction (6.0s - 11.0s)
addWhoosh(5.9, 0.6, 0.12);
// Keystrokes for: "I am looking for"
const s3Keystrokes = [
  6.4, 6.55, 6.68, 6.82, 6.95, 7.08, 7.22, 7.36, 7.50, 7.65, 7.80, 7.95, 8.10, 8.24, 8.38
];
s3Keystrokes.forEach((t, i) => addKeyClick(t, 0.09, (i % 3 === 0 ? -0.15 : 0.15)));
// Ghost appearance shimmer
addTone(880, 8.5, 0.8, 0.14, 0.2, true);
// Tab key accept thud
addUIPop(9.2, 600, 0.25, 0.0);
addTone(523.25, 9.2, 0.9, 0.18, 0.1, true);

// 5. SCENE 4: Multi-Word Autocomplete (11.0s - 16.0s)
addWhoosh(10.9, 0.6, 0.12);
// Keystrokes for: "I would like to apply"
const s4Keystrokes = [
  11.4, 11.52, 11.65, 11.78, 11.90, 12.02, 12.15, 12.28, 12.40, 12.52, 12.65, 12.78, 12.90, 13.02, 13.15, 13.28, 13.40
];
s4Keystrokes.forEach((t, i) => addKeyClick(t, 0.09, (i % 2 === 0 ? -0.18 : 0.18)));
// Dropdown expand chime
addTone(659.25, 13.6, 1.0, 0.16, 0.1, true);
addTone(783.99, 13.72, 1.2, 0.18, -0.1, true);
// Tab accept
addUIPop(14.5, 550, 0.26, 0.0);
addTone(1046.5, 14.5, 1.2, 0.20, 0.0, true);

// 6. SCENE 5: Grammar Correction (16.0s - 21.0s)
addWhoosh(15.9, 0.6, 0.14);
// Pen button click
addUIPop(17.2, 850, 0.22, 0.1);
// Fix grammar click
addUIPop(18.0, 1100, 0.24, -0.1);
// AI sparkle flutter
addTone(1174.66, 18.2, 0.5, 0.12, 0.2, false);
addTone(1318.51, 18.3, 0.6, 0.14, -0.2, false);
// Diff card slide-in whoosh
addWhoosh(18.15, 0.5, 0.12);
// Apply button confirmation click
addUIPop(19.8, 650, 0.28, 0.0);
addTone(587.33, 19.8, 1.1, 0.22, 0.0, true);

// 7. SCENE 6: Expressive Rephrasing (21.0s - 26.0s)
addWhoosh(20.9, 0.6, 0.14);
addUIPop(22.2, 950, 0.22, 0.0);
// Rephrase AI sparkle processing
addTone(783.99, 22.8, 0.8, 0.15, -0.15, true);
addTone(987.77, 23.0, 0.9, 0.16, 0.15, true);
// Apply
addUIPop(24.6, 700, 0.26, 0.0);
addTone(659.25, 24.6, 1.2, 0.22, 0.0, true);

// 8. SCENE 7: Tone Adjustment (26.0s - 31.0s)
addWhoosh(25.9, 0.6, 0.14);
// Menu expand
addUIPop(27.0, 900, 0.20, 0.1);
// Professional select click
addUIPop(28.1, 1200, 0.25, 0.1);
addTone(880, 28.1, 0.9, 0.18, 0.1, true);
// Text transform smooth sweep
addWhoosh(28.4, 0.8, 0.14);
addTone(523.25, 29.2, 1.4, 0.20, 0.0, true);

// 9. SCENE 8: Core Benefits (31.0s - 35.0s)
addWhoosh(30.9, 0.7, 0.16);
addBassBoom(31.2, 1.1, 0.22);
// Card 1 impact
addTone(392.00, 31.4, 1.2, 0.18, -0.3, true);
// Card 2 impact
addTone(493.88, 32.2, 1.2, 0.20, 0.0, true);
// Card 3 impact
addTone(587.33, 33.0, 1.2, 0.22, 0.3, true);

// 10. SCENE 9: Brand Reveal & CTA (35.0s - 40.0s)
addWhoosh(34.8, 0.9, 0.20);
addBassBoom(35.2, 1.8, 0.32);
// Grand Final Brand Chime
addBrandChime(35.3, 0.35);
// Secondary resolution sparkle
addTone(1318.51, 36.5, 2.0, 0.15, 0.2, true);
addTone(1567.98, 36.7, 2.2, 0.12, -0.2, true);

// Normalize and master into 16-bit stereo PCM WAV
let maxPeak = 0.0001;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  if (Math.abs(left[i]) > maxPeak) maxPeak = Math.abs(left[i]);
  if (Math.abs(right[i]) > maxPeak) maxPeak = Math.abs(right[i]);
}

const targetPeak = 0.92;
const normFactor = targetPeak / Math.max(0.7, maxPeak);

// Create WAV header
const numChannels = 2;
const bitsPerSample = 16;
const byteRate = (SAMPLE_RATE * numChannels * bitsPerSample) / 8;
const blockAlign = (numChannels * bitsPerSample) / 8;
const dataSize = TOTAL_SAMPLES * blockAlign;
const buffer = Buffer.alloc(44 + dataSize);

// RIFF chunk descriptor
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);

// fmt sub-chunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(bitsPerSample, 34);

// data sub-chunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Write PCM samples with soft limiter
let offset = 44;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  let l = Math.tanh(left[i] * normFactor);
  let r = Math.tanh(right[i] * normFactor);

  const l16 = Math.max(-32768, Math.min(32767, Math.floor(l * 32767)));
  const r16 = Math.max(-32768, Math.min(32767, Math.floor(r * 32767)));

  buffer.writeInt16LE(l16, offset);
  buffer.writeInt16LE(r16, offset + 2);
  offset += 4;
}

const outDir = path.resolve(__dirname, '../output');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, 'soundtrack.wav');
fs.writeFileSync(outPath, buffer);
console.log(`Soundtrack generated successfully: ${outPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB, 40.0s @ 48kHz Stereo)`);

