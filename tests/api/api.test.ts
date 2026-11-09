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
      expect(res.body.result).toBe(
        'I would like to inquire about the job opportunity you recently advertised.'
      );
    });
  });

  describe('POST /api/tone', () => {
    it('should return distinct tone transformations', async () => {
      const text = 'Hey, can you give me the details of the job?';

      const profRes = await request(app)
        .post('/api/tone')
        .send({ text, mode: 'professional' });
      expect(profRes.status).toBe(200);
      expect(profRes.body.result).toBe('Could you please share the details of the available position?');

      const friendlyRes = await request(app)
        .post('/api/tone')
        .send({ text, mode: 'friendly' });
      expect(friendlyRes.status).toBe(200);
      expect(friendlyRes.body.result).toBe('Hi! Could you share some more details about the job?');

      const conciseRes = await request(app)
        .post('/api/tone')
        .send({ text, mode: 'concise' });
      expect(conciseRes.status).toBe(200);
      expect(conciseRes.body.result).toBe('Could you share the job details?');
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
      expect(res.body.result).toContain('software engineering position');
    });
  });
});
