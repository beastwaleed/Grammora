/**
 * Local Mock AI engine for Phase 2 development and testing.
 * Provides realistic transformations for grammar, rephrase, and tones
 * without needing an external cloud API key.
 */

export type WritingActionType = 'grammar' | 'rephrase' | 'professional' | 'friendly' | 'concise';

export interface AIResponse {
  requestId: string;
  task: string;
  originalText: string;
  result: string;
  latencyMs: number;
}

// Known sample mappings from specification and common use cases
const MOCK_MAP: Record<string, Partial<Record<WritingActionType, string>>> = {
  "she don't knows how to use this application.": {
    grammar: "She doesn't know how to use this application.",
    rephrase: "She is unfamiliar with how to operate this application.",
    professional: "She requires guidance on utilizing this application effectively.",
    friendly: "She's still getting the hang of using this application!",
    concise: "She doesn't know how to use this application.",
  },
  "she don't knows how to use this application": {
    grammar: "she doesn't know how to use this application",
    rephrase: "she is unfamiliar with how to operate this application",
    professional: "she requires guidance on utilizing this application",
    friendly: "she's still getting the hang of using this application",
    concise: "she doesn't know how to use this application",
  },
  "i want to know about the job you posted.": {
    grammar: "I want to know about the job you posted.",
    rephrase: "I would like to inquire about the job opportunity you recently advertised.",
    professional: "I am writing to inquire about the position you recently announced.",
    friendly: "I'd love to learn more about the job you recently posted!",
    concise: "Could you share details about the posted position?",
  },
  "hey, can you give me the details of the job?": {
    grammar: "Hey, can you give me the details of the job?",
    rephrase: "Could you please provide further details regarding the open role?",
    professional: "Could you please share the details of the available position?",
    friendly: "Hi! Could you share some more details about the job?",
    concise: "Could you share the job details?",
  },
  "i would like to apply": {
    grammar: "I would like to apply",
    rephrase: "I am eager to submit my application",
    professional: "I am writing to formally submit my application",
    friendly: "I'm really excited to apply",
    concise: "I am applying",
  },
};

/**
 * Generate heuristic fallback for any arbitrary text
 */
function generateHeuristicResponse(text: string, action: WritingActionType): string {
  const trimmed = text.trim();
  const endsWithPeriod = trimmed.endsWith('.');
  const base = endsWithPeriod ? trimmed.slice(0, -1) : trimmed;

  switch (action) {
    case 'grammar': {
      // Fix basic contractions, subject-verb agreement, and capitalization
      let corrected = text;
      corrected = corrected.replace(/\bdon't knows\b/gi, "doesn't know");
      corrected = corrected.replace(/\bhe know\b/gi, 'he knows');
      corrected = corrected.replace(/\bshe know\b/gi, 'she knows');
      corrected = corrected.replace(/\bi is\b/gi, 'I am');
      corrected = corrected.replace(/\bthey is\b/gi, 'they are');
      corrected = corrected.replace(/\bteh\b/gi, 'the');
      corrected = corrected.replace(/\brecieve\b/gi, 'receive');
      corrected = corrected.replace(/\bseperate\b/gi, 'separate');

      // Capitalize first letter
      if (corrected.length > 0) {
        corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
      }
      return corrected.trim() === text.trim() ? `${corrected}${endsWithPeriod ? '' : '.'}` : corrected;
    }

    case 'rephrase': {
      if (base.toLowerCase().startsWith('i want to')) {
        return `I would appreciate the opportunity to ${base.slice(10).trim()}${endsWithPeriod ? '.' : ''}`;
      }
      return `In other words, ${base.charAt(0).toLowerCase() + base.slice(1)}${endsWithPeriod ? '.' : ''}`;
    }

    case 'professional': {
      if (base.toLowerCase().startsWith('hey') || base.toLowerCase().startsWith('hi')) {
        return `Dear Team, could you please provide further details regarding this matter?`;
      }
      return `Please be advised that ${base.charAt(0).toLowerCase() + base.slice(1)}${endsWithPeriod ? '.' : ''}`;
    }

    case 'friendly': {
      return `Hi there! Just wanted to share: ${base}${endsWithPeriod ? '!' : '!'}`;
    }

    case 'concise': {
      // Strip filler words
      let concise = base
        .replace(/\b(in my opinion|to be honest|basically|actually|really|just|very)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      return `${concise}${endsWithPeriod ? '.' : ''}`;
    }
  }
}

/**
 * Executes a simulated AI writing action with realistic network latency
 */
export async function mockAIRequest(
  text: string,
  action: WritingActionType,
  delayMs: number = 400
): Promise<AIResponse> {
  const start = Date.now();
  const normalizedKey = text.trim().toLowerCase();

  return new Promise((resolve) => {
    setTimeout(() => {
      let resultText: string;
      const matched = MOCK_MAP[normalizedKey];

      if (matched && matched[action]) {
        resultText = matched[action]!;
      } else {
        resultText = generateHeuristicResponse(text, action);
      }

      resolve({
        requestId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        task: action,
        originalText: text,
        result: resultText,
        latencyMs: Date.now() - start,
      });
    }, delayMs);
  });
}

