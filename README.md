# Grammora ✍️✨

> **Grammora** is an open-source, AI-powered Chrome extension and writing companion inspired by Grammarly. It helps you write more efficiently and professionally across supported web applications using AI-driven word predictions, sentence completions, grammar correction, and tone adjustments.

---

## 🌟 Key Features

1. **Context-Aware Autocomplete**
   - Non-intrusive word and multi-word phrase completions.
   - Configurable debounce (default 350ms) and completion lengths (*Short* ~3–6 words, *Medium* ~10–18 words).
   - Dismissible with `Esc`, acceptable via `Tab` or click.

2. **Smart Selection Toolbar**
   - Appears via an elegant floating pen icon when text is highlighted.
   - Preserves focus, selection markers, and native editor undo history.

3. **Writing Transformations**
   - **Fix Grammar:** Corrects spelling, punctuation, and syntax while preserving technical vocabulary.
   - **Rephrase:** Improves fluency and natural expression without hallucinating unsupported facts.
   - **Tone Adjustment:** Instantly shift writing into **Professional**, **Friendly**, or **Concise** styles.

4. **Privacy-First & Secure**
   - **Meaningful Consent:** Cloud AI is disabled until explicit first-run opt-in.
   - **Zero Keystroke Telemetry:** Bounded context only (up to 250 characters preceding the cursor).
   - **Sensitive Field Exclusions:** Automatic bypassing of passwords, credit cards, OTPs, and developer-ignored fields (`data-grammora-ignore="true"`).
   - **Per-Site Controls:** One-click exclusion toggle for any domain (banking, work intranets, etc.).
   - **No Plaintext Logging:** The backend never stores user writing history in databases or logs.

---

## 🎨 Design System

Grammora's user interface is built on a custom design system designed with **UI/UX Pro Max**:
- **Color Palette:** Indigo primary (`#6258E8`), deep indigo hover (`#5147D4`), violet soft surfaces (`#F0EEFF`), slate text (`#172033`), and emerald success (`#16A34A`).
- **Typography:** Strict **Inter** typography scale across all surfaces.
- **Style Isolation:** Injected writing toolbars and suggestion cards are encapsulated inside a **Shadow DOM** container, ensuring zero CSS interference with the host webpage.
- **Accessible:** Meets WCAG 2.2 AA contrast standards, visible focus indicators, and reduced-motion compliance.

For the full specification, see [`docs/design-system.md`](docs/design-system.md).

---

## 📁 Repository Structure

```
grammora/
├── extension/                     # Chrome Extension (Manifest V3 + WXT + React + Tailwind)
│   ├── entrypoints/
│   │   ├── background.ts          # MV3 Service Worker (message coordinator & storage proxy)
│   │   ├── content.ts             # Webpage content script (DOM observer & editor detector)
│   │   └── popup/                 # Extension popup interface & settings
│   ├── adapters/                  # Standardized editor adapters (textarea, input, contenteditable)
│   ├── components/                # Reusable UI components (ToggleSwitch, ConsentBanner, etc.)
│   ├── lib/                       # Typed messaging, settings store, API clients
│   ├── styles/                    # Design tokens and Tailwind stylesheet
│   ├── public/                    # Assets and extension brand icons (16, 32, 48, 128px)
│   └── wxt.config.ts              # WXT build configuration
├── server/                        # Express API Backend (Node.js + TypeScript) [Phase 3]
│   └── src/
│       ├── routes/                # API task routes (autocomplete, grammar, rewrite, tone)
│       ├── providers/             # Swappable AI adapters (Mock, Hugging Face, OpenAI)
│       └── middleware/            # Rate limiting, validation, and CORS security
├── tests/
│   ├── unit/                      # Vitest unit tests
│   └── manual/test-page.html      # Local HTML test playground with multiple editor types
├── docs/
│   ├── architecture.md            # Detailed technical architecture & sequence flows
│   ├── design-system.md           # Visual specification & design tokens
│   ├── privacy.md                 # Security & responsible AI policies
│   └── compatibility.md           # Editor compatibility matrix
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Google Chrome** (or any Chromium browser: Brave, Edge, Arc)

### 1. Build the Extension
```bash
# Navigate to extension directory
cd extension

# Install dependencies
npm install

# Build extension for Chrome Manifest V3
npm run build
```
The compiled, ready-to-load extension will be located in `extension/.output/chrome-mv3`.

### 2. Load Extension in Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle in the upper-right corner.
3. Click **Load unpacked**.
4. Select the directory: `d:\Waleed\Grammora\extension\.output\chrome-mv3`.
5. The **Grammora** icon will appear in your Chrome toolbar!

### 3. Verify with the Test Playground
Open `tests/manual/test-page.html` directly in Chrome:
- Check that the Grammora popup displays the current domain and master controls.
- Test typing in the `<textarea>`, `<input>`, and `contenteditable` fields.
- Verify that password and credit-card fields are automatically excluded.

---

## 🧪 Testing

```bash
# Run unit tests
npm test
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
