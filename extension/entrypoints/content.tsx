import { defineContentScript } from 'wxt/utils/define-content-script';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { getSettings, isDomainExcluded, GrammoraSettings } from '../lib/settings';
import { inspectEditor, EditorInfo, getActiveSelection } from '../adapters/editor';
import { captureSelectionSnapshot, SelectionSnapshot } from '../adapters/replacement';
import { FloatingWritingCompanion } from '../components/FloatingWritingCompanion';
// @ts-ignore - Vite inline CSS import
import globalCss from '../styles/globals.css?inline';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main() {
    let settings: GrammoraSettings | null = null;
    let activeEditor: EditorInfo | null = null;
    let activeSnapshot: SelectionSnapshot | null = null;
    let reactRoot: ReactDOM.Root | null = null;
    let shadowContainer: HTMLElement | null = null;
    let shadowRoot: ShadowRoot | null = null;

    console.log('[Grammora Content] Initializing content script on:', window.location.hostname);

    async function initialize() {
      try {
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

        setupShadowDOM();
        attachEventListeners();
        console.log('[Grammora Content] Ready and listening for editor selections.');
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
          <FloatingWritingCompanion
            snapshot={activeSnapshot}
            onClose={() => {
              activeSnapshot = null;
              renderUI();
            }}
          />
        </React.StrictMode>
      );
    }

    /**
     * Attaches selection, mouseup, and keyup event listeners
     */
    function attachEventListeners() {
      // Focus tracking
      document.addEventListener('focusin', handleFocusIn, true);
      document.addEventListener('focusout', handleFocusOut, true);

      // Selection tracking
      document.addEventListener('mouseup', handleSelectionUpdate);
      document.addEventListener('keyup', handleKeyUp);
      document.addEventListener('selectionchange', handleSelectionChange);
    }

    function handleFocusIn(event: FocusEvent) {
      const inspected = inspectEditor(event.target);
      if (inspected && inspected.isEligible) {
        activeEditor = inspected;
      } else {
        activeEditor = null;
      }
    }

    function handleFocusOut(event: FocusEvent) {
      // Small timeout to allow click on toolbar without immediate teardown
      setTimeout(() => {
        if (
          activeEditor &&
          activeEditor.element === event.target &&
          !activeSnapshot
        ) {
          activeEditor = null;
        }
      }, 150);
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
      // When user deselects to 0 characters and toolbar is closed
      if (!activeEditor || !activeEditor.isEligible) return;

      const sel = getActiveSelection(activeEditor.element);
      if (!sel && activeSnapshot && !activeSnapshot.element.isConnected) {
        activeSnapshot = null;
        renderUI();
      }
    }

    function handleSelectionUpdate() {
      if (!settings || !settings.enabled || !settings.rewriteEnabled) {
        return;
      }

      // If activeEditor is not set, try inspecting activeElement
      if (!activeEditor) {
        const inspected = inspectEditor(document.activeElement);
        if (inspected && inspected.isEligible) {
          activeEditor = inspected;
        }
      }

      if (!activeEditor || !activeEditor.isEligible) {
        return;
      }

      const selection = getActiveSelection(activeEditor.element);
      if (selection && selection.text.trim().length >= 3) {
        // Capture snapshot of current selection
        activeSnapshot = captureSelectionSnapshot(
          activeEditor.element,
          selection.text,
          selection.start,
          selection.end
        );
        renderUI();
      } else if (!selection && activeSnapshot) {
        // Selection cleared
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
