import { inspectEditor, getPrecedingContext, PrecedingContextInfo } from './editor';
import { calculateFloatingPosition, FloatingPosition } from './coordinates';
import { getSettings, GrammoraSettings } from '../lib/settings';
import { isExtensionContextValid } from '../lib/messaging';

export interface AutocompleteSuggestion {
  requestId: string;
  sequenceId: number;
  editorRevision: number;
  element: HTMLElement;
  precedingText: string;
  caretOffset: number;
  completion: string;
  coords: FloatingPosition;
  timestamp: number;
}

export type AutocompleteCallback = (suggestion: AutocompleteSuggestion | null) => void;

export class AutocompleteEngine {
  private activeElement: HTMLElement | null = null;
  private currentRevision = 0;
  private requestSequence = 0;
  private debounceTimer: any = null;
  private abortController: AbortController | null = null;
  private onSuggestionChange: AutocompleteCallback;
  private currentSuggestion: AutocompleteSuggestion | null = null;

  constructor(onSuggestionChange: AutocompleteCallback) {
    this.onSuggestionChange = onSuggestionChange;
  }

  getSuggestion(): AutocompleteSuggestion | null {
    return this.currentSuggestion;
  }

  clearSuggestion() {
    this.currentSuggestion = null;
    this.onSuggestionChange(null);
  }

  handleFocus(el: HTMLElement) {
    this.activeElement = el;
    this.currentRevision++;
    this.clearSuggestion();
  }

  handleBlur() {
    this.activeElement = null;
    this.clearSuggestion();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  handleTyping(el: HTMLElement, settings: GrammoraSettings) {
    this.activeElement = el;
    this.currentRevision++;
    this.clearSuggestion();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.abortController) {
      this.abortController.abort();
    }

    if (!settings.enabled || !settings.autocompleteEnabled) {
      return;
    }

    // Debounce typing pause
    const debounceMs = settings.debounceMs || 350;
    this.debounceTimer = setTimeout(() => {
      this.triggerAutocomplete(el, settings);
    }, debounceMs);
  }

  private async triggerAutocomplete(el: HTMLElement, settings: GrammoraSettings) {
    if (!isExtensionContextValid()) {
      return;
    }

    const inspected = inspectEditor(el);
    if (!inspected || !inspected.isEligible) return;

    const preceding = getPrecedingContext(el, 250);
    if (!preceding || preceding.text.trim().length < 3) return;

    // Do not trigger autocomplete if the text ends on terminal punctuation (. ? ! : ;)
    // Autocomplete is strictly for completing an active incomplete thought or sentence,
    // not generating answers or arbitrary new paragraphs after finished questions/sentences.
    const trimmed = preceding.text.trim();
    if (trimmed.length === 0 || /[.?!:;][)"'”’]?$/.test(trimmed)) {
      return;
    }

    const seq = ++this.requestSequence;
    const revision = this.currentRevision;

    this.abortController = new AbortController();
    const backendUrl = settings.backendUrl || 'http://localhost:3001';

    let completionText = '';
    let requestId = `ac-${Date.now()}-${seq}`;

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.runtime?.sendMessage) {
        let bgRes: any = null;
        try {
          bgRes = await new Promise<any>((resolve) => {
            try {
              chrome.runtime.sendMessage(
                {
                  type: 'EXECUTE_AUTOCOMPLETE',
                  payload: {
                    text: preceding.text,
                    completionLength: settings.completionLength || 'short',
                  },
                },
                (response) => {
                  if (chrome.runtime?.lastError) {
                    resolve(null);
                  } else {
                    resolve(response);
                  }
                }
              );
            } catch {
              resolve(null);
            }
          });
        } catch {
          return;
        }

        if (bgRes && bgRes.ok && bgRes.result) {
          completionText = bgRes.result;
        }
      } else {
        const response = await fetch(`${backendUrl}/api/autocomplete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: preceding.text,
            completionLength: settings.completionLength || 'short',
            requestId,
          }),
          signal: this.abortController.signal,
        });

        if (response.ok) {
          const data = await response.json();
          completionText = data.result || '';
        }
      }

      if (!completionText.trim()) return;

      // STALE CHECK: If editor revision changed or another request fired, discard!
      if (this.currentRevision !== revision || seq !== this.requestSequence) {
        return;
      }

      // Verify caret position has not moved
      const currentContext = getPrecedingContext(el, 250);
      if (!currentContext || currentContext.caretOffset !== preceding.caretOffset) {
        return;
      }

      // Calculate floating position near caret
      const coords = calculateFloatingPosition(
        el,
        preceding.caretOffset,
        preceding.caretOffset,
        300,
        70
      );

      const suggestion: AutocompleteSuggestion = {
        requestId,
        sequenceId: seq,
        editorRevision: revision,
        element: el,
        precedingText: preceding.text,
        caretOffset: preceding.caretOffset,
        completion: completionText,
        coords,
        timestamp: Date.now(),
      };

      this.currentSuggestion = suggestion;
      this.onSuggestionChange(suggestion);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const msg = err.message || '';
        if (msg.includes('context invalidated')) {
          return;
        }
        console.warn('[Grammora Autocomplete] Request error:', err.message);
      }
    }
  }

  acceptSuggestion(): boolean {
    if (!this.currentSuggestion) return false;

    const { element, caretOffset, completion, precedingText } = this.currentSuggestion;
    const currentContext = getPrecedingContext(element, 250);

    // Verify context is still valid
    if (!currentContext || currentContext.caretOffset !== caretOffset) {
      this.clearSuggestion();
      return false;
    }

    // Format completion spacing so words don't get glued to preceding text
    let textToInsert = completion;
    const needsLeadingSpace =
      precedingText.length > 0 &&
      !/\s$/.test(precedingText) &&
      !/^\s/.test(completion) &&
      !/^[.,!?;:]/.test(completion);

    if (needsLeadingSpace) {
      textToInsert = ' ' + textToInsert;
    }

    try {
      if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
        element.focus();
        element.setSelectionRange(caretOffset, caretOffset);

        let inserted = false;
        try {
          inserted = document.execCommand('insertText', false, textToInsert);
        } catch {
          inserted = false;
        }

        if (!inserted) {
          element.setRangeText(textToInsert, caretOffset, caretOffset, 'end');
        }

        element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      } else if (element.isContentEditable) {
        element.focus();
        let inserted = false;
        try {
          inserted = document.execCommand('insertText', false, textToInsert);
        } catch {
          inserted = false;
        }

        if (!inserted) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(textToInsert);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
        element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      }

      this.clearSuggestion();
      return true;
    } catch (err) {
      console.error('[Grammora Autocomplete] Failed to insert completion:', err);
      this.clearSuggestion();
      return false;
    }
  }
}

