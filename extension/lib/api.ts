import { getSettings } from './settings';
import { sendToBackground, AIActionResponse } from './messaging';
import { mockAIRequest, WritingActionType } from './mock-ai';

export interface AIActionResult {
  result: string;
  provider: string;
  model: string;
  latencyMs: number;
  isFallback?: boolean;
}

/**
 * Dispatches an AI writing transformation request to the Express backend gateway
 * via the background service worker (to avoid webpage CORS and mixed-content blocks).
 */
export async function executeAIAction(
  text: string,
  action: WritingActionType
): Promise<AIActionResult> {
  const settings = await getSettings();
  const start = Date.now();

  // 1. Consent guard
  if (!settings.hasConsented) {
    console.log('[Grammora API] Cloud AI consent not granted yet. Using local engine.');
    const mockRes = await mockAIRequest(text, action, 250);
    return {
      result: mockRes.result,
      provider: 'local-offline',
      model: 'local-rules',
      latencyMs: Date.now() - start,
      isFallback: true,
    };
  }

  // 2. Dispatch via background service worker (exempt from webpage CORS & Mixed-Content)
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      const response = await sendToBackground<AIActionResponse>({
        type: 'EXECUTE_AI_ACTION',
        payload: { text, action },
      });

      if (response && response.ok && response.result) {
        return {
          result: response.result,
          provider: response.provider || 'groq',
          model: response.model || 'live',
          latencyMs: response.latencyMs || Date.now() - start,
        };
      }

      throw new Error(response?.error || 'AI gateway returned an error');
    } catch (err: any) {
      console.warn('[Grammora API] Background messaging failed:', err.message);
      // Fall through to direct fetch fallback
    }
  }

  // 3. Direct fetch fallback (for local development/test environments)
  const backendUrl = settings.backendUrl || 'http://localhost:3001';
  let endpoint = `${backendUrl}/api/rewrite`;
  let bodyPayload: Record<string, any> = {
    text,
    requestId: `direct-${Date.now()}`,
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
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        result: data.result,
        provider: data.provider || 'gateway',
        model: data.model || 'live',
        latencyMs: data.latencyMs || Date.now() - start,
      };
    }
  } catch (err: any) {
    console.warn('[Grammora API] Direct fetch failed:', err.message);
  }

  // 4. Final fallback to mock engine
  const mockRes = await mockAIRequest(text, action, 300);
  return {
    result: mockRes.result,
    provider: 'mock-fallback',
    model: 'local-heuristic',
    latencyMs: Date.now() - start,
    isFallback: true,
  };
}
