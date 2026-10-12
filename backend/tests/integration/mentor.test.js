// tests/integration/mentor.test.js — integration tests for /mentor AI Senior Dev route
const request = require('supertest');
const app     = require('../../src/index');

describe('POST /mentor', () => {
  test('400 — missing ticketId', async () => {
    const res = await request(app)
      .post('/mentor')
      .send({ code: 'const x = 1;' })
      .expect(400);

    expect(res.body.error).toMatch(/ticketId and code are required/i);
  });

  test('400 — missing code', async () => {
    const res = await request(app)
      .post('/mentor')
      .send({ ticketId: 'LF-001' })
      .expect(400);

    expect(res.body.error).toMatch(/ticketId and code are required/i);
  });

  test('200 — returns 2-sentence hint (fallback when no API key configured)', async () => {
    const res = await request(app)
      .post('/mentor')
      .send({
        ticketId: 'LF-001',
        code: 'function registerUser(name, password) { return { name, password }; }',
        errors: ['[SEC-01] Plain-text password detected: never store raw passwords.'],
      })
      .expect(200);

    expect(res.body).toHaveProperty('hint');
    expect(typeof res.body.hint).toBe('string');
    expect(res.body.hint.length).toBeGreaterThan(10);
    // Per SRS: must not exceed 400 chars (prevents full solution leakage)
    expect(res.body.hint.length).toBeLessThanOrEqual(400);
  });
});
