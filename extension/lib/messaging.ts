import { GrammoraSettings, getSettings, isDomainExcluded, getHostnameFromUrl } from './settings';

export type ExtensionMessage =
  | { type: 'GET_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GrammoraSettings> }
  | { type: 'CHECK_SITE_STATUS'; payload: { url: string } }
  | { type: 'CHECK_BACKEND_HEALTH' }
  | { type: 'PING' };

export interface SiteStatusResponse {
  isGrammoraEnabled: boolean;
  isSiteExcluded: boolean;
  domain: string;
}

export interface BackendHealthResponse {
  ok: boolean;
  status: string;
  provider: string;
  version?: string;
  error?: string;
}

/**
 * Sends a typed message to the background service worker
 */
export async function sendToBackground<T>(message: ExtensionMessage): Promise<T> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    throw new Error('Chrome runtime messaging is not available');
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

