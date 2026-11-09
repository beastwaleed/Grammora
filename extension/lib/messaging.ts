import { GrammoraSettings, getSettings, isDomainExcluded, getHostnameFromUrl } from './settings';
import { WritingActionType } from './mock-ai';

export type ExtensionMessage =
  | { type: 'GET_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GrammoraSettings> }
  | { type: 'CHECK_SITE_STATUS'; payload: { url: string } }
  | { type: 'CHECK_BACKEND_HEALTH' }
  | { type: 'EXECUTE_AI_ACTION'; payload: { text: string; action: WritingActionType } }
  | { type: 'EXECUTE_AUTOCOMPLETE'; payload: { text: string; completionLength?: 'short' | 'medium' } }
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

export interface AIActionResponse {
  ok: boolean;
  result?: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  error?: string;
}

/**
 * Checks whether the Chrome extension runtime context is valid and active.
 * When an extension is reloaded or updated in chrome://extensions, old content
 * scripts become orphaned and accessing chrome.runtime.id throws or returns undefined.
 */
export function isExtensionContextValid(): boolean {
  try {
    return typeof chrome !== 'undefined' && !!chrome?.runtime && !!chrome.runtime.id;
  } catch {
    return false;
  }
}

/**
 * Sends a typed message to the background service worker
 */
export async function sendToBackground<T>(message: ExtensionMessage): Promise<T> {
  if (!isExtensionContextValid() || !chrome.runtime?.sendMessage) {
    throw new Error('Extension context invalidated. Please refresh the page to reconnect Grammora.');
  }

  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    } catch (err: any) {
      reject(err);
    }
  });
}
