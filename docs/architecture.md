# Grammora System Architecture

**Product:** Grammora — Open-Source AI Writing Assistant  
**Specification Reference:** SRS v1.0 Baseline  
**Architecture Pattern:** Client-Side Manifest V3 Extension with Express Gateway & Modular AI Adapter

---

## 1. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
| Host Webpage (DOM)                                                      |
|   +------------------------------------------------------------------+  |
|   | Editable Element: <textarea> | <input> | [contenteditable]       |  |
|   +------------------------------------------------------------------+  |
|                                ^                                        |
|                          DOM & Selection                                |
|                                v                                        |
|   +------------------------------------------------------------------+  |
|   | Grammora Shadow DOM Container (z-index: 2147483647)              |  |
|   |   +-------------------+  +-------------------+  +--------------+ |  |
|   |   | Floating Pen Pill |  | Expanded Toolbar  |  | Diff Preview | |  |
|   |   +-------------------+  +-------------------+  +--------------+ |  |
|   +------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
                                 ^
                          Custom Events /
                          DOM Observers
                                 v
+-------------------------------------------------------------------------+
| Grammora Content Script (extension/entrypoints/content.ts)              |
|   - Editor Detector (Native textarea/input & basic contenteditable)     |
|   - TextareaAdapter & ContentEditableAdapter                            |
|   - Selection Coordinator & Caret Coordinate Tracker                    |
|   - Typing Debounce Engine (default 350ms)                              |
|   - Request Sequencer & Stale Response Invalidation Guard               |
+-------------------------------------------------------------------------+
                                 ^
                       chrome.runtime.sendMessage
                                 v
+-------------------------------------------------------------------------+
| Background Service Worker (extension/entrypoints/background.ts)        |
|   - Extension Lifecycle Coordinator                                     |
|   - Local Storage Proxy (chrome.storage.local)                          |
|   - Network Dispatcher to Backend API (fetches with timeouts)           |
+-------------------------------------------------------------------------+
                                 ^
                        HTTP REST / JSON (CORS)
                                 v
+-------------------------------------------------------------------------+
| Grammora Backend Gateway (server/src/index.ts)                          |
|   - Rate Limiter & Abuse Protection Middleware                          |
|   - Request Schema Validators (Zod / JSON Schema)                       |
|   - Task Endpoints:                                                     |
|       GET  /api/health                                                  |
|       POST /api/autocomplete                                            |
|       POST /api/grammar                                                 |
|       POST /api/rewrite                                                 |
|       POST /api/tone                                                    |
|   - Prompt Builder (Strict instruction formatting)                      |
|   - AI Provider Adapter (HuggingFace / OpenAI-compatible / Mock)         |
+-------------------------------------------------------------------------+
                                 ^
                          HTTPS API Call
                                 v
+-------------------------------------------------------------------------+
| AI Model Provider (Remote Cloud API / Local Mock Provider)              |
+-------------------------------------------------------------------------+
```

---

## 2. Core Extension Modules

### 2.1 Content Script (`extension/entrypoints/content.ts`)
The content script is injected into permitted web pages. It is responsible for:
1. **Editor Detection:** Attaching listeners (`focusin`, `focusout`, `input`, `mouseup`, `keyup`, `selectionchange`) to eligible textareas, text inputs, and basic contenteditable nodes. Excludes sensitive inputs (`type="password"`, `type="credit-card"`, OTP fields, `data-grammora-ignore="true"`).
2. **Editor Adapters:** Standardizes operations across different editor kinds:
   - `getText()`: Extracts text before and around cursor.
   - `getSelection()`: Retrieves selected string and exact boundary offsets.
   - `replaceSelection(newText)`: Validates that current selection still matches initial text, then safely replaces text using standard DOM/Range or `document.execCommand('insertText')` for undo stack preservation.
   - `getCaretCoordinates()`: Calculates absolute screen position for floating UI placement.
3. **Shadow DOM UI Host:** Mounts React components inside a closed/open Shadow Root to prevent style leakage between the webpage and Grammora.
4. **Stale Request Guard:** Assigns every request a monotonically increasing revision ID and checks it against the active editor text revision before rendering any suggestion.

### 2.2 Background Service Worker (`extension/entrypoints/background.ts`)
1. Handles message routing between content script and backend API.
2. Manages `chrome.storage.local` settings migrations and defaults.
3. Maintains privacy boundaries: ensures no network request is dispatched if the user has not completed first-run consent or if the active website is on the exclusion list.

### 2.3 Popup & Options (`extension/entrypoints/popup/`)
1. Displays quick master toggle, feature switches, site exclusions, and completion length preferences.
2. Provides instant feedback on current tab status (Active / Excluded / Unsupported).
3. Connects to backend `/api/health` to indicate connection status.

---

## 3. Backend Architecture (`server/`)

1. **Lightweight & Stateless:** Built on Node.js and Express.js in TypeScript. Avoids external databases for the MVP.
2. **Modular Provider Pattern:** The `AIProvider` interface allows swapping inference engines seamlessly:
   - `MockProvider`: Default provider for local zero-dependency testing.
   - `HuggingFaceProvider` / `OpenAICompatibleProvider`: Production inference providers.
3. **Security & Guardrails:**
   - Strict input length limit (e.g. 4000 characters for rewrite, 1000 for autocomplete).
   - Rate limiting via `express-rate-limit`.
   - Error code normalization (`INVALID_INPUT`, `PROVIDER_TIMEOUT`, `PROVIDER_ERROR`, `QUOTA_EXCEEDED`).
