// grammora-showcase/src/generate-audio.js
// 48 kHz, 16-bit stereo PCM WAV sound design generator for Grammora SaaS showcase video
// Quick, snappy, modern SFX with short decays

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_RATE = 48000;
const DURATION = 40.0; // 40 seconds
const TOTAL_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);

const left = new Float32Array(TOTAL_SAMPLES);
const right = new Float32Array(TOTAL_SAMPLES);

// Helper: add sine tone with quick ADSR envelope
function addTone(freq, startTime, duration = 0.35, gain = 0.18, pan = 0.0, harmonic = false) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + numSamples);

  const leftGain = gain * Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = gain * Math.sin((pan + 1) * Math.PI / 4);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;

    // Quick snappy envelope
    let env = 1.0;
    const attack = 0.008; // 8ms fast attack
    const decay = duration * 0.35;
    if (t < attack) {
      env = t / attack;
    } else {
      env = Math.exp(-(t - attack) / decay);
    }

    let val = Math.sin(2 * Math.PI * freq * t);
    if (harmonic) {
      val += 0.35 * Math.sin(4 * Math.PI * freq * t) + 0.12 * Math.sin(6 * Math.PI * freq * t);
      val /= 1.47;
    }

    left[i] += val * env * leftGain;
    right[i] += val * env * rightGain;
  }
}

// Helper: quick, crisp mechanical key click (12ms)
function addKeyClick(time, gain = 0.10, pan = 0.0) {
  const startSample = Math.floor(time * SAMPLE_RATE);
  const numSamples = Math.floor(0.015 * SAMPLE_RATE); // 15ms
  const endSample = Math.min(TOTAL_SAMPLES, startSample + numSamples);

  const leftGain = gain * Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = gain * Math.sin((pan + 1) * Math.PI / 4);
  const clickFreq = 2200 + Math.random() * 600;

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const env = Math.exp(-t * 380); // very fast decay
    const noise = (Math.random() * 2 - 1) * 0.55;
    const tone = Math.sin(2 * Math.PI * clickFreq * t) * 0.45;
    const val = (noise + tone) * env;

    left[i] += val * leftGain;
    right[i] += val * rightGain;
  }
}

// Helper: quick snappy UI click / pop (20ms)
function addUIPop(time, freq = 1100, gain = 0.20, pan = 0.0) {
  const startSample = Math.floor(time * SAMPLE_RATE);
  const numSamples = Math.floor(0.025 * SAMPLE_RATE); // 25ms
  const endSample = Math.min(TOTAL_SAMPLES, startSample + numSamples);

  const leftGain = gain * Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = gain * Math.sin((pan + 1) * Math.PI / 4);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const env = Math.exp(-t * 190);
    const val = Math.sin(2 * Math.PI * freq * (1 - t * 12) * t) * env;

    left[i] += val * leftGain;
    right[i] += val * rightGain;
  }
}

// Helper: quick whoosh transition (0.28s max)
function addWhoosh(startTime, duration = 0.28, gain = 0.14, reverse = false) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + numSamples);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / duration;
    const env = Math.sin(Math.PI * t);
    const filterFreq = reverse ? (1.0 - t) * 2600 + 500 : t * 2600 + 500;
    const noise = (Math.random() * 2 - 1);
    const val = noise * env * Math.sin(2 * Math.PI * filterFreq * (t * duration));

    left[i] += val * gain * 0.45;
    right[i] += val * gain * 0.45;
  }
}

// Helper: punchy short sub-bass impact (0.35s)
function addBassBoom(startTime, duration = 0.35, gain = 0.22) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + numSamples);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const env = Math.exp(-t * 9.0); // fast decay
    const freq = Math.max(45, 110 * Math.exp(-t * 8));
    const val = Math.sin(2 * Math.PI * freq * t) * env;

    left[i] += val * gain;
    right[i] += val * gain;
  }
}

// Helper: subtle background chord bed
function addChordPad(startTime, duration, freqs, gain = 0.04) {
  freqs.forEach((freq, idx) => {
    const pan = (idx / (freqs.length - 1 || 1)) * 1.4 - 0.7;
    addTone(freq, startTime, duration, gain / freqs.length, pan, true);
  });
}

// Helper: quick, bright modern brand chime (0.7s total)
function addBrandChime(startTime, gain = 0.24) {
  const notes = [
    { f: 523.25, t: startTime + 0.00, d: 0.5 },
    { f: 659.25, t: startTime + 0.08, d: 0.55 },
    { f: 783.99, t: startTime + 0.16, d: 0.65 },
    { f: 1046.5, t: startTime + 0.24, d: 0.75 }
  ];
  notes.forEach((n, idx) => {
    const pan = (idx - 1.5) * 0.35;
    addTone(n.f, n.t, n.d, gain, pan, true);
  });
}

console.log('Synthesizing quick, punchy Grammora Sound Design...');

// 1. Light background pads
const padProgressions = [
  { t: 0.0, d: 6.0, freqs: [130.81, 196.00, 261.63, 329.63] },
  { t: 6.0, d: 10.0, freqs: [146.83, 220.00, 293.66, 369.99] },
  { t: 16.0, d: 10.0, freqs: [174.61, 261.63, 329.63, 392.00] },
  { t: 26.0, d: 9.0, freqs: [196.00, 246.94, 293.66, 392.00] },
  { t: 35.0, d: 5.0, freqs: [130.81, 196.00, 261.63, 523.25] }
];

padProgressions.forEach(p => {
  addChordPad(p.t, p.d, p.freqs, 0.045);
});

// 2. SCENE 1: The Hook (0.0s - 3.0s)
// Clean quick impact
addBassBoom(0.08, 0.35, 0.24);
addWhoosh(0.12, 0.25, 0.12);

// Readable typing friction keystrokes & backspaces
const s1Keystrokes = [
  0.40, 0.52, 0.64, 0.76, 0.88, 1.00, 1.12, 1.24, 1.36, 1.48, // "I am writing to askk"
  1.92, 2.04, 2.16, 2.28 // backspace taps
];
s1Keystrokes.forEach((t, i) => addKeyClick(t, 0.11, (i % 2 === 0 ? -0.15 : 0.15)));
// Typo warning tick
addUIPop(1.50, 480, 0.15, 0.1);

// 3. SCENE 2: Introducing Grammora (3.0s - 6.0s)
addWhoosh(2.95, 0.28, 0.14);
addBassBoom(3.1, 0.32, 0.20);
addBrandChime(3.18, 0.26);

// 4. SCENE 3: Next-Word Prediction (6.0s - 11.0s)
addWhoosh(5.95, 0.25, 0.12);
// Keystrokes for: "Thank you for the quick"
const s3Keystrokes = [
  6.30, 6.42, 6.54, 6.66, 6.78, 6.90, 7.02, 7.14, 7.26, 7.38, 7.50, 7.62, 7.74, 7.86, 7.98, 8.10, 8.22
];
s3Keystrokes.forEach((t, i) => addKeyClick(t, 0.09, (i % 2 === 0 ? -0.12 : 0.12)));
// Ghost appearance pop
addTone(960, 8.4, 0.3, 0.12, 0.15, true);
// Tab key accept click
addUIPop(9.1, 750, 0.22, 0.0);
addTone(659.25, 9.1, 0.45, 0.16, 0.1, true);

// 5. SCENE 4: Multi-Word Autocomplete (11.0s - 16.0s)
addWhoosh(10.95, 0.25, 0.12);
// Keystrokes for: "I would like to schedule a quick"
const s4Keystrokes = [
  11.30, 11.42, 11.54, 11.66, 11.78, 11.90, 12.02, 12.14, 12.26, 12.38, 12.50, 12.62, 12.74, 12.86, 12.98, 13.10
];
s4Keystrokes.forEach((t, i) => addKeyClick(t, 0.09, (i % 2 === 0 ? -0.14 : 0.14)));
// Dropdown pop
addTone(783.99, 13.4, 0.4, 0.15, 0.1, true);
// Tab accept click
addUIPop(14.3, 620, 0.24, 0.0);
addTone(1046.5, 14.3, 0.5, 0.18, 0.0, true);

// 6. SCENE 5: Grammar Correction (16.0s - 21.0s)
addWhoosh(15.95, 0.25, 0.12);
// Pen button click
addUIPop(17.2, 900, 0.20, 0.1);
// Fix grammar click
addUIPop(18.0, 1200, 0.22, -0.1);
addTone(1318.51, 18.1, 0.35, 0.14, 0.15, false);
// Apply button click
addUIPop(19.8, 700, 0.24, 0.0);
addTone(587.33, 19.8, 0.5, 0.18, 0.0, true);

// 7. SCENE 6: Expressive Rephrasing (21.0s - 26.0s)
addWhoosh(20.95, 0.25, 0.12);
addUIPop(22.2, 1000, 0.20, 0.0);
addTone(880, 22.8, 0.4, 0.14, 0.1, true);
addUIPop(24.5, 750, 0.22, 0.0);
addTone(659.25, 24.5, 0.5, 0.18, 0.0, true);

// 8. SCENE 7: Tone Adjustment (26.0s - 31.0s)
addWhoosh(25.95, 0.25, 0.12);
addUIPop(27.0, 950, 0.18, 0.1);
addUIPop(28.1, 1250, 0.22, 0.1);
addWhoosh(28.3, 0.25, 0.12);
addTone(523.25, 28.8, 0.6, 0.18, 0.0, true);

// 9. SCENE 8: Core Benefits (31.0s - 35.0s)
addWhoosh(30.95, 0.28, 0.14);
addBassBoom(31.1, 0.3, 0.20);
addTone(392.00, 31.3, 0.45, 0.16, -0.25, true);
addTone(493.88, 32.1, 0.45, 0.18, 0.0, true);
addTone(587.33, 32.9, 0.45, 0.20, 0.25, true);

// 10. SCENE 9: Brand Reveal & CTA (35.0s - 40.0s)
addWhoosh(34.85, 0.32, 0.16);
addBassBoom(35.1, 0.45, 0.25);
addBrandChime(35.2, 0.30);
addTone(1318.51, 36.3, 0.6, 0.14, 0.15, true);

// Normalize and master into 16-bit stereo PCM WAV
let maxPeak = 0.0001;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  if (Math.abs(left[i]) > maxPeak) maxPeak = Math.abs(left[i]);
  if (Math.abs(right[i]) > maxPeak) maxPeak = Math.abs(right[i]);
}

const targetPeak = 0.90;
const normFactor = targetPeak / Math.max(0.7, maxPeak);

const numChannels = 2;
const bitsPerSample = 16;
const byteRate = (SAMPLE_RATE * numChannels * bitsPerSample) / 8;
const blockAlign = (numChannels * bitsPerSample) / 8;
const dataSize = TOTAL_SAMPLES * blockAlign;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(bitsPerSample, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

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
console.log(`Quick SFX soundtrack generated: ${outPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
