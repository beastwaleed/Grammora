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
          'You are an expert grammar, spelling, and proofreading engine. Carefully review the input and correct ALL spelling mistakes, typos, grammatical errors, wrong word usage, punctuation errors, and capitalization issues. Transform broken or ungrammatical English into clean, correct, standard English while retaining the intended meaning. Output ONLY the corrected text. Do not wrap in quotes. Do not include explanations, notes, or greetings.',
        userPrompt: text,
        maxTokens: 1000,
        temperature: 0.1,
      };

    case 'rewrite':
      return {
        systemPrompt:
          'You are an elite copy editor and writing copilot. Rephrase and rewrite the user text to improve its flow, vocabulary, clarity, and elegance while strictly preserving the core meaning and all factual details. Output ONLY the rewritten text. Do not wrap in quotes. Do not include commentary, notes, or explanations.',
        userPrompt: text,
        maxTokens: 1000,
        temperature: 0.3,
      };

    case 'tone': {
      const selectedMode = (mode || 'professional').toLowerCase();

      if (selectedMode === 'concise') {
        return {
          systemPrompt:
            'You are a professional conciseness editor. Your goal is to make the user text significantly shorter, more direct, and punchy. Ruthlessly eliminate all filler words, redundancies, unnecessary preambles, and fluff while preserving the essential core message. The output MUST be noticeably more concise and brief than the original. Output ONLY the concise text. No quotes, formatting, or commentary.',
          userPrompt: text,
          maxTokens: 500,
          temperature: 0.2,
        };
      }

      if (selectedMode === 'professional') {
        return {
          systemPrompt:
            'You are an executive communications editor. Rewrite the user text in a polished, formal, and professional workplace tone suitable for business correspondence, client emails, and resumes. Output ONLY the rewritten text. No quotes, formatting, or commentary.',
          userPrompt: text,
          maxTokens: 1000,
          temperature: 0.3,
        };
      }

      if (selectedMode === 'friendly') {
        return {
          systemPrompt:
            'You are a friendly writing assistant. Rewrite the user text in a warm, enthusiastic, polite, and conversational tone while keeping its core message intact. Output ONLY the rewritten text. No quotes, formatting, or commentary.',
          userPrompt: text,
          maxTokens: 1000,
          temperature: 0.4,
        };
      }

      return {
        systemPrompt: `Rewrite the user text in a ${selectedMode} tone while preserving its core meaning. Output ONLY the rewritten text.`,
        userPrompt: text,
        maxTokens: 1000,
        temperature: 0.3,
      };
    }

    case 'autocomplete': {
      const isMedium = completionLength === 'medium';
      const tokenLimit = isMedium ? 40 : 20;
      const wordGuidance = isMedium ? '8 to 15 words' : '3 to 6 words';

      return {
        systemPrompt:
          `You are an autocomplete engine. Given the preceding text typed by the user, provide the most natural continuation of approximately ${wordGuidance}. Do NOT repeat or echo the prompt text. Return ONLY the continuation text that immediately follows. Do not add quotes, markdown, or commentary.`,
        userPrompt: `Preceding text: "${text}"\nContinuation:`,
        maxTokens: tokenLimit,
        temperature: 0.2,
      };
    }

    default:
      return {
        systemPrompt: 'You are a helpful writing assistant. Return ONLY the requested output.',
        userPrompt: text,
        maxTokens: 1000,
        temperature: 0.2,
      };
  }
}
