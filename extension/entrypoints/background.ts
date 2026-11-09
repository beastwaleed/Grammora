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

          case 'EXECUTE_AI_ACTION': {
            const settings = await getSettings();
            const { text, action } = message.payload;
            const backendUrl = settings.backendUrl || 'https://grammora-omega.vercel.app';

            let endpoint = `${backendUrl}/api/rewrite`;
            let bodyPayload: Record<string, any> = {
              text,
              requestId: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            };

            if (action === 'grammar') {
              endpoint = `${backendUrl}/api/grammar`;
            } else if (action === 'rephrase') {
              endpoint = `${backendUrl}/api/rewrite`;
            } else if (['professional', 'friendly', 'concise'].includes(action)) {
              endpoint = `${backendUrl}/api/tone`;
              bodyPayload.mode = action;
            }

            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 12000);

              const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload),
                signal: controller.signal,
              });

              clearTimeout(timeout);

              if (res.ok) {
                const data = await res.json();
                sendResponse({
                  ok: true,
                  result: data.result,
                  provider: data.provider,
                  model: data.model,
                  latencyMs: data.latencyMs,
                });
              } else {
                const errData = await res.json().catch(() => ({}));
                sendResponse({
                  ok: false,
                  error: errData?.error?.message || `HTTP ${res.status}`,
                });
              }
            } catch (err: any) {
              sendResponse({
                ok: false,
                error: err.name === 'AbortError' ? 'AI request timed out' : err.message || 'Network error',
              });
            }
            break;
          }

          case 'EXECUTE_AUTOCOMPLETE': {
            const settings = await getSettings();
            const { text, completionLength = 'short' } = message.payload;
            const backendUrl = settings.backendUrl || 'https://grammora-omega.vercel.app';

            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 8000);

              const res = await fetch(`${backendUrl}/api/autocomplete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text,
                  completionLength,
                  requestId: `ac-${Date.now()}`,
                }),
                signal: controller.signal,
              });

              clearTimeout(timeout);

              if (res.ok) {
                const data = await res.json();
                sendResponse({
                  ok: true,
                  result: data.result,
                  provider: data.provider,
                  model: data.model,
                  latencyMs: data.latencyMs,
                });
              } else {
                sendResponse({ ok: false, error: `HTTP ${res.status}` });
              }
            } catch (err: any) {
              sendResponse({ ok: false, error: err.message });
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
