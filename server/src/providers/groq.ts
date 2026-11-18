import { AIProvider, GenerateParams, GenerateResult } from './types.js';
import { buildPrompt } from '../prompts/system.js';

export class GroqProvider implements AIProvider {
  readonly name = 'groq';
  private apiKey: string;
  private configuredModel?: string;
  private endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
    this.configuredModel = model || process.env.GROQ_MODEL;
  }

  private getApiKey(): string {
    return this.apiKey || process.env.GROQ_API_KEY || '';
  }

  private resolveModel(task: string): string {
    if (this.configuredModel) {
      return this.configuredModel;
    }
    // Autocomplete requires ultra-low latency without reasoning token overhead
    if (task === 'autocomplete') {
      return 'qwen/qwen3.8-27b';
    }
    // High-intelligence writing tasks (grammar, rewrite, tone) use the 120B parameter model
    return 'openai/gpt-oss-120b';
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return !!key && key.trim().length > 0 && !key.includes('replace-with');
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const apiKey = this.getApiKey();
    if (!this.isConfigured()) {
      throw new Error('Groq API key is not configured');
    }

    const primaryModel = this.resolveModel(params.task);

    try {
      return await this.callGroq(primaryModel, apiKey, params);
    } catch (err: any) {
      // If the primary model fails and it's not already qwen, attempt fallback to qwen
      if (primaryModel !== 'qwen/qwen3.8-27b') {
        console.warn(`[GroqProvider] ${primaryModel} failed: ${err.message}. Retrying with qwen/qwen3.8-27b...`);
        return await this.callGroq('qwen/qwen3.8-27b', apiKey, params);
      }
      throw err;
    }
  }

  private async callGroq(
    model: string,
    apiKey: string,
    params: GenerateParams
  ): Promise<GenerateResult> {
    const { systemPrompt, userPrompt, maxTokens, temperature } = buildPrompt(params);
    const timeoutMs = params.timeoutMs || Number(process.env.REQUEST_TIMEOUT_MS) || 12000;
    const start = Date.now();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Ensure reasoning models have enough token headroom
    const tokenLimit = model.includes('120b') ? Math.max(maxTokens, 600) : maxTokens;

    const requestBody: Record<string, any> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: tokenLimit,
      temperature,
    };

    if (params.seed !== undefined) {
      requestBody.seed = params.seed;
    } else if (params.retryCount) {
      requestBody.seed = Math.floor(Date.now() % 1000000) + params.retryCount * 7919;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorBody = await response.text();
        if (response.status === 429) {
          const err = new Error(`Groq rate limit exceeded: ${errorBody}`);
          (err as any).code = 'QUOTA_EXCEEDED';
          throw err;
        }
        const err = new Error(`Groq API returned HTTP ${response.status}: ${errorBody}`);
        (err as any).code = 'PROVIDER_ERROR';
        (err as any).status = response.status;
        throw err;
      }

      const data = await response.json();
      let outputText: string = data.choices?.[0]?.message?.content || '';

      // Clean up common model quotation artifacts
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
        model,
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Groq request timed out after ${timeoutMs}ms`);
        (timeoutErr as any).code = 'PROVIDER_TIMEOUT';
        throw timeoutErr;
      }
      throw err;
    }
  }
}
