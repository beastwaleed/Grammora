import { defineBackground } from 'wxt/utils/define-background';
import { getSettings, saveSettings, isDomainExcluded, getHostnameFromUrl, DEFAULT_SETTINGS } from '../lib/settings';
import { ExtensionMessage } from '../lib/messaging';

export default defineBackground(() => {
  console.log('[Grammora Background] Service worker initialized.');

  // Handle extension installation
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      console.log('[Grammora Background] First install detected. Initializing storage defaults.');
      await saveSettings(DEFAULT_SETTINGS);
    }
  });

  // Handle runtime messages
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    (async () => {
      try {
        switch (message.type) {
          case 'PING':
            sendResponse({ ok: true, timestamp: Date.now() });
            break;

          case 'GET_SETTINGS': {
            const settings = await getSettings();
            sendResponse({ ok: true, data: settings });
            break;
          }

          case 'UPDATE_SETTINGS': {
            const updated = await saveSettings(message.payload);
            sendResponse({ ok: true, data: updated });
            break;
          }

          case 'CHECK_SITE_STATUS': {
            const settings = await getSettings();
            const domain = getHostnameFromUrl(message.payload.url);
            const isExcluded = isDomainExcluded(domain, settings.excludedDomains);
            sendResponse({
              ok: true,
              data: {
                isGrammoraEnabled: settings.enabled && !isExcluded,
                isSiteExcluded: isExcluded,
                domain,
              },
            });
            break;
          }

          case 'CHECK_BACKEND_HEALTH': {
            const settings = await getSettings();
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 3000);
              const res = await fetch(`${settings.backendUrl}/api/health`, {
                signal: controller.signal,
              });
              clearTimeout(timeout);

              if (res.ok) {
                const data = await res.json();
                sendResponse({ ok: true, ...data });
              } else {
                sendResponse({ ok: false, status: 'error', error: `HTTP ${res.status}` });
              }
            } catch (err: any) {
              sendResponse({
                ok: false,
                status: 'offline',
                error: err.name === 'AbortError' ? 'Backend timeout' : 'Backend not reachable',
              });
            }
            break;
          }

          default:
            sendResponse({ ok: false, error: 'Unknown message type' });
        }
      } catch (err: any) {
        console.error('[Grammora Background] Error handling message:', err);
        sendResponse({ ok: false, error: err.message || 'Internal error' });
      }
    })();

    // Required for asynchronous sendResponse in Chrome MV3
    return true;
  });
});
