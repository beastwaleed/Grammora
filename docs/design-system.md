# Grammora Design System & Visual Specification

**Brand:** Grammora  
**Tagline:** Your Open-Source AI Writing Assistant  
**Design Philosophy:** Modern, Intelligent, Minimal, Trustworthy, Fast, and Accessible.  
**Specification Version:** 1.0 (MVP)

---

## 1. Brand Identity & Personality

Grammora is designed as a calm, distraction-free writing companion. Unlike heavy grammar checkers that clutter the screen with overwhelming highlights and popups, Grammora provides:
- **Subtle presence:** Unobtrusive floating pen triggers that appear only when relevant text is selected.
- **Predictable interaction:** Clear previews of suggested changes with explicit Accept / Dismiss actions. Never silently modifies user input.
- **Visual cohesion:** The same font family, color hierarchy, elevation tokens, border radiuses, and icon system across all surfaces (Popup, Floating Toolbar, Suggestion Cards, Settings).

### Brand Wordmark & Icon
- **Wordmark:** **Grammora** set in `Inter` (font weight 600/700, letter-spacing: -0.02em).
- **Icon Symbol:** A streamlined geometric monogram combining an elegant curved "G" with an upward writing pen tip and AI sparkle glyph in indigo/violet gradients and flat geometries.
- **Icon Sizes:** 16x16, 32x32, 48x48, 128x128 px for Chrome Web Store and toolbar display.

---

## 2. Color System & Semantic Tokens

The color palette is built on an indigo/violet primary scale, paired with slate neutrals for maximum legibility and strict WCAG 2.2 AA (minimum 4.5:1) contrast compliance.

### Brand & Interactive Colors
| Token Name | Hex Value | Purpose / Usage | Contrast on White |
|:---|:---|:---|:---|
| `--color-primary` | `#6258E8` | Primary brand accent, primary CTA buttons, active toggles | 5.3:1 (Passes AA) |
| `--color-primary-hover` | `#5147D4` | Hover state for primary buttons and interactive elements | 6.9:1 (Passes AA/AAA) |
| `--color-primary-active`| `#4338CA` | Active/pressed state for primary controls | 8.8:1 (Passes AAA) |
| `--color-primary-soft`  | `#F0EEFF` | Subtle background for badges, active chips, icon pills | 1.15:1 (Background) |
| `--color-primary-focus` | `rgba(98, 88, 232, 0.25)` | 2px/3px focus outline ring for keyboard accessibility | - |

### Neutrals & Surfaces
| Token Name | Hex Value | Purpose / Usage | Contrast on Surface |
|:---|:---|:---|:---|
| `--color-bg-canvas`     | `#FFFFFF` | Primary surface background (popup, modal, card) | Base |
| `--color-bg-subtle`     | `#F8FAFC` | Secondary surfaces, input backgrounds, table headers | Neutral 50 |
| `--color-bg-muted`      | `#F1F5F9` | Hover states on ghost buttons, disabled inputs | Neutral 100 |
| `--color-border-subtle` | `#E2E8F0` | Dividers, card borders, subtle separators | Neutral 200 |
| `--color-border-strong` | `#CBD5E1` | Input borders, button outlines, active borders | Neutral 300 |
| `--color-text-main`     | `#172033` | Primary headings, body copy, active button labels | 15.6:1 (Passes AAA) |
| `--color-text-secondary`| `#64748B` | Subheadings, helper text, labels, inactive tabs | 4.7:1 (Passes AA) |
| `--color-text-muted`    | `#94A3B8` | Placeholder text, disabled labels | Non-critical (3:1+) |

### Semantic State Colors
| Token Name | Hex Value | Soft Background | Purpose |
|:---|:---|:---|:---|
| `--color-success` | `#16A34A` | `#DCFCE7` | Corrections applied, healthy API status, active website |
| `--color-warning` | `#D97706` | `#FEF3C7` | Offline warnings, slow connection alerts |
| `--color-error`   | `#DC2626` | `#FEE2E2` | Validation errors, provider timeouts, quota exceeded |

---

## 3. Typography Scale (Inter Font Family)

All surfaces strictly use **Inter** (with system fallback: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
Webfonts are bundled locally or use system stacks to avoid external runtime CDNs that could violate extension CSP or leak network requests.

| Style Role | Font Size | Line Height | Font Weight | Letter Spacing | CSS Equivalent |
|:---|:---|:---|:---|:---|:---|
| Title / Header | 18px (1.125rem) | 24px (1.5) | 600 (Semibold) | -0.015em | `text-lg font-semibold` |
| Section Heading| 15px (0.9375rem)| 20px (1.33) | 600 (Semibold) | -0.01em | `text-[15px] font-semibold` |
| Body Text      | 14px (0.875rem) | 20px (1.43) | 400 (Regular) / 500 (Medium) | 0 | `text-sm font-normal` |
| Button Label   | 13px (0.8125rem)| 18px (1.38) | 500 (Medium) | 0.005em | `text-[13px] font-medium` |
| Caption / Helper| 12px (0.75rem)  | 16px (1.33) | 400 (Regular) / 500 (Medium) | 0.01em | `text-xs font-normal` |
| Micro Badge    | 11px (0.6875rem)| 14px (1.27) | 600 (Semibold) | 0.02em | `text-[11px] font-semibold` |

---

## 4. Spacing, Sizing & Layout Rhythm

Grammora enforces a strict 4px grid rhythm (`4, 8, 12, 16, 20, 24, 32px`):
- `space-1` (4px): Micro gaps between icon and text, tag padding.
- `space-2` (8px): Button padding (Y), item gaps in lists, badge padding.
- `space-3` (12px): Standard control horizontal padding, card content inner padding.
- `space-4` (16px): Dialog padding, container padding, major section gaps.
- `space-5` (20px): Section divider margins.
- `space-6` (24px): Popup root container padding.

### Elevation & Shadows
- **Shadow Subtlety Rule:** Avoid harsh, dark drop shadows. Use dual-layer ambient shadows:
  - `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (Buttons, inputs)
  - `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)` (Toolbars, popups)
  - `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)` (Floating preview cards)

### Border Radius Hierarchy
- `rounded-sm` (6px): Badges, tooltips, micro controls.
- `rounded-md` (8px): Form inputs, standard buttons, toggle switches.
- `rounded-lg` (12px): Floating pen button, action toolbar, autocomplete cards.
- `rounded-xl` (16px): Popup main window, modal containers.

---

## 5. Component Specifications & Interaction States

### A. Extension Popup Window
- **Dimensions:** 380px fixed width, automatic content height (capped at 560px with smooth scroll).
- **Structure:**
  1. **Header:** Brand monogram icon + Grammora wordmark + status badge ("Ready" / "Disabled") + Settings shortcut.
  2. **Active Page Context Card:** Current domain detection with 1-click toggle ("Enabled on this site").
  3. **Main Capabilities Toggles:**
     - AI Writing Copilot (Master toggle)
     - Smart Autocomplete (Next-word & phrase predictions)
     - Grammar & Rewrite Toolbar (Floating pen on text selection)
     - Completion Length Selector (Short ~3-6 words vs Medium ~10-18 words)
  4. **Privacy & Cloud AI Indicator:**
     - Status pill displaying "Local Mock Mode" or "Cloud AI Connected".
     - Brief transparent disclosure: "Text is processed only upon your explicit request."
     - Link to full Privacy notice & First-run consent settings.
  5. **Footer:** Version 1.0.0 (MVP) badge, GitHub repository link, Help & Docs.

### B. Floating Pen Icon & Writing Toolbar
- **Trigger:** Highlight of ≥ 3 characters inside an eligible editor (`textarea`, `input[type="text"]`, `contenteditable`).
- **Placement:** Positioned 8px directly below the end of the text selection range, auto-flipping upward if within 40px of bottom viewport boundary.
- **States:**
  - *Collapsed:* 32x32px circular pill with subtle indigo pen icon, gentle hover elevation (`scale(1.05)`).
  - *Expanded Toolbar:* Horizontal dock featuring:
    - 🪄 **Fix Grammar** (Correction)
    - 🔄 **Rephrase** (Paraphrase)
    - 👔 **Professional** (Formal tone)
    - 😊 **Friendly** (Warm tone)
    - ⚡ **Concise** (Word-trimming)
    - ✖ **Close**

### C. Suggestion & Diff Preview Card
- **Layout:**
  - Header: Mode badge (e.g., "Grammar Correction", "Concise Tone") + Close icon.
  - Before/After comparison:
    - Original text displayed in subtle muted box with strike-through or neutral styling.
    - Proposed AI suggestion highlighted with bold diffs and emerald/indigo tint.
  - Actions:
    - Primary **Apply** button (`Enter` shortcut).
    - Secondary **Dismiss** button (`Esc` shortcut).
    - Optional **Retry / Regenerate** button (`R` shortcut).
- **Safety guarantee:** Revalidates cursor offset, editor presence, and original string before executing DOM replacement.

### D. Autocomplete Suggestion Box
- **Trigger:** Configurable 350ms pause after typing.
- **Visual:** Compact floating card positioned near caret:
  - Suggested continuation text with visual distinction.
  - Keyboard hint badge: `[Tab]` to accept, `[Esc]` to dismiss.
  - Clickable suggestion for mouse users.

---

## 6. CSS Isolation & Webpage Safety

Because content script UI components are injected directly into third-party host web pages (e.g., Gmail, GitHub, WordPress, Reddit), Grammora employs strict **Shadow DOM** (`closed` or `open` mode with encapsulated stylesheets):
1. **Zero Host Style Leaks:** Host page styles (resets, fonts, tailwind versions) cannot mutate Grammora's toolbar or popups.
2. **Zero Target Contamination:** Grammora's styling never pollutes host DOM elements or global tag rules.
3. **Z-Index Discipline:** Floating UI uses `z-index: 2147483647` within its own isolated container, with fixed coordinate recalculation on scroll/resize.
