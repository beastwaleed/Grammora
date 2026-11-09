export type AITaskType = 'grammar' | 'rewrite' | 'tone' | 'autocomplete';

export interface GenerateParams {
  task: AITaskType;
  text: string;
  mode?: 'professional' | 'friendly' | 'concise' | string;
  completionLength?: 'short' | 'medium';
  timeoutMs?: number;
}

export interface GenerateResult {
  result: string;
  provider: string;
  model: string;
  latencyMs: number;
}

export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  generate(params: GenerateParams): Promise<GenerateResult>;
}

export interface ProviderErrorDetails {
  code:
    | 'INVALID_INPUT'
    | 'UNSUPPORTED_TASK'
    | 'PROVIDER_TIMEOUT'
    | 'PROVIDER_ERROR'
    | 'QUOTA_EXCEEDED'
    | 'PROVIDER_UNAVAILABLE';
  message: string;
  provider?: string;
  status?: number;
}

