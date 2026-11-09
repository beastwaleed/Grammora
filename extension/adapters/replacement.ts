/**
 * Safe text replacement engine with validation against editor changes
 * and preservation of native browser undo stacks (Ctrl+Z).
 */

export interface SelectionSnapshot {
  element: HTMLElement;
  originalText: string;
  startOffset: number;
  endOffset: number;
  rangeSnapshot?: Range;
  timestamp: number;
}

export interface ReplacementResult {
  success: boolean;
  error?: string;
}

/**
 * Creates an immutable snapshot of the active selection before AI processing starts
 */
export function captureSelectionSnapshot(
  element: HTMLElement,
  text: string,
  start: number,
  end: number
): SelectionSnapshot {
  let rangeSnapshot: Range | undefined;

  if (element.isContentEditable) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      rangeSnapshot = sel.getRangeAt(0).cloneRange();
    }
  }

  return {
    element,
    originalText: text,
    startOffset: start,
    endOffset: end,
    rangeSnapshot,
    timestamp: Date.now(),
  };
}

/**
 * Validates that the editor and selection have not changed incompatibly
 */
export function validateSelectionSnapshot(snapshot: SelectionSnapshot): boolean {
  const { element, originalText, startOffset, endOffset, rangeSnapshot } = snapshot;

  // Check if element is still connected to the DOM
  if (!element.isConnected) {
    return false;
  }

  // Textarea or Input validation
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    const currentSegment = element.value.slice(startOffset, endOffset);
    return currentSegment === originalText;
  }

  // ContentEditable validation
  if (element.isContentEditable) {
    if (rangeSnapshot && rangeSnapshot.startContainer.isConnected) {
      const currentRangeText = rangeSnapshot.toString();
      if (currentRangeText === originalText || currentRangeText.trim() === originalText.trim()) {
        return true;
      }
    }
    const elText = element.innerText || element.textContent || '';
    return elText.includes(originalText.trim());
  }

  return false;
}

/**
 * Safely replaces the selected text with the AI suggestion,
 * firing native input events and preserving undo history where possible.
 */
export function executeReplacement(
  snapshot: SelectionSnapshot,
  replacementText: string
): ReplacementResult {
  if (!validateSelectionSnapshot(snapshot)) {
    return {
      success: false,
      error: 'Text selection has changed or is no longer valid.',
    };
  }

  const { element, startOffset, endOffset, rangeSnapshot } = snapshot;

  try {
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      element.focus();
      element.setSelectionRange(startOffset, endOffset);

      // Attempt execCommand to preserve the browser's undo/redo history
      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, replacementText);
      } catch {
        inserted = false;
      }

      // Fallback if execCommand is blocked
      if (!inserted) {
        element.setRangeText(replacementText, startOffset, endOffset, 'end');
      }

      // Dispatch events for React, Vue, and vanilla input synchronization
      element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

      return { success: true };
    }

    if (element.isContentEditable) {
      element.focus();
      const sel = window.getSelection();

      if (sel && rangeSnapshot) {
        sel.removeAllRanges();
        sel.addRange(rangeSnapshot);

        let inserted = false;
        try {
          inserted = document.execCommand('insertText', false, replacementText);
        } catch {
          inserted = false;
        }

        if (!inserted) {
          rangeSnapshot.deleteContents();
          const textNode = document.createTextNode(replacementText);
          rangeSnapshot.insertNode(textNode);
          rangeSnapshot.setStartAfter(textNode);
          rangeSnapshot.setEndAfter(textNode);
          sel.removeAllRanges();
          sel.addRange(rangeSnapshot);
        }

        element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        return { success: true };
      }

      // Safe DOM text replacement fallback for contenteditable
      const targetText = snapshot.originalText.trim();
      const currentHTML = element.innerHTML;
      if (currentHTML.includes(targetText)) {
        element.innerHTML = currentHTML.replace(targetText, replacementText);
        element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        return { success: true };
      }
    }

    return {
      success: false,
      error: 'Unsupported editor element for replacement.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to replace text.',
    };
  }
}

