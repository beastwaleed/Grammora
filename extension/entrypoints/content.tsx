import { defineContentScript } from 'wxt/utils/define-content-script';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { getSettings, isDomainExcluded, GrammoraSettings } from '../lib/settings';
import { inspectEditor, EditorInfo, getActiveSelection } from '../adapters/editor';
import { captureSelectionSnapshot, SelectionSnapshot } from '../adapters/replacement';
import { AutocompleteEngine, AutocompleteSuggestion } from '../adapters/autocomplete';
import { FloatingWritingCompanion } from '../components/FloatingWritingCompanion';
import { AutocompleteCard } from '../components/AutocompleteCard';
import { isExtensionContextValid } from '../lib/messaging';
// @ts-ignore - Vite inline CSS import
import globalCss from '../styles/globals.css?inline';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main() {
    let settings: GrammoraSettings | null = null;
    let activeEditor: EditorInfo | null = null;
    let activeSnapshot: SelectionSnapshot | null = null;
    let activeSuggestion: AutocompleteSuggestion | null = null;
    let autocompleteEngine: AutocompleteEngine | null = null;
    let reactRoot: ReactDOM.Root | null = null;
    let shadowContainer: HTMLElement | null = null;
    let shadowRoot: ShadowRoot | null = null;
    let isOrphaned = false;

    function checkContext(): boolean {
      if (isOrphaned) return false;
      if (!isExtensionContextValid()) {
        isOrphaned = true;
        detachEventListeners();
        console.warn(
          '[Grammora] Extension was updated or reloaded in Chrome. Please refresh this tab (F5) to re-enable Grammora.'
        );
        return false;
      }
      return true;
    }

    console.log('[Grammora Content] Initializing on:', window.location.hostname);

    async function initialize() {
      try {
        if (!checkContext()) return;
        settings = await getSettings();

        // Check if master toggle is disabled or site is excluded
        const hostname = window.location.hostname;
        if (!settings.enabled) {
          console.log('[Grammora Content] Master switch disabled.');
          return;
        }

        if (isDomainExcluded(hostname, settings.excludedDomains)) {
          console.log('[Grammora Content] Website excluded:', hostname);
          return;
        }

        // Initialize autocomplete engine with reactive callback
        autocompleteEngine = new AutocompleteEngine((suggestion) => {
          activeSuggestion = suggestion;
          renderUI();
        });

        setupShadowDOM();
        attachEventListeners();
        console.log('[Grammora Content] Ready for typing autocomplete and selection rewriting.');
      } catch (err) {
        console.error('[Grammora Content] Initialization error:', err);
      }
    }

    /**
     * Creates an isolated Shadow DOM container and mounts the React root
     */
    function setupShadowDOM() {
      if (document.getElementById('grammora-host')) return;

      shadowContainer = document.createElement('div');
      shadowContainer.id = 'grammora-host';
      shadowContainer.style.position = 'fixed';
      shadowContainer.style.top = '0';
      shadowContainer.style.left = '0';
      shadowContainer.style.width = '0';
      shadowContainer.style.height = '0';
      shadowContainer.style.zIndex = '2147483647';
      shadowContainer.style.pointerEvents = 'none';

      shadowRoot = shadowContainer.attachShadow({ mode: 'open' });

      // Inject compiled design system CSS directly into Shadow DOM
      const styleElement = document.createElement('style');
      styleElement.textContent = globalCss;
      shadowRoot.appendChild(styleElement);

      // Mount container for React
      const mountPoint = document.createElement('div');
      mountPoint.id = 'grammora-root';
      shadowRoot.appendChild(mountPoint);

      reactRoot = ReactDOM.createRoot(mountPoint);
      renderUI();

      document.body.appendChild(shadowContainer);
    }

    function renderUI() {
      if (!reactRoot) return;

      reactRoot.render(
        <React.StrictMode>
          {/* Phase 2/3 Selection Companion */}
          <FloatingWritingCompanion
            snapshot={activeSnapshot}
            onClose={() => {
              activeSnapshot = null;
              renderUI();
            }}
          />

          {/* Phase 4 Smart Autocomplete Card */}
          <AutocompleteCard
            suggestion={activeSuggestion}
            onAccept={() => {
              if (autocompleteEngine) {
                autocompleteEngine.acceptSuggestion();
              }
            }}
            onDismiss={() => {
              if (autocompleteEngine) {
                autocompleteEngine.clearSuggestion();
              }
            }}
          />
        </React.StrictMode>
      );
    }

    /**
     * Attaches selection, keyboard, and input event listeners
     */
    function attachEventListeners() {
      // Focus tracking
      document.addEventListener('focusin', handleFocusIn, true);
      document.addEventListener('focusout', handleFocusOut, true);

      // Typing and autocomplete tracking
      document.addEventListener('input', handleInput, true);
      document.addEventListener('keydown', handleKeyDown, true);

      // Selection tracking
      document.addEventListener('mouseup', handleSelectionUpdate);
      document.addEventListener('keyup', handleKeyUp);
      document.addEventListener('selectionchange', handleSelectionChange);
    }

    function detachEventListeners() {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mouseup', handleSelectionUpdate);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('selectionchange', handleSelectionChange);

      if (shadowContainer && shadowContainer.parentNode) {
        shadowContainer.parentNode.removeChild(shadowContainer);
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (!checkContext()) return;
      const inspected = inspectEditor(event.target);
      if (inspected && inspected.isEligible) {
        activeEditor = inspected;
        autocompleteEngine?.handleFocus(inspected.element);
      } else {
        activeEditor = null;
        autocompleteEngine?.handleBlur();
      }
    }

    function handleFocusOut(event: FocusEvent) {
      setTimeout(() => {
        if (
          activeEditor &&
          activeEditor.element === event.target &&
          !activeSnapshot &&
          !activeSuggestion
        ) {
          activeEditor = null;
          autocompleteEngine?.handleBlur();
        }
      }, 150);
    }

    function handleInput(event: Event) {
      if (!checkContext()) return;
      if (!settings || !settings.enabled || !settings.autocompleteEnabled) return;

      const target = event.target;
      if (target instanceof HTMLElement) {
        const inspected = inspectEditor(target);
        if (inspected && inspected.isEligible) {
          activeEditor = inspected;
          autocompleteEngine?.handleTyping(target, settings);
        }
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      // If an autocomplete suggestion is active:
      if (activeSuggestion && autocompleteEngine) {
        if (event.key === 'Tab') {
          // Explicit acceptance via Tab
          event.preventDefault();
          event.stopPropagation();
          autocompleteEngine.acceptSuggestion();
          return;
        }

        if (event.key === 'Escape') {
          // Explicit dismissal via Escape
          event.preventDefault();
          event.stopPropagation();
          autocompleteEngine.clearSuggestion();
          return;
        }

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
          // Caret moved via navigation keys -> dismiss suggestion
          autocompleteEngine.clearSuggestion();
        }
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (activeSnapshot) {
          activeSnapshot = null;
          renderUI();
        }
        return;
      }
      handleSelectionUpdate();
    }

    function handleSelectionChange() {
      if (!activeEditor || !activeEditor.isEligible) return;

      const sel = getActiveSelection(activeEditor.element);
      if (!sel && activeSnapshot && !activeSnapshot.element.isConnected) {
        activeSnapshot = null;
        renderUI();
      }
    }

    function handleSelectionUpdate() {
      if (!checkContext()) return;
      if (!settings || !settings.enabled) return;

      if (!activeEditor) {
        const inspected = inspectEditor(document.activeElement);
        if (inspected && inspected.isEligible) {
          activeEditor = inspected;
        }
      }

      if (!activeEditor || !activeEditor.isEligible) return;

      const selection = getActiveSelection(activeEditor.element);
      if (selection && selection.text.trim().length >= 3) {
        // Highlighting active: dismiss any autocomplete and activate selection toolbar
        if (autocompleteEngine) {
          autocompleteEngine.clearSuggestion();
        }

        if (settings.rewriteEnabled) {
          activeSnapshot = captureSelectionSnapshot(
            activeEditor.element,
            selection.text,
            selection.start,
            selection.end
          );
          renderUI();
        }
      } else if (!selection && activeSnapshot) {
        activeSnapshot = null;
        renderUI();
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
  },
});
