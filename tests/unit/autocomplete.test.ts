import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutocompleteEngine, AutocompleteSuggestion } from '../../extension/adapters/autocomplete';
import { DEFAULT_SETTINGS } from '../../extension/lib/settings';

describe('Smart Autocomplete Engine Unit Tests', () => {
  let textarea: HTMLTextAreaElement;

  beforeEach(() => {
    textarea = document.createElement('textarea');
    textarea.value = 'I would like to apply';
    document.body.appendChild(textarea);
  });

  it('should initialize with no active suggestion', () => {
    const callback = vi.fn();
    const engine = new AutocompleteEngine(callback);
    expect(engine.getSuggestion()).toBeNull();
    expect(callback).not.toHaveBeenCalled();
  });

  it('should clear suggestion on handleBlur', () => {
    let current: AutocompleteSuggestion | null = null;
    const engine = new AutocompleteEngine((s) => { current = s; });

    engine.handleFocus(textarea);
    engine.handleBlur();

    expect(engine.getSuggestion()).toBeNull();
    expect(current).toBeNull();
  });

  it('should debouce typing and not trigger immediately', () => {
    const callback = vi.fn();
    const engine = new AutocompleteEngine(callback);

    engine.handleTyping(textarea, DEFAULT_SETTINGS);

    // Immediately after typing, callback should not be invoked with a suggestion
    expect(engine.getSuggestion()).toBeNull();
  });

  it('should accept suggestion and insert completion into textarea', () => {
    textarea.value = 'I would like to apply';
    textarea.setSelectionRange(21, 21); // Caret at end

    const engine = new AutocompleteEngine(() => {});

    // Mock setting an active suggestion
    (engine as any).currentSuggestion = {
      requestId: 'test-1',
      sequenceId: 1,
      editorRevision: 1,
      element: textarea,
      precedingText: 'I would like to apply',
      caretOffset: 21,
      completion: ' for the software engineering internship',
      coords: { top: 100, left: 100, placement: 'bottom' },
      timestamp: Date.now(),
    };

    let inputFired = false;
    let changeFired = false;
    textarea.addEventListener('input', () => { inputFired = true; });
    textarea.addEventListener('change', () => { changeFired = true; });

    const accepted = engine.acceptSuggestion();
    expect(accepted).toBe(true);
    expect(textarea.value).toBe(
      'I would like to apply for the software engineering internship'
    );
    expect(inputFired).toBe(true);
    expect(changeFired).toBe(true);
    expect(engine.getSuggestion()).toBeNull();
  });

  it('should reject accepting suggestion if caret moved', () => {
    textarea.value = 'I would like to apply';
    textarea.setSelectionRange(5, 5); // Caret moved to position 5

    const engine = new AutocompleteEngine(() => {});
    (engine as any).currentSuggestion = {
      requestId: 'test-stale',
      sequenceId: 1,
      editorRevision: 1,
      element: textarea,
      precedingText: 'I would like to apply',
      caretOffset: 21, // Suggestion was for position 21
      completion: ' for the job',
      coords: { top: 100, left: 100, placement: 'bottom' },
      timestamp: Date.now(),
    };

    const accepted = engine.acceptSuggestion();
    expect(accepted).toBe(false);
    expect(textarea.value).toBe('I would like to apply'); // Unchanged
    expect(engine.getSuggestion()).toBeNull();
  });
});
