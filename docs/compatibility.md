# Grammora Editor Compatibility Matrix

**Version:** 1.0 (MVP)  
**Target Environment:** Chrome & Chromium-based browsers (Edge, Brave, Arc, Opera) Manifest V3

---

## 1. Supported Editors (MVP Baseline)

| Editor Type | Status | Detection Mechanism | Selection & Replacement Handling | Notes |
|:---|:---|:---|:---|:---|
| `<textarea>` | **Fully Supported** | `node.tagName === 'TEXTAREA'` | `selectionStart`, `selectionEnd`, `setRangeText()` or `setSelectionRange()` + `document.execCommand('insertText')` | Preserves native undo stack where supported |
| Standard `<input>` | **Fully Supported** | `node.tagName === 'INPUT'` with valid text types (`text`, `search`, `email`, `url`, `tel`) | `selectionStart`, `selectionEnd`, `setRangeText()` | Excludes passwords and sensitive fields |
| Basic `[contenteditable]` | **Fully Supported** | `node.isContentEditable === true` | Browser `window.getSelection()`, `Range` cloning, `range.deleteContents()`, `range.insertNode()` | Handles simple rich editors and single paragraphs |

---

## 2. Excluded & Sensitive Fields

The following elements are actively bypassed for privacy and security:
- `input[type="password"]`
- Fields with sensitive autocomplete attributes: `cc-name`, `cc-number`, `cc-exp`, `cc-csc`, `one-time-code`
- Elements with attribute `data-grammora-ignore="true"`
- Banking, payment gateways, and user-excluded domains

---

## 3. Post-MVP Editor Target Roadmap

The following editors are slated for dedicated adapters in v1.1+:
- Google Docs (Canvas-based rendering model)
- ProseMirror / Tiptap (Custom document state trees)
- Slate.js / Lexical (React/virtual DOM state reconciliation)
- CodeMirror / Monaco Editor (IDE code buffers)
- Complex nested cross-origin IFrames
