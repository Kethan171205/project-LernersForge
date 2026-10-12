// tests/integration/users.test.js — integration tests for /users routes
const path     = require('path');
const os       = require('os');
const request  = require('supertest');
const fs       = require('fs');

// Isolated DB for this test file
const TEST_DB = path.join(os.tmpdir(), `lf_users_${Date.now()}.json`);
process.env.DB_PATH = TEST_DB;

const app = require('../../src/index');   // Express app

afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

// ─────────────────────────────────────────────────────────────
describe('POST /users/login', () => {
  test('201 — creates a new user and returns it', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ name: 'Alice', email: 'alice@test.com' })
      .expect(201);

    expect(res.body.user).toMatchObject({ name: 'Alice', email: 'alice@test.com' });
    expect(res.body.user.id).toBe(1);
    expect(res.body.user.created_at).toBeDefined();
  });

  test('200 — returns existing user on second login (same email)', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ name: 'Alice Again', email: 'alice@test.com' })
      .expect(200);

    // Same user id, original name preserved
    expect(res.body.user.id).toBe(1);
    expect(res.body.user.name).toBe('Alice');
  });

  test('400 — missing name returns error', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: 'nobody@test.com' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  test('400 — missing email returns error', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ name: 'Bob' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  test('400 — empty body returns error', async () => {
    await request(app)
      .post('/users/login')
      .send({})
      .expect(400);
  });

  test('400 — invalid email format returns error', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ name: 'Bad', email: 'not-an-email' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────
describe('DELETE /users/:id', () => {
  let userId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ name: 'DeleteMe', email: 'delete@test.com' });
    userId = res.body.user.id;
  });

  test('200 — deletes an existing user', async () => {
    const res = await request(app)
      .delete(`/users/${userId}`)
      .expect(200);

    expect(res.body.message).toMatch(/deleted/i);
  });

  test('404 — deleting non-existent user returns 404', async () => {
    await request(app)
      .delete('/users/9999')
      .expect(404);
  });
});
