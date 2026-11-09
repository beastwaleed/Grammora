import { AIProvider, GenerateParams, GenerateResult } from './types.js';
import { buildPrompt } from '../prompts/system.js';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.model = model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('replace-with');
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured');
    }

    const { systemPrompt, userPrompt, maxTokens, temperature } = buildPrompt(params);
    const timeoutMs = params.timeoutMs || Number(process.env.REQUEST_TIMEOUT_MS) || 12000;
    const start = Date.now();

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorBody = await response.text();
        if (response.status === 429) {
          const err = new Error(`Gemini rate limit exceeded: ${errorBody}`);
          (err as any).code = 'QUOTA_EXCEEDED';
          throw err;
        }
        const err = new Error(`Gemini API returned HTTP ${response.status}: ${errorBody}`);
        (err as any).code = 'PROVIDER_ERROR';
        (err as any).status = response.status;
        throw err;
      }

      const data = await response.json();
      let outputText: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      outputText = outputText.trim();
      if (
        (outputText.startsWith('"') && outputText.endsWith('"')) ||
        (outputText.startsWith("'") && outputText.endsWith("'"))
      ) {
        outputText = outputText.slice(1, -1).trim();
      }

      return {
        result: outputText,
        provider: this.name,
        model: this.model,
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Gemini request timed out after ${timeoutMs}ms`);
        (timeoutErr as any).code = 'PROVIDER_TIMEOUT';
        throw timeoutErr;
      }
      throw err;
    }
  }
}
