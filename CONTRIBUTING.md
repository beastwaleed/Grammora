# Contributing to Grammora ✍️✨

Thank you for your interest in contributing to **Grammora**! Grammora is an open-source, AI-powered writing assistant and Chrome extension inspired by Grammarly.

This document outlines the guidelines and workflow for contributing to the project.

---

## 📋 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful and constructive in all discussions, issues, and pull requests.

---

## 🛠️ Tech Stack & Architecture

- **Extension Framework:** [WXT](https://wxt.dev/) with Chrome Manifest V3
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend API:** Node.js, Express, TypeScript, Zod validation
- **AI Gateway:** Multi-provider architecture with Groq (primary), Google Gemini (backup), and local Mock fallback
- **Storage:** `chrome.storage.local`
- **Testing:** Vitest for unit & integration tests, Supertest for Express endpoints

Review the detailed architectural specifications in [`docs/architecture.md`](docs/architecture.md) and design tokens in [`docs/design-system.md`](docs/design-system.md) before submitting major changes.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Google Chrome** (or Chromium-based browser)

### 2. Clone and Install
```bash
git clone https://github.com/beastwaleed/Grammora.git
cd Grammora

# Install root workspace and subpackage dependencies
npm install
```

### 3. Backend Environment Setup
Create a `.env` file inside `server/` (see `server/.env.example`):
```env
PORT=3001
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
REQUEST_TIMEOUT_MS=12000
MAX_REQUESTS_PER_MINUTE=60
MAX_INPUT_CHARACTERS=4000
ALLOWED_ORIGINS=chrome-extension://*,http://localhost:*
```

### 4. Build and Run
```bash
# Build the Express backend
npm run build:server

# Start the Express server
node server/dist/index.js

# In another terminal, build the extension
npm run build:extension
```

### 5. Load the Extension in Chrome
1. Navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top right.
3. Click **Load unpacked** and select the folder: `extension/.output/chrome-mv3`.
4. Open [`tests/manual/test-page.html`](tests/manual/test-page.html) to test features interactively.

---

## 🧪 Testing

All pull requests must pass the automated test suite before merging:
```bash
# Run Vitest unit & API integration tests
npm test

# Run tests in watch mode
npm run test:watch
```

When modifying editor adapters or replacement logic, also verify manually in `tests/manual/test-page.html` across:
- Standard `<textarea>`
- Single-line `<input type="text">`
- Rich `<div contenteditable="true">`
- Excluded sensitive fields (passwords, credit card inputs, `data-grammora-ignore="true"`)

---

## 🎨 UI/UX Design System Guidelines

All user interfaces in Grammora (popup, toolbar, preview cards, autocomplete popups) must strictly adhere to the unified design system:
- **Brand Tokens:** Use semantic tokens defined in `extension/styles/tokens.css` (e.g. `brand-500`, `surface-subtle`, `content-main`).
- **Typography:** Strict Inter typography hierarchy.
- **Shadow DOM Isolation:** Any DOM injected into target webpages must remain encapsulated within the `#grammora-host` Shadow DOM to guarantee zero CSS collisions with host websites.
- **Accessibility:** Ensure visible focus rings, WCAG 2.2 AA contrast ratios, and keyboard shortcuts (`Tab` to accept, `Esc` to dismiss, `Enter` to apply).

---

## 🔒 Security & Privacy Invariants

Any contribution must preserve Grammora's strict privacy guarantees:
1. **Zero Keystroke Telemetry:** Never send continuous keystrokes. Autocomplete requests must only capture bounded preceding context (max 250 characters) after a pause (debounce).
2. **Explicit User Replacement:** Never overwrite user content automatically without explicit user action (`Apply` or `Tab`).
3. **No Sensitive Field Capture:** Never attach listeners to password, credit card, or developer-ignored fields.
4. **No Plaintext Logging:** The backend server must never log user text payloads or store them in permanent databases.

---

## 📮 Pull Request Process

1. Fork the repository and create a descriptive feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes following the coding standards and guidelines.
3. Ensure all tests pass with `npm test`.
4. Commit your changes with clear, semantic commit messages:
   ```bash
   git commit -m "feat(autocomplete): add keyboard shortcut preview"
   ```
5. Push to your fork and submit a Pull Request against the `main` branch.
6. Provide a clear description of the problem solved, testing steps, and screenshots or GIFs of any UI changes.

Thank you for helping make Grammora better for everyone! 🚀

