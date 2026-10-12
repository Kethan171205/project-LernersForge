// tests/integration/submit.test.js — integration tests for /submit route (CI/CD pipeline)
const path    = require('path');
const os      = require('os');
const request = require('supertest');
const fs      = require('fs');

const TEST_DB = path.join(os.tmpdir(), `lf_submit_${Date.now()}.json`);
process.env.DB_PATH = TEST_DB;

const app = require('../../src/index');
const db  = require('../../src/db');

afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

describe('POST /submit — Validation', () => {
  test('400 — missing ticketId', async () => {
    const res = await request(app)
      .post('/submit')
      .send({ code: 'const x = 1;' })
      .expect(400);
    expect(res.body.error).toMatch(/ticketId and code are required/i);
  });

  test('400 — missing code', async () => {
    const res = await request(app)
      .post('/submit')
      .send({ ticketId: 'LF-001' })
      .expect(400);
    expect(res.body.error).toMatch(/ticketId and code are required/i);
  });

  test('404 — non-existent ticketId', async () => {
    const res = await request(app)
      .post('/submit')
      .send({ ticketId: 'LF-999', code: 'const x = 1;' })
      .expect(404);
    expect(res.body.error).toMatch(/Ticket not found/i);
  });
});

describe('POST /submit — Pipeline execution for all 5 tickets', () => {
  let user;

  beforeAll(() => {
    user = db.createUser('Tester', 'tester@learnersforge.internal');
  });

  test('LF-001 FAIL with starter code (plain text password)', async () => {
    const code = `
      function registerUser(name, password) {
        return { name, password };
      }
      module.exports = { registerUser };
    `;
    const res = await request(app)
      .post('/submit')
      .send({ ticketId: 'LF-001', code, userId: user.id })
      .expect(200);

    expect(res.body.status).toBe('fail');
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(db.getTicketById('LF-001').column_name).toBe('review');
  });

  test('LF-001 PASS with hashed password solution', async () => {
    const code = `
      function registerUser(name, password) {
        const hash = password.split('').reverse().join('') + '_hashed_' + password.length;
        return { name, password: hash };
      }
      module.exports = { registerUser };
    `;
    const res = await request(app)
      .post('/submit')
      .send({ ticketId: 'LF-001', code, userId: user.id })
      .expect(200);

    expect(res.body.status).toBe('pass');
    expect(res.body.errors).toEqual([]);
    expect(db.getTicketById('LF-001').column_name).toBe('done');
  });

  test('LF-002 FAIL with string concatenation SQL', async () => {
    const code = `
      function buildLoginQuery(email, password) {
        const sql = "SELECT * FROM users WHERE email = '" + email + "' AND password = '" + password + "'";
        return { sql, params: [] };
      }
      module.exports = { buildLoginQuery };
    `;
    const res = await request(app)
      .post('/submit')
      .send({ ticketId: 'LF-002', code })
      .expect(200);

    expect(res.body.status).toBe('fail');
    expect(res.body.errors.some(e => e.includes('SQL') || e.includes('params') || e.includes('embedded'))).toBe(true);
    expect(db.getTicketById('LF-002').column_name).toBe('review');
  });

  test('LF-002 PASS with parameterised query solution', async () => {
    const code = `
      function buildLoginQuery(email, password) {
        const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
        return { sql, params: [email, password] };
      }
      module.exports = { buildLoginQuery };
    `;
    const res = await request(app)
      .post('/submit')
      .send({ ticketId: 'LF-002', code })
      .expect(200);

    expect(res.body.status).toBe('pass');
    expect(res.body.errors).toEqual([]);
    expect(db.getTicketById('LF-002').column_name).toBe('done');
  });

  test('LF-003 FAIL with starter nested loop O(n²)', async () => {
    const code = `
      function findDuplicates(arr) {
        const d = [];
        for (let i = 0; i < arr.length; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j]) {
              d.push(arr[i]);
            }
          }
        }
        return d;
      }
      module.exports = { findDuplicates };
    `;
    const res = await request(app)
      .post('/submit')
      .send({ ticketId: 'LF-003', code })
      .expect(200);

    expect(res.body.status).toBe('fail');
  });

  test('LF-003 PASS with O(n) Set solution', async () => {
    const code = `
      function findDuplicates(arr) {
        const seen = new Set();
        const duplicates = new Set();
        for (const item of arr) {
          if (seen.has(item)) {
            duplicates.add(item);
          } else {
            seen.add(item);
          }
        }
        return Array.from(duplicates);
      }
      module.exports = { findDuplicates };
    `;
    const res = await request(app)
      .post('/submit')
      .send({ ticketId: 'LF-003', code })
      .expect(200);

    expect(res.body.status).toBe('pass');
    expect(res.body.errors).toEqual([]);
  });

  test('LF-004 PASS with validation and sanitisation', async () => {
    const code = `
      function createPost(title, wordCount) {
        if (!title || typeof title !== 'string' || title.trim() === '') {
          throw new Error('title is required and cannot be empty');
        }
        if (typeof wordCount !== 'number' || wordCount <= 0) {
          throw new Error('wordCount must be a positive number');
        }
        return {
          title: title.trim(),
          wordCount
        };
      }
      module.exports = { createPost };
    `;
    const res = await request(app)
      .post('/submit')
      .send({ ticketId: 'LF-004', code })
      .expect(200);

    expect(res.body.status).toBe('pass');
    expect(res.body.errors).toEqual([]);
  });

  test('LF-005 PASS with process.env access', async () => {
    const code = `
      function getApiKey() {
        const key = process.env.API_KEY;
        if (!key) {
          throw new Error('API_KEY is not configured in process.env');
        }
        return key;
      }
      module.exports = { getApiKey };
    `;
    const res = await request(app)
      .post('/submit')
      .send({ ticketId: 'LF-005', code })
      .expect(200);

    expect(res.body.status).toBe('pass');
    expect(res.body.errors).toEqual([]);
  });
});

describe('POST /submit — Security Scan Violations', () => {
  test('flags eval() usage with SEC-04 violation', async () => {
    const code = `
      function registerUser(name, password) {
        eval("console.log('eval executed')");
        return { name, password: password + '_hashed' };
      }
      module.exports = { registerUser };
    `;
    const res = await request(app)
      .post('/submit')
      .send({ ticketId: 'LF-001', code })
      .expect(200);

    expect(res.body.status).toBe('fail');
    expect(res.body.errors.some(e => e.includes('SEC-04'))).toBe(true);
  });
});
