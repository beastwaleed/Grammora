export type SupportedEditorType = 'textarea' | 'input' | 'contenteditable';

export interface EditorInfo {
  type: SupportedEditorType;
  element: HTMLElement;
  isEligible: boolean;
  reason?: string;
}

export interface SelectionRangeInfo {
  text: string;
  start: number;
  end: number;
  rect: DOMRect;
}

const SENSITIVE_INPUT_TYPES = new Set([
  'password',
  'hidden',
  'file',
  'checkbox',
  'radio',
  'image',
  'button',
  'submit',
  'reset',
]);

const SENSITIVE_AUTOCOMPLETE_VALUES = new Set([
  'cc-name',
  'cc-number',
  'cc-exp',
  'cc-exp-month',
  'cc-exp-year',
  'cc-csc',
  'cc-type',
  'transaction-amount',
  'one-time-code',
  'current-password',
  'new-password',
]);

/**
 * Checks if a target DOM element is an editable element supported by Grammora
 */
export function inspectEditor(target: EventTarget | null): EditorInfo | null {
  if (!target || !(target instanceof HTMLElement)) {
    return null;
  }

  // 1. Textarea
  if (target instanceof HTMLTextAreaElement) {
    const isEligible = !isElementExcluded(target);
    return {
      type: 'textarea',
      element: target,
      isEligible,
      reason: isEligible ? undefined : 'Excluded field or sensitive attribute',
    };
  }

  // 2. Input
  if (target instanceof HTMLInputElement) {
    const inputType = (target.type || 'text').toLowerCase();
    if (SENSITIVE_INPUT_TYPES.has(inputType)) {
      return {
        type: 'input',
        element: target,
        isEligible: false,
        reason: `Unsupported input type: ${inputType}`,
      };
    }

    const isEligible = !isElementExcluded(target);
    return {
      type: 'input',
      element: target,
      isEligible,
      reason: isEligible ? undefined : 'Excluded or sensitive input field',
    };
  }

  // 3. Contenteditable
  if (target.isContentEditable) {
    const isEligible = !isElementExcluded(target);
    return {
      type: 'contenteditable',
      element: target,
      isEligible,
      reason: isEligible ? undefined : 'Excluded contenteditable container',
    };
  }

  return null;
}

/**
 * Identifies if an element has password/credit-card/OTP markers or explicit ignore flag
 */
export function isElementExcluded(el: HTMLElement): boolean {
  if (el.getAttribute('data-grammora-ignore') === 'true') {
    return true;
  }

  if (el.getAttribute('aria-hidden') === 'true') {
    return true;
  }

  const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase().trim();
  if (SENSITIVE_AUTOCOMPLETE_VALUES.has(autocomplete)) {
    return true;
  }

  const nameOrId = ((el.getAttribute('name') || '') + ' ' + (el.id || '')).toLowerCase();
  if (
    nameOrId.includes('password') ||
    nameOrId.includes('cvv') ||
    nameOrId.includes('cardnumber') ||
    nameOrId.includes('otp') ||
    nameOrId.includes('token')
  ) {
    return true;
  }

  return false;
}

/**
 * Retrieves the full or preceding text from the target editor
 */
export function getEditorText(el: HTMLElement): string {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  if (el.isContentEditable) {
    return el.innerText || el.textContent || '';
  }
  return '';
}

/**
 * Retrieves the currently selected text and bounding rectangle
 */
export function getActiveSelection(el: HTMLElement): SelectionRangeInfo | null {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start === end) return null;

    const text = el.value.slice(start, end);
    if (!text.trim()) return null;

    // Approximate bounding rectangle for textarea/input using element rect
    const elRect = el.getBoundingClientRect();
    return {
      text,
      start,
      end,
      rect: elRect,
    };
  }

  if (el.isContentEditable) {
    const winSel = window.getSelection();
    if (!winSel || winSel.isCollapsed || winSel.rangeCount === 0) {
      return null;
    }

    const range = winSel.getRangeAt(0);
    const text = winSel.toString();
    if (!text.trim()) return null;

    const rect = range.getBoundingClientRect();
    return {
      text,
      start: 0,
      end: text.length,
      rect,
    };
  }

  return null;
}

export interface PrecedingContextInfo {
  text: string;
  caretOffset: number;
  fullPrecedingText: string;
}

/**
 * Extracts bounded context preceding the cursor (max 250 characters).
 * Returns null if the caret is not collapsed or has no meaningful context.
 */
export function getPrecedingContext(
  el: HTMLElement,
  maxChars: number = 250
): PrecedingContextInfo | null {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    // Autocomplete only triggers when caret is collapsed (no active selection)
    if (start !== end) return null;

    const fullPrecedingText = el.value.slice(0, end);
    if (!fullPrecedingText.trim()) return null;

    const boundedText = fullPrecedingText.slice(-maxChars);
    return {
      text: boundedText,
      caretOffset: end,
      fullPrecedingText,
    };
  }

  if (el.isContentEditable) {
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return null;

    try {
      const range = sel.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(el);
      preCaretRange.setEnd(range.endContainer, range.endOffset);

      const fullPrecedingText = preCaretRange.toString();
      if (!fullPrecedingText.trim()) return null;

      const boundedText = fullPrecedingText.slice(-maxChars);
      return {
        text: boundedText,
        caretOffset: fullPrecedingText.length,
        fullPrecedingText,
      };
    } catch {
      return null;
    }
  }

  return null;
}

