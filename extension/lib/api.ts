import { getSettings } from './settings';
import { mockAIRequest, WritingActionType } from './mock-ai';

export interface AIActionResult {
  result: string;
  provider: string;
  model: string;
  latencyMs: number;
  isFallback?: boolean;
}

/**
 * Dispatches an AI writing transformation request to the Express backend gateway.
 * Automatically falls back to the local mock engine if the backend is offline.
 */
export async function executeAIAction(
  text: string,
  action: WritingActionType
): Promise<AIActionResult> {
  const settings = await getSettings();
  const backendUrl = settings.backendUrl || 'http://localhost:3001';
  const start = Date.now();

  let endpoint = `${backendUrl}/api/rewrite`;
  let payload: Record<string, any> = {
    text,
    requestId: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };

  if (action === 'grammar') {
    endpoint = `${backendUrl}/api/grammar`;
  } else if (action === 'rephrase') {
    endpoint = `${backendUrl}/api/rewrite`;
  } else if (['professional', 'friendly', 'concise'].includes(action)) {
    endpoint = `${backendUrl}/api/tone`;
    payload.mode = action;
  }

  // Attempt real backend gateway first
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return {
        result: data.result,
        provider: data.provider || 'gateway',
        model: data.model || 'live',
        latencyMs: data.latencyMs || Date.now() - start,
      };
    }

    // Structured error from server
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${response.status}`);
  } catch (backendError: any) {
    console.warn(
      `[Grammora API] Backend call to ${endpoint} failed (${backendError.message}). Using local fallback.`
    );

    // Fall back to local mock engine for testing continuity
    const mockRes = await mockAIRequest(text, action, 300);
    return {
      result: mockRes.result,
      provider: 'mock-fallback',
      model: 'local-heuristic',
      latencyMs: Date.now() - start,
      isFallback: true,
    };
  }
}
