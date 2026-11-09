import { defineContentScript } from 'wxt/utils/define-content-script';
import { getSettings, isDomainExcluded, GrammoraSettings } from '../lib/settings';
import { inspectEditor, EditorInfo, getActiveSelection } from '../adapters/editor';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main() {
    let settings: GrammoraSettings | null = null;
    let activeEditor: EditorInfo | null = null;
    let shadowContainer: HTMLElement | null = null;
    let shadowRoot: ShadowRoot | null = null;

    console.log('[Grammora Content] Content script loaded on:', window.location.hostname);

    async function initialize() {
      try {
        settings = await getSettings();

        // Check if master toggle is disabled or site is excluded
        const hostname = window.location.hostname;
        if (!settings.enabled) {
          console.log('[Grammora Content] Master switch is disabled.');
          return;
        }

        if (isDomainExcluded(hostname, settings.excludedDomains)) {
          console.log('[Grammora Content] Website is excluded from Grammora:', hostname);
          return;
        }

        setupShadowDOM();
        attachEditorListeners();
        console.log('[Grammora Content] Active & listening for supported editors.');
      } catch (err) {
        console.error('[Grammora Content] Initialization error:', err);
      }
    }

    /**
     * Creates an isolated Shadow DOM host for Grammora floating elements
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
      document.body.appendChild(shadowContainer);
    }

    /**
     * Attaches global listeners to track focus and editor interactions
     */
    function attachEditorListeners() {
      // Focus tracking
      document.addEventListener('focusin', handleFocusIn, true);
      document.addEventListener('focusout', handleFocusOut, true);

      // Selection tracking
      document.addEventListener('selectionchange', handleSelectionChange);
      document.addEventListener('mouseup', handleMouseUp);
    }

    function handleFocusIn(event: FocusEvent) {
      const inspected = inspectEditor(event.target);
      if (inspected && inspected.isEligible) {
        activeEditor = inspected;
        console.log(`[Grammora Content] Detected supported editor (${inspected.type})`, inspected.element);
      } else if (inspected && !inspected.isEligible) {
        activeEditor = null;
        console.log(`[Grammora Content] Ignored editor (${inspected.reason})`);
      }
    }

    function handleFocusOut(event: FocusEvent) {
      if (activeEditor && activeEditor.element === event.target) {
        activeEditor = null;
      }
    }

    function handleSelectionChange() {
      if (!activeEditor || !activeEditor.isEligible) return;

      const sel = getActiveSelection(activeEditor.element);
      if (sel && sel.text.length >= 3) {
        // Selection detected inside eligible editor - Phase 1 verification
        // (Full toolbar dock will attach in Phase 2)
      }
    }

    function handleMouseUp() {
      if (!activeEditor || !activeEditor.isEligible) return;
      handleSelectionChange();
    }

    // Initialize on document idle
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
  },
});
