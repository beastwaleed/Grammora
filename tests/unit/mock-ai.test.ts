import { describe, it, expect } from 'vitest';
import { mockAIRequest } from '../../extension/lib/mock-ai';

describe('Local Mock AI Engine Unit Tests', () => {
  it('should fix grammar for sample error sentences', async () => {
    const input = "She don't knows how to use this application.";
    const response = await mockAIRequest(input, 'grammar', 10);

    expect(response.task).toBe('grammar');
    expect(response.originalText).toBe(input);
    expect(response.result).toBe("She doesn't know how to use this application.");
    expect(response.requestId).toBeDefined();
  });

  it('should generate rephrase suggestions preserving core meaning', async () => {
    const input = "I want to know about the job you posted.";
    const response = await mockAIRequest(input, 'rephrase', 10);

    expect(response.task).toBe('rephrase');
    expect(response.result).toBe(
      "I would like to inquire about the job opportunity you recently advertised."
    );
  });

  it('should generate distinct professional, friendly, and concise tones', async () => {
    const input = "Hey, can you give me the details of the job?";

    const prof = await mockAIRequest(input, 'professional', 10);
    const friendly = await mockAIRequest(input, 'friendly', 10);
    const concise = await mockAIRequest(input, 'concise', 10);

    expect(prof.result).toBe("Could you please share the details of the available position?");
    expect(friendly.result).toBe("Hi! Could you share some more details about the job?");
    expect(concise.result).toBe("Could you share the job details?");

    // Verify all 3 results are distinct
    expect(prof.result).not.toBe(friendly.result);
    expect(prof.result).not.toBe(concise.result);
    expect(friendly.result).not.toBe(concise.result);
  });

  it('should handle arbitrary sentences with heuristic fallbacks', async () => {
    const input = "teh quick brown fox";
    const response = await mockAIRequest(input, 'grammar', 10);

    expect(response.result.toLowerCase()).toContain('the quick brown fox');
  });
});

