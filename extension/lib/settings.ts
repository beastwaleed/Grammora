export type CompletionLength = 'short' | 'medium';

export interface GrammoraSettings {
  enabled: boolean;
  autocompleteEnabled: boolean;
  rewriteEnabled: boolean;
  completionLength: CompletionLength;
  excludedDomains: string[];
  hasConsented: boolean;
  debounceMs: number;
  backendUrl: string;
}

export const DEFAULT_SETTINGS: GrammoraSettings = {
  enabled: true,
  autocompleteEnabled: true,
  rewriteEnabled: true,
  completionLength: 'short',
  excludedDomains: [],
  hasConsented: true,
  debounceMs: 350,
  backendUrl: 'https://grammora-omega.vercel.app',
};

const STORAGE_KEY = 'grammora_settings';

/**
 * Checks if chrome.storage.local is available and the extension context is valid
 */
function isStorageAvailable(): boolean {
  try {
    return typeof chrome !== 'undefined' && !!chrome?.runtime?.id && !!chrome?.storage?.local;
  } catch {
    return false;
  }
}

/**
 * Retrieves the persisted Grammora settings, merging with default values.
 */
export async function getSettings(): Promise<GrammoraSettings> {
  if (!isStorageAvailable()) {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      return local ? { ...DEFAULT_SETTINGS, ...JSON.parse(local) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (chrome.runtime?.lastError || !result || !result[STORAGE_KEY]) {
          resolve(DEFAULT_SETTINGS);
        } else {
          const stored = result[STORAGE_KEY];
          // Ensure cloud AI hasConsented is true by default for live Groq/Gemini processing
          const hasConsented = stored.hasConsented !== false;
          resolve({
            ...DEFAULT_SETTINGS,
            ...stored,
            hasConsented,
          });
        }
      });
    } catch {
      resolve(DEFAULT_SETTINGS);
    }
  });
}

/**
 * Persists updated settings to chrome.storage.local.
 */
export async function saveSettings(
  updates: Partial<GrammoraSettings>
): Promise<GrammoraSettings> {
  const current = await getSettings();
  const next: GrammoraSettings = {
    ...current,
    ...updates,
  };

  if (!isStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Fallback in memory
    }
    return next;
  }

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: next }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(next);
      }
    });
  });
}

/**
 * Checks if a specific hostname or domain is in the user's excluded list
 */
export function isDomainExcluded(hostname: string, excludedList: string[]): boolean {
  const cleanHost = hostname.toLowerCase().trim();
  return excludedList.some((domain) => {
    const cleanDomain = domain.toLowerCase().trim();
    return cleanHost === cleanDomain || cleanHost.endsWith(`.${cleanDomain}`);
  });
}

/**
 * Extract clean hostname from a given URL string
 */
export function getHostnameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}

