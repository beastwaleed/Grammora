import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import { Express } from 'express';

describe('Grammora Express Backend API Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/health', () => {
    it('should return health status and provider configuration', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.status).toBe('healthy');
      expect(res.body.providers).toBeDefined();
      expect(res.body.providers.primary.name).toBe('groq');
      expect(res.body.providers.backup.name).toBe('gemini');
    });
  });

  describe('POST /api/grammar', () => {
    it('should correct grammar error in text', async () => {
      const res = await request(app)
        .post('/api/grammar')
        .send({
          text: "She don't knows how to use this application.",
          requestId: 'test-grammar-1',
        });

      expect(res.status).toBe(200);
      expect(res.body.requestId).toBe('test-grammar-1');
      expect(res.body.task).toBe('grammar');
      expect(res.body.result).toBe("She doesn't know how to use this application.");
      expect(res.body.latencyMs).toBeGreaterThan(0);
    });

    it('should reject empty text with 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .post('/api/grammar')
        .send({ text: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('POST /api/rewrite', () => {
    it('should rephrase input text', async () => {
      const res = await request(app)
        .post('/api/rewrite')
        .send({
          text: 'I want to know about the job you posted.',
          requestId: 'test-rewrite-1',
        });

      expect(res.status).toBe(200);
      expect(res.body.task).toBe('rewrite');
      expect(typeof res.body.result).toBe('string');
      expect(res.body.result.length).toBeGreaterThan(0);
      expect(res.body.result).not.toBe('I want to know about the job you posted.');
    });
  });

  describe('POST /api/tone', () => {
    it('should return distinct tone transformations', async () => {
      const text = 'Hey, can you give me the details of the job?';

      const profRes = await request(app)
        .post('/api/tone')
        .send({ text, mode: 'professional' });
      expect(profRes.status).toBe(200);
      expect(typeof profRes.body.result).toBe('string');
      expect(profRes.body.result.length).toBeGreaterThan(0);

      const friendlyRes = await request(app)
        .post('/api/tone')
        .send({ text, mode: 'friendly' });
      expect(friendlyRes.status).toBe(200);
      expect(typeof friendlyRes.body.result).toBe('string');
      expect(friendlyRes.body.result.length).toBeGreaterThan(0);

      const conciseRes = await request(app)
        .post('/api/tone')
        .send({ text, mode: 'concise' });
      expect(conciseRes.status).toBe(200);
      expect(typeof conciseRes.body.result).toBe('string');
      expect(conciseRes.body.result.length).toBeGreaterThan(0);

      // Verify that professional and friendly modes produce distinct outputs
      expect(profRes.body.result).not.toBe(friendlyRes.body.result);
    });

    it('should rephrase a question without answering it', async () => {
      const res = await request(app)
        .post('/api/tone')
        .send({
          text: 'Hey, can you give me the details of the job?',
          mode: 'professional',
        });

      expect(res.status).toBe(200);
      expect(typeof res.body.result).toBe('string');
      // The output must preserve the question rather than answering it
      expect(res.body.result).toMatch(/\?$/);
      expect(res.body.result.toLowerCase()).not.toContain('here are');
    });
  });

  describe('POST /api/autocomplete', () => {
    it('should return contextual continuation', async () => {
      const res = await request(app)
        .post('/api/autocomplete')
        .send({
          text: 'I would like to apply',
          completionLength: 'short',
        });

      expect(res.status).toBe(200);
      expect(res.body.task).toBe('autocomplete');
      expect(typeof res.body.result).toBe('string');
      expect(res.body.result.length).toBeGreaterThan(0);
    });

    it('should return empty result for text ending with terminal punctuation', async () => {
      const res = await request(app)
        .post('/api/autocomplete')
        .send({
          text: 'How do I best prepare for my upcoming job interview?',
          completionLength: 'short',
        });

      expect(res.status).toBe(200);
      expect(res.body.result).toBe('');
      expect(res.body.model).toBe('terminal-punctuation-guard');
    });
  });
});

