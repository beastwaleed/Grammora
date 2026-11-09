import { AIProvider, GenerateParams, GenerateResult } from './types.js';

const MOCK_DATA: Record<string, Record<string, string>> = {
  "she don't knows how to use this application.": {
    grammar: "She doesn't know how to use this application.",
    rewrite: "She is unfamiliar with how to operate this application.",
    professional: "She requires guidance on utilizing this application effectively.",
    friendly: "She's still getting the hang of using this application!",
    concise: "She doesn't know how to use this application.",
  },
  "she don't knows how to use this application": {
    grammar: "She doesn't know how to use this application",
    rewrite: "She is unfamiliar with how to operate this application",
    professional: "She requires guidance on utilizing this application",
    friendly: "She's still getting the hang of using this application",
    concise: "She doesn't know how to use this application",
  },
  "i want to know about the job you posted.": {
    grammar: "I want to know about the job you posted.",
    rewrite: "I would like to inquire about the job opportunity you recently advertised.",
    professional: "I am writing to inquire regarding the available position.",
    friendly: "I'd love to learn more about the job you posted!",
    concise: "Could you share the job details?",
  },
  "hey, can you give me the details of the job?": {
    grammar: "Hey, can you give me the details of the job?",
    rewrite: "Could you please provide further details regarding the open role?",
    professional: "Could you please share the details of the available position?",
    friendly: "Hi! Could you share some more details about the job?",
    concise: "Could you share the job details?",
  },
  "i would like to apply": {
    autocomplete: " for the software engineering position at your company.",
    rewrite: "I am eager to submit my application",
  },
  "i am looking for": {
    autocomplete: " an opportunity to contribute my skills to your team.",
  },
};

export class MockProvider implements AIProvider {
  readonly name = 'mock';

  isConfigured(): boolean {
    return true;
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const { task, text, mode } = params;
    const start = Date.now();
    const key = text.trim().toLowerCase();

    let result = '';
    const actionKey = task === 'tone' ? (mode || 'professional') : task;

    if (MOCK_DATA[key] && MOCK_DATA[key][actionKey]) {
      result = MOCK_DATA[key][actionKey];
    } else {
      // Heuristic responses
      if (task === 'grammar') {
        let fixed = text
          .replace(/\bdon't knows\b/gi, "doesn't know")
          .replace(/\bteh\b/gi, 'the')
          .replace(/\bi is\b/gi, 'I am');
        result = fixed.charAt(0).toUpperCase() + fixed.slice(1);
      } else if (task === 'rewrite') {
        result = `In other words, ${text.charAt(0).toLowerCase() + text.slice(1)}`;
      } else if (task === 'tone') {
        if (mode === 'professional') {
          result = `I would appreciate if we could address: ${text}`;
        } else if (mode === 'friendly') {
          result = `Hey there! Just wanted to share: ${text}`;
        } else {
          result = text.replace(/\b(basically|actually|really|just|very)\b/gi, '').trim();
        }
      } else if (task === 'autocomplete') {
        result = ' and continue working on this project.';
      }
    }

    // Small simulated network latency (80ms)
    await new Promise((r) => setTimeout(r, 80));

    return {
      result,
      provider: this.name,
      model: 'mock-engine-v1',
      latencyMs: Date.now() - start,
    };
  }
}
