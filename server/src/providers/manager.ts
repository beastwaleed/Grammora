import { AIProvider, GenerateParams, GenerateResult } from './types.js';
import { GroqProvider } from './groq.js';
import { GeminiProvider } from './gemini.js';
import { MockProvider } from './mock.js';

export class ProviderManager {
  private primaryProvider: AIProvider;
  private backupProvider: AIProvider;
  private mockProvider: AIProvider;

  constructor() {
    this.primaryProvider = new GroqProvider();
    this.backupProvider = new GeminiProvider();
    this.mockProvider = new MockProvider();
  }

  getActiveProviderName(): string {
    if (this.primaryProvider.isConfigured()) return this.primaryProvider.name;
    if (this.backupProvider.isConfigured()) return this.backupProvider.name;
    return this.mockProvider.name;
  }

  getProviderStatus(): {
    primary: { name: string; configured: boolean };
    backup: { name: string; configured: boolean };
    active: string;
  } {
    const primaryConfigured = this.primaryProvider.isConfigured();
    const backupConfigured = this.backupProvider.isConfigured();

    return {
      primary: { name: this.primaryProvider.name, configured: primaryConfigured },
      backup: { name: this.backupProvider.name, configured: backupConfigured },
      active: primaryConfigured
        ? this.primaryProvider.name
        : backupConfigured
        ? this.backupProvider.name
        : 'mock',
    };
  }

  async execute(params: GenerateParams): Promise<GenerateResult> {
    // 1. If Primary (Groq) is configured, attempt primary first
    if (this.primaryProvider.isConfigured()) {
      try {
        return await this.primaryProvider.generate(params);
      } catch (err: any) {
        console.warn(
          `[ProviderManager] Primary provider (${this.primaryProvider.name}) failed: ${err.message}. Attempting backup provider...`
        );

        // 2. Fall back to Backup (Gemini) if configured
        if (this.backupProvider.isConfigured()) {
          try {
            return await this.backupProvider.generate(params);
          } catch (backupErr: any) {
            console.error(
              `[ProviderManager] Backup provider (${this.backupProvider.name}) also failed: ${backupErr.message}`
            );
            // If both real providers failed, return mock in local/dev mode or rethrow
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[ProviderManager] Falling back to MockProvider for local continuity.');
              return await this.mockProvider.generate(params);
            }
            throw backupErr;
          }
        }

        if (process.env.NODE_ENV !== 'production') {
          console.warn('[ProviderManager] No backup configured. Falling back to MockProvider.');
          return await this.mockProvider.generate(params);
        }
        throw err;
      }
    }

    // 3. If only Secondary (Gemini) is configured
    if (this.backupProvider.isConfigured()) {
      try {
        return await this.backupProvider.generate(params);
      } catch (err: any) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[ProviderManager] Gemini failed. Falling back to MockProvider.');
          return await this.mockProvider.generate(params);
        }
        throw err;
      }
    }

    // 4. Default to MockProvider when no API keys are present
    return await this.mockProvider.generate(params);
  }
}

export const providerManager = new ProviderManager();

