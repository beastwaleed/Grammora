import { describe, it, expect, beforeEach } from 'vitest';
import {
  captureSelectionSnapshot,
  validateSelectionSnapshot,
  executeReplacement,
} from '../../extension/adapters/replacement';

describe('Safe Text Replacement Unit Tests', () => {
  let textarea: HTMLTextAreaElement;

  beforeEach(() => {
    textarea = document.createElement('textarea');
    textarea.value = 'She don\'t knows how to use this application.';
    document.body.appendChild(textarea);
  });

  it('should capture a valid selection snapshot', () => {
    const text = "She don't knows";
    const start = 0;
    const end = text.length;

    const snapshot = captureSelectionSnapshot(textarea, text, start, end);
    expect(snapshot.originalText).toBe(text);
    expect(snapshot.startOffset).toBe(start);
    expect(snapshot.endOffset).toBe(end);
    expect(snapshot.element).toBe(textarea);
  });

  it('should validate successfully when text has not changed', () => {
    const text = "She don't knows";
    const snapshot = captureSelectionSnapshot(textarea, text, 0, text.length);
    expect(validateSelectionSnapshot(snapshot)).toBe(true);
  });

  it('should invalidate when editor text changes before replacement', () => {
    const text = "She don't knows";
    const snapshot = captureSelectionSnapshot(textarea, text, 0, text.length);

    // User types or edits text while AI was generating
    textarea.value = 'He knows how to use this application.';

    expect(validateSelectionSnapshot(snapshot)).toBe(false);
  });

  it('should invalidate when editor element is disconnected from DOM', () => {
    const text = "She don't knows";
    const snapshot = captureSelectionSnapshot(textarea, text, 0, text.length);

    document.body.removeChild(textarea);

    expect(validateSelectionSnapshot(snapshot)).toBe(false);
  });

  it('should safely replace the selected text and trigger input events', () => {
    const text = "She don't knows";
    const replacement = "She doesn't know";
    const snapshot = captureSelectionSnapshot(textarea, text, 0, text.length);

    let inputFired = false;
    let changeFired = false;
    textarea.addEventListener('input', () => { inputFired = true; });
    textarea.addEventListener('change', () => { changeFired = true; });

    const result = executeReplacement(snapshot, replacement);
    expect(result.success).toBe(true);
    expect(textarea.value).toBe("She doesn't know how to use this application.");
    expect(inputFired).toBe(true);
    expect(changeFired).toBe(true);
  });

  it('should reject replacement if validation fails', () => {
    const text = "She don't knows";
    const snapshot = captureSelectionSnapshot(textarea, text, 0, text.length);

    // Modify editor text
    textarea.value = 'Completely different text';

    const result = executeReplacement(snapshot, "She doesn't know");
    expect(result.success).toBe(false);
    expect(result.error).toContain('changed');
    expect(textarea.value).toBe('Completely different text');
  });
});
