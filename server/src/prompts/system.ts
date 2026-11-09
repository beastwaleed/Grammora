import { GenerateParams } from '../providers/types.js';

export interface PromptPayload {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
}

export function buildPrompt(params: GenerateParams): PromptPayload {
  const { task, text, mode, completionLength } = params;

  switch (task) {
    case 'grammar':
      return {
        systemPrompt:
          'You are a precise grammar correction engine. Correct all spelling, grammar, punctuation, and capitalization errors in the user text. Maintain the original tone, vocabulary, and meaning. Return ONLY the corrected text. Do NOT add quotes, markdown formatting, explanations, or commentary.',
        userPrompt: text,
        maxTokens: 500,
        temperature: 0.1,
      };

    case 'rewrite':
      return {
        systemPrompt:
          'You are an expert editor and writing assistant. Paraphrase the user text to improve fluency, clarity, and sentence flow while strictly preserving the original core meaning and factual statements. Return ONLY the rephrased text. Do NOT add quotes, explanations, or commentary.',
        userPrompt: text,
        maxTokens: 500,
        temperature: 0.3,
      };

    case 'tone': {
      const selectedMode = (mode || 'professional').toLowerCase();
      let toneDirective = '';

      if (selectedMode === 'professional') {
        toneDirective =
          'Rewrite the user text in a clear, polished, and professional workplace tone suitable for business correspondence. Maintain the core message.';
      } else if (selectedMode === 'friendly') {
        toneDirective =
          'Rewrite the user text in a warm, welcoming, and conversational tone without altering the fundamental intent.';
      } else if (selectedMode === 'concise') {
        toneDirective =
          'Rewrite the user text concisely by eliminating unnecessary filler words and redundancy while preserving all key information.';
      } else {
        toneDirective =
          `Rewrite the user text in a ${selectedMode} tone while preserving its core meaning.`;
      }

      return {
        systemPrompt: `${toneDirective} Return ONLY the rewritten text. Do NOT wrap in quotes, formatting, or explanations.`,
        userPrompt: text,
        maxTokens: 500,
        temperature: 0.3,
      };
    }

    case 'autocomplete': {
      const isMedium = completionLength === 'medium';
      const tokenLimit = isMedium ? 30 : 15;
      const wordGuidance = isMedium ? '8 to 15 words' : '3 to 6 words';

      return {
        systemPrompt:
          `You are an autocomplete copilot. Given the preceding typing text, generate a natural continuation of approximately ${wordGuidance}. Do NOT repeat any part of the preceding text. Return ONLY the continuation text that immediately follows the prompt. No quotes, formatting, or commentary.`,
        userPrompt: `Preceding text: "${text}"\nContinuation:`,
        maxTokens: tokenLimit,
        temperature: 0.2,
      };
    }

    default:
      return {
        systemPrompt: 'You are a helpful writing assistant. Return ONLY the requested output.',
        userPrompt: text,
        maxTokens: 500,
        temperature: 0.2,
      };
  }
}
