# Grammora Privacy & Data Protection Specification

**Product:** Grammora  
**Core Promise:** Privacy-first, transparent AI writing assistance. User control is non-negotiable.

---

## 1. Core Privacy Principles

1. **Explicit First-Run Consent:**
   - Grammora never sends writing content to remote AI models until the user has reviewed and explicitly accepted the AI Data Notice.
   - A clear banner is presented in the extension popup on first install.
2. **Bounded Context Transmission:**
   - For autocomplete, only up to 250 characters immediately preceding the typing cursor are sent. Grammora never transmits whole web pages, DOM trees, or background tabs.
   - For grammar and rephrasing, only the specifically highlighted text snippet is sent.
3. **Sensitive Field Protection:**
   - Form fields marked with `type="password"`, `autocomplete="cc-number"`, `autocomplete="one-time-code"`, or matching credit card / OTP heuristics are completely ignored.
   - The pen icon and autocomplete triggers are suppressed inside sensitive fields.
4. **No Server-Side Text Logging:**
   - The Grammora backend does not persist user text in databases or log files.
   - Diagnostic logs record only sanitized metadata: timestamp, anonymized request UUID, latency, token count, and HTTP status codes.
5. **Local Storage First:**
   - All user preferences, enabled status, site exclusions, and completion length settings are persisted strictly on client device using `chrome.storage.local`.
6. **Per-Site Opt-Out:**
   - Users can exclude any website (e.g. personal banking, intranet, work portals) with a single click in the popup.
   - On excluded domains, all listeners and UI injection remain entirely inactive.
