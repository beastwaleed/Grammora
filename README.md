# Grammora ✍️✨

> **Grammora** is a production-grade, open-source AI-powered Chrome extension and writing companion inspired by Grammarly. It helps you write faster and more professionally across supported websites with real-time word predictions, sentence completions, grammar/spelling corrections, and contextual tone adjustments.

---

## 🌟 Key Features

### 1. Smart Predictive Autocomplete
- **Context-Aware Continuations:** Generates relevant phrase completions based on bounded preceding text.
- **Configurable Lengths:** Choose between **Short** (~3–6 words) and **Medium** (~10–18 words).
- **Non-Intrusive Floating Suggestion:** Discreet suggestion card positioned directly beside your typing cursor.
- **Keyboard First:** Press `Tab` or click to accept; press `Esc` or move the cursor to dismiss.
- **Intelligent Debounce:** 350ms pause detection to avoid interrupting active typing.

### 2. Floating Writing Toolbar & Text Selection
- **Discreet Pen Pill:** Appears automatically when highlighting 3 or more characters in any eligible editor.
- **Unified Action Toolbar:**
  - 🪄 **Fix Grammar:** Corrects spelling mistakes, typos, subject-verb agreement, and punctuation while preserving original meaning.
  - 🔄 **Rephrase:** Improves fluency, elegance, and sentence flow without adding unsupported facts.
  - 💼 **Professional Tone:** Shifts casual writing into polished executive and workplace correspondence.
  - 😊 **Friendly Tone:** Transforms text into a warm, engaging, and conversational voice.
  - ⚡ **Concise Mode:** Ruthlessly eliminates filler words, redundancies, and fluff to produce punchy sentences.
- **Interactive Diff Preview:** Displays original versus AI suggestion before applying.
- **Undo-Safe Replacement:** Replaces selected text using native browser APIs (`execCommand` / `Range`), preserving `Ctrl+Z` undo stacks.

### 3. Privacy-First Architecture
- **Zero Keystroke Logging:** Bounded context (up to 250 characters preceding the caret) is collected only after typing stops.
- **Sensitive Field Protection:** Password inputs, credit card fields (`autocomplete="cc-number"`), OTPs, and developer-ignored elements (`data-grammora-ignore="true"`) are strictly ignored.
- **One-Click Site Exclusions:** Exclude any domain (banking portals, internal work apps) directly from the popup.
- **No Database / Plaintext Storage:** User writing is processed in-memory and never saved to persistent databases or logs.

---

## 🏗️ Architecture & Technology Stack

```
                               ┌────────────────────────────────────────┐
                               │             Host Webpage               │
                               │  (<textarea>, <input>, [contentedit])  │
                               └──────────────────┬─────────────────────┘
                                                  │ User Input / Selection
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │     Grammora Shadow DOM Container      │
                               │  - Floating Pen Pill & Writing Toolbar │
                               │  - Interactive Diff Preview Card       │
                               │  - Predictive Autocomplete Card        │
                               └──────────────────┬─────────────────────┘
                                                  │ chrome.runtime.sendMessage
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │   Chrome MV3 Background Worker         │
                               │   (Exempt from webpage CORS & CSP)     │
                               └──────────────────┬─────────────────────┘
                                                  │ HTTP POST (port 3001)
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │   Grammora Express AI Gateway          │
                               │   ├── Groq Provider (Primary, ~250ms)  │
                               │   ├── Gemini Provider (Secondary)      │
                               │   └── Local Mock Engine (Fallback)     │
                               └────────────────────────────────────────┘
```

### Chrome Extension (Manifest V3)
- **Framework:** [WXT](https://wxt.dev/) 0.21.5
- **UI Engine:** React 19 + TypeScript
- **Styling:** Tailwind CSS embedded into an isolated **Shadow DOM** (`#grammora-host`)
- **Storage:** `chrome.storage.local` with reactive popup synchronization

### Backend AI Gateway
- **Runtime:** Node.js + Express + TypeScript
- **Primary AI Provider:** **Groq** (`qwen/qwen3.8-27b`) delivering ~200–350ms inference latency
- **Secondary (Backup) Provider:** **Google Gemini** (`gemini-1.5-flash`) with automatic failover
- **Offline / Dev Mode:** Local deterministic mock engine for continuous offline operation
- **Validation & Security:** Zod schemas, CORS filtering, and rate limiting (60 req/min)

---

## 🎨 Design System

Grammora’s interface is crafted with **UI/UX Pro Max** standards for compact browser extensions:
- **Primary Palette:** Brand Indigo (`#6258E8`), Hover Deep Indigo (`#5147D4`), Soft Lavender (`#F0EEFF`).
- **Surface & Text:** Crisp White (`#FFFFFF`), Subtle Slate (`#F8FAFC`), Deep Slate Text (`#172033`).
- **Semantic Colors:** Emerald Success (`#16A34A`), Crimson Error (`#DC2626`).
- **Typography:** Strict Inter hierarchy with consistent sizing (`10px`–`15px`).
- **Zero Style Leakage:** All toolbar and card styles are injected into an isolated Shadow DOM, preventing any collision with host website stylesheets.

Full design specifications: [`docs/design-system.md`](docs/design-system.md).

---

## 📁 Repository Structure

```
grammora/
├── extension/                     # Chrome Extension source (WXT + React)
│   ├── entrypoints/
│   │   ├── background.ts          # MV3 Service Worker (message proxy & gateway client)
│   │   ├── content.tsx            # Shadow DOM mount, selection & typing listeners
│   │   └── popup/                 # Extension popup UI & Settings modal
│   ├── adapters/                  # DOM adapters (editor inspection, coordinates, replacement)
│   ├── components/                # React components (PenPill, WritingToolbar, AutocompleteCard)
│   ├── lib/                       # Settings store, messaging types, API client
│   └── styles/                    # Design tokens and Tailwind styles
├── server/                        # Express AI Gateway (Node.js + TypeScript)
│   ├── src/
│   │   ├── providers/             # Swappable AI providers (Groq, Gemini, Mock, Manager)
│   │   ├── prompts/               # System and task-specific prompt builders
│   │   ├── routes/                # Endpoints (/grammar, /rewrite, /tone, /autocomplete)
│   │   └── middleware/            # Rate limiting, validation, error handler
├── tests/
│   ├── unit/                      # Vitest unit tests (37 tests)
│   ├── e2e/                       # Playwright browser integration tests (8 tests)
│   └── manual/test-page.html      # Interactive HTML test playground
├── docs/                          # Architecture, privacy, design system, compatibility
├── CONTRIBUTING.md                # Open-source contribution guidelines
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Google Chrome** (or any Chromium browser: Brave, Edge, Arc)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/beastwaleed/Grammora.git
cd Grammora

# Install workspace dependencies
npm install
```

### 3. Configure API Keys
Create or update `server/.env`:
```env
PORT=3001
AI_PROVIDER=groq

# Primary AI Provider: Groq (ultra-fast inference)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b

# Secondary Backup: Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

REQUEST_TIMEOUT_MS=12000
MAX_REQUESTS_PER_MINUTE=60
MAX_INPUT_CHARACTERS=4000
ALLOWED_ORIGINS=chrome-extension://*,http://localhost:*
```

### 4. Build and Start the AI Gateway
```bash
# Build the server
npm run build:server

# Start the server daemon
node server/dist/index.js
```
The server will start on `http://localhost:3001` and display provider statuses.

### 5. Build and Load the Chrome Extension
```bash
# Build the extension for Chrome Manifest V3
npm run build:extension
```
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in top right).
3. Click **Load unpacked**.
4. Select the build directory: `d:\Waleed\Grammora\extension\.output\chrome-mv3`.
5. The **Grammora** icon is now installed in your browser!

---

## 🧪 Testing

### Automated Test Suites (45 Tests Passing)

```bash
# 1. Run Vitest Unit & API Integration Tests (37 tests)
npm test

# 2. Run Playwright Browser E2E Tests (8 tests in real Chromium)
npm run test:e2e

# 3. Run all tests
npm run test:all
```

### Interactive Manual Testing
Open `http://localhost:3001/test/test-page.html` in Chrome:
- **Typo & Grammar Correction:** Click *"Load Typo & Grammar Sample"* $\rightarrow$ select text $\rightarrow$ click floating purple pen $\rightarrow$ click **Fix Grammar** $\rightarrow$ review diff and click **Apply**.
- **Concise Mode:** Click *"Load Wordy Sample"* $\rightarrow$ select text $\rightarrow$ click pen $\rightarrow$ click **Concise** $\rightarrow$ click **Apply**.
- **Smart Autocomplete:** Type `"I am looking for"` and pause for 350ms $\rightarrow$ autocomplete popover appears $\rightarrow$ press `Tab` to insert.
- **Sensitive Field Protection:** Verify password and credit card fields completely suppress the extension.

---

## 🤝 Contributing

Contributions are warmly welcomed! Please read our [Contributing Guide](CONTRIBUTING.md) for details on code style, testing guidelines, and submitting pull requests.

---

## 📜 License

Grammora is open-source software licensed under the [MIT License](LICENSE).
