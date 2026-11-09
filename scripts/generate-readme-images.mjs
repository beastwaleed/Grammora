import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = path.resolve('docs/assets');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    body {
      background: transparent;
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 50px;
    }

    .preview-stage {
      display: inline-block;
      padding: 30px 36px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      box-shadow: 0 10px 30px -8px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04);
    }

    /* 1. AUTOCOMPLETE CARD PREVIEW */
    #card-autocomplete {
      width: 760px;
    }

    .editor-line {
      font-size: 16px;
      color: #1E293B;
      line-height: 1.6;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 18px;
    }

    .editor-prompt {
      font-weight: 400;
      color: #334155;
    }

    .editor-cursor {
      display: inline-block;
      width: 2px;
      height: 20px;
      background: #6258E8;
      vertical-align: middle;
      animation: blink 1s infinite;
      margin-right: 6px;
    }

    .ac-popover {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #FFFFFF;
      border: 1.5px solid #818CF8;
      border-radius: 12px;
      padding: 8px 14px;
      box-shadow: 0 8px 24px -4px rgba(99, 102, 241, 0.22), 0 3px 8px -2px rgba(15, 23, 42, 0.06);
    }

    .sparkle-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: #EEF2FF;
      color: #6366F1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      flex-shrink: 0;
    }

    .ac-text {
      font-size: 14px;
      font-weight: 500;
      color: #4338CA;
    }

    .ac-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
    }

    .ac-close {
      color: #94A3B8;
      font-size: 14px;
      cursor: pointer;
      padding: 0 4px;
    }

    .card-footer-caption {
      font-size: 12px;
      color: #64748B;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .caption-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
    }

    /* 2. PEN PILL PREVIEW */
    #card-pen-pill {
      width: 760px;
    }

    .selection-text {
      background: #DDD6FE;
      color: #312E81;
      border-radius: 4px;
      padding: 2px 4px;
      font-weight: 500;
    }

    .pill-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      margin-left: 10px;
    }

    .floating-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: #FFFFFF;
      border: 1.5px solid #A5B4FC;
      border-radius: 50%;
      box-shadow: 0 6px 18px -2px rgba(99, 102, 241, 0.3), 0 2px 6px -1px rgba(15, 23, 42, 0.08);
      position: relative;
    }

    .pill-pen-icon {
      font-size: 16px;
    }

    .pill-dot {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #6366F1;
      border: 2px solid #FFFFFF;
    }

    /* 3. WRITING TOOLBAR PREVIEW */
    #card-toolbar {
      width: 760px;
    }

    .toolbar-container {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 6px 10px;
      box-shadow: 0 10px 28px -4px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.04);
    }

    .brand-square {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%);
      color: #FFFFFF;
      font-weight: 700;
      font-size: 13px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 4px;
    }

    .divider {
      width: 1px;
      height: 22px;
      background: #E2E8F0;
      margin: 0 4px;
    }

    .tb-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid transparent;
      cursor: pointer;
      color: #334155;
      background: #F8FAFC;
    }

    .tb-btn.active {
      background: #EEF2FF;
      color: #4F46E5;
      border-color: #C7D2FE;
    }

    .tb-btn:hover {
      background: #F1F5F9;
      color: #0F172A;
    }

    .tb-close {
      color: #94A3B8;
      padding: 4px 8px;
      font-size: 14px;
    }

    /* 4. DIFF PREVIEW CARD */
    #card-diff {
      width: 620px;
    }

    .diff-box {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      box-shadow: 0 14px 34px -6px rgba(15, 23, 42, 0.16), 0 6px 14px -3px rgba(15, 23, 42, 0.06);
      overflow: hidden;
    }

    .diff-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
    }

    .diff-title {
      font-size: 13px;
      font-weight: 600;
      color: #4338CA;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .diff-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748B;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .badge-ready {
      font-size: 10px;
      font-weight: 600;
      color: #059669;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .original-bubble {
      padding: 10px 12px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 8px;
      color: #991B1B;
      font-size: 13px;
      text-decoration: line-through;
    }

    .suggested-bubble {
      padding: 10px 12px;
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 8px;
      color: #166534;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.5;
    }

    .diff-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
    }

    .btn-secondary {
      padding: 7px 12px;
      font-size: 11.5px;
      font-weight: 600;
      color: #475569;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .btn-primary {
      padding: 7px 16px;
      font-size: 11.5px;
      font-weight: 600;
      color: #FFFFFF;
      background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%);
      border: none;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 4px 10px -2px rgba(99, 102, 241, 0.4);
    }
  </style>
</head>
<body>

  <!-- STAGE 1: AUTOCOMPLETE -->
  <div class="preview-stage" id="card-autocomplete">
    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; font-weight: 700; margin-bottom: 12px;">
      Smart Predictive Autocomplete Preview
    </div>
    <div class="editor-line">
      <span class="editor-prompt">I am writing to inquire about</span>
      <span class="editor-cursor"></span>
      <div class="ac-popover">
        <div class="sparkle-icon">✨</div>
        <div class="ac-text">the availability of a 2-bedroom apartment.</div>
        <div class="ac-badge">
          <span>Tab</span>
          <span style="font-size: 12px;">↵</span>
        </div>
        <div class="ac-close">✕</div>
      </div>
    </div>
    <div class="card-footer-caption">
      <div class="caption-dot"></div>
      <span>Floating inline context card • Press <b>Tab</b> to accept completion, <b>Esc</b> to dismiss</span>
    </div>
  </div>

  <!-- STAGE 2: SELECTION & PEN PILL -->
  <div class="preview-stage" id="card-pen-pill">
    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; font-weight: 700; margin-bottom: 12px;">
      Text Selection & Floating Pen Pill
    </div>
    <div class="editor-line" style="margin-bottom: 14px;">
      <span class="editor-prompt">Please note that </span>
      <span class="selection-text">this sentence have some typo and grammer mistake</span>
      <div class="pill-wrapper">
        <div class="floating-pill">
          <span class="pill-pen-icon">✍️</span>
          <div class="pill-dot"></div>
        </div>
      </div>
      <span class="editor-prompt" style="margin-left: 6px;"> before sending.</span>
    </div>
    <div class="card-footer-caption">
      <div class="caption-dot"></div>
      <span>Select $\ge 3$ characters in any text field to summon the Grammora floating pill</span>
    </div>
  </div>

  <!-- STAGE 3: EXPANDED WRITING TOOLBAR -->
  <div class="preview-stage" id="card-toolbar">
    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; font-weight: 700; margin-bottom: 12px;">
      Expanded AI Writing Toolbar
    </div>
    <div style="margin-bottom: 14px;">
      <div class="toolbar-container">
        <div class="brand-square">G</div>
        <div class="divider"></div>
        <div class="tb-btn active">
          <span>✨</span>
          <span>Fix Grammar</span>
        </div>
        <div class="tb-btn">
          <span>🔄</span>
          <span>Rephrase</span>
        </div>
        <div class="tb-btn">
          <span>💼</span>
          <span>Professional</span>
        </div>
        <div class="tb-btn">
          <span>😊</span>
          <span>Friendly</span>
        </div>
        <div class="tb-btn">
          <span>⚡</span>
          <span>Concise</span>
        </div>
        <div class="divider"></div>
        <div class="tb-close">✕</div>
      </div>
    </div>
    <div class="card-footer-caption">
      <div class="caption-dot"></div>
      <span>Instant 1-click transformations with sub-300ms cloud inference</span>
    </div>
  </div>

  <!-- STAGE 4: DIFF PREVIEW CARD -->
  <div class="preview-stage" id="card-diff">
    <div class="diff-box">
      <div class="diff-header">
        <div class="diff-title">
          <span>🪄</span>
          <span>Grammar Correction</span>
        </div>
        <span style="color: #94A3B8; font-size: 13px; cursor: pointer;">✕</span>
      </div>
      <div class="diff-body">
        <div>
          <div class="section-label">Original Text</div>
          <div class="original-bubble">
            this sentence have some typo and grammer
          </div>
        </div>
        <div>
          <div class="section-label">
            <span>Suggestion</span>
            <span class="badge-ready">Ready to apply</span>
          </div>
          <div class="suggested-bubble">
            This sentence has some typos and grammar mistakes.
          </div>
        </div>
      </div>
      <div class="diff-footer">
        <div class="btn-secondary">
          <span>🔄</span>
          <span>Regenerate (R)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="btn-secondary">Dismiss (Esc)</div>
          <div class="btn-primary">
            <span>✅</span>
            <span>Apply (↵)</span>
          </div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
`;

(async () => {
  console.log('Generating high-resolution workflow preview images...');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1600 },
    deviceScaleFactor: 2, // 2x Retina quality
  });

  await page.setContent(htmlContent);
  await page.waitForLoadState('networkidle');

  // Screenshot individual elements
  const elements = [
    { id: '#card-autocomplete', filename: 'workflow-autocomplete.png' },
    { id: '#card-pen-pill', filename: 'workflow-selection-pill.png' },
    { id: '#card-toolbar', filename: 'workflow-toolbar.png' },
    { id: '#card-diff', filename: 'workflow-diff-preview.png' },
  ];

  for (const item of elements) {
    const el = await page.$(item.id);
    if (el) {
      const outputPath = path.join(OUTPUT_DIR, item.filename);
      await el.screenshot({ path: outputPath });
      console.log('✅ Generated: docs/assets/' + item.filename);
    } else {
      console.error('❌ Could not find element: ' + item.id);
    }
  }

  await browser.close();
  console.log('All workflow images generated successfully!');
})();
