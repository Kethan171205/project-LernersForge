// tests/integration/tickets.test.js — integration tests for /tickets routes
const path    = require('path');
const os      = require('os');
const request = require('supertest');
const fs      = require('fs');

const TEST_DB = path.join(os.tmpdir(), `lf_tickets_${Date.now()}.json`);
process.env.DB_PATH = TEST_DB;

const app = require('../../src/index');

afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

// ─────────────────────────────────────────────────────────────
describe('GET /tickets', () => {
  test('200 — returns all 5 seeded tickets', async () => {
    const res = await request(app).get('/tickets').expect(200);
    expect(res.body.tickets).toHaveLength(5);
  });

  test('tickets have required fields', async () => {
    const res = await request(app).get('/tickets').expect(200);
    const t = res.body.tickets[0];
    expect(t).toHaveProperty('id');
    expect(t).toHaveProperty('title');
    expect(t).toHaveProperty('priority');
    expect(t).toHaveProperty('standard');
    expect(t).toHaveProperty('column_name');
    expect(t).toHaveProperty('description');
    expect(t).toHaveProperty('starter_code');
  });

  test('all tickets start in "todo" column', async () => {
    const res = await request(app).get('/tickets').expect(200);
    res.body.tickets.forEach(t => expect(t.column_name).toBe('todo'));
  });

  test('correct ticket IDs are returned (LF-001 to LF-005)', async () => {
    const res = await request(app).get('/tickets').expect(200);
    const ids = res.body.tickets.map(t => t.id);
    expect(ids).toContain('LF-001');
    expect(ids).toContain('LF-005');
  });
});

// ─────────────────────────────────────────────────────────────
describe('GET /tickets/:id', () => {
  test('200 — returns the correct ticket by ID', async () => {
    const res = await request(app).get('/tickets/LF-003').expect(200);
    expect(res.body.ticket.id).toBe('LF-003');
    expect(res.body.ticket.priority).toBe('MEDIUM');
  });

  test('404 — unknown ticket ID returns 404', async () => {
    const res = await request(app).get('/tickets/LF-999').expect(404);
    expect(res.body.error).toBeDefined();
  });

  test('starter_code is included in the response', async () => {
    const res = await request(app).get('/tickets/LF-001').expect(200);
    expect(res.body.ticket.starter_code).toBeTruthy();
    expect(typeof res.body.ticket.starter_code).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────
describe('PATCH /tickets/:id/move', () => {
  test('200 — moves ticket to "inprogress"', async () => {
    const res = await request(app)
      .patch('/tickets/LF-001/move')
      .send({ column: 'inprogress' })
      .expect(200);

    expect(res.body.ticket.column_name).toBe('inprogress');
  });

  test('200 — moves ticket to "done"', async () => {
    const res = await request(app)
      .patch('/tickets/LF-002/move')
      .send({ column: 'done' })
      .expect(200);

    expect(res.body.ticket.column_name).toBe('done');
  });

  test('200 — moves ticket back to "todo"', async () => {
    const res = await request(app)
      .patch('/tickets/LF-001/move')
      .send({ column: 'todo' })
      .expect(200);

    expect(res.body.ticket.column_name).toBe('todo');
  });

  test('400 — missing column field returns error', async () => {
    const res = await request(app)
      .patch('/tickets/LF-001/move')
      .send({})
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  test('400 — invalid column name returns error', async () => {
    const res = await request(app)
      .patch('/tickets/LF-001/move')
      .send({ column: 'invalid_column' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  test('404 — unknown ticket ID returns 404', async () => {
    const res = await request(app)
      .patch('/tickets/LF-999/move')
      .send({ column: 'done' })
      .expect(404);

    expect(res.body.error).toBeDefined();
  });
});
