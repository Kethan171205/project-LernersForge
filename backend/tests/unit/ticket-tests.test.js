// tests/unit/ticket-tests.test.js — unit tests for all hidden test cases
// Tests both the FAIL (starter code) and PASS (correct solution) paths.

const path = require('path');
const os   = require('os');
const vm   = require('vm');

const TEST_DB = path.join(os.tmpdir(), `lf_tt_${Date.now()}.json`);
process.env.DB_PATH = TEST_DB;

// ── Sandbox runner (same as submit.js) ───────────────────────
function runInSandbox(code, extraEnv = {}) {
  const sandbox = {
    module:  { exports: {} },
    exports: {},
    require: () => { throw new Error('require not available'); },
    process: { env: { ...extraEnv } },
    console: { log: () => {}, error: () => {} },
  };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(code, sandbox, { timeout: 2000 });
  return sandbox.module.exports;
}

// ─────────────────────────────────────────────────────────────
describe('Ticket Tests — LF-001: Hash the plain-text password', () => {
  const passingCode = `
    function registerUser(name, password) {
      const hash = password.split('').reverse().join('') + '_hashed_' + password.length;
      return { name, password: hash };
    }
    module.exports = { registerUser };
  `;
  const failingCode = `
    function registerUser(name, password) {
      return { name, password };
    }
    module.exports = { registerUser };
  `;

  test('PASS — hashed password: result.password is not the raw value', () => {
    const exports = runInSandbox(passingCode);
    const result = exports.registerUser('Alice', 'secret123');
    expect(result.password).not.toBe('secret123');
    expect(result.password.length).toBeGreaterThanOrEqual(10);
  });

  test('FAIL — plain-text: result.password equals the raw input', () => {
    const exports = runInSandbox(failingCode);
    const result = exports.registerUser('Alice', 'secret123');
    expect(result.password).toBe('secret123');
  });

  test('PASS — registerUser is exported', () => {
    const exports = runInSandbox(passingCode);
    expect(typeof exports.registerUser).toBe('function');
  });
});

// ─────────────────────────────────────────────────────────────
describe('Ticket Tests — LF-002: Fix SQL injection', () => {
  const passingCode = `
    function buildLoginQuery(email, password) {
      const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
      return { sql, params: [email, password] };
    }
    module.exports = { buildLoginQuery };
  `;
  const failingCode = `
    function buildLoginQuery(email, password) {
      const sql = "SELECT * FROM users WHERE email = '" + email + "' AND password = '" + password + "'";
      return { sql, params: [] };
    }
    module.exports = { buildLoginQuery };
  `;

  test('PASS — email is NOT embedded in sql string', () => {
    const exports = runInSandbox(passingCode);
    const { sql } = exports.buildLoginQuery('user@test.com', 'pass');
    expect(sql).not.toContain('user@test.com');
  });

  test('PASS — params array contains both values', () => {
    const exports = runInSandbox(passingCode);
    const { params } = exports.buildLoginQuery('user@test.com', 'pass');
    expect(params).toContain('user@test.com');
    expect(params).toContain('pass');
  });

  test('PASS — SQL contains a ? placeholder', () => {
    const exports = runInSandbox(passingCode);
    const { sql } = exports.buildLoginQuery('user@test.com', 'pass');
    expect(sql).toContain('?');
  });

  test('FAIL — email IS embedded in sql string (injection vulnerability)', () => {
    const exports = runInSandbox(failingCode);
    const { sql } = exports.buildLoginQuery('user@test.com', 'pass');
    expect(sql).toContain('user@test.com');
  });

  test('FAIL — params array is empty (no parameterisation)', () => {
    const exports = runInSandbox(failingCode);
    const { params } = exports.buildLoginQuery('user@test.com', 'pass');
    expect(params).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
describe('Ticket Tests — LF-003: Optimise O(n²) to O(n)', () => {
  const passingCode = `
    function findDuplicates(arr) {
      const seen = new Set(); const dupes = new Set();
      for (const n of arr) { if (seen.has(n)) dupes.add(n); else seen.add(n); }
      return [...dupes];
    }
    module.exports = { findDuplicates };
  `;
  const failingCode = `
    function findDuplicates(arr) {
      const duplicates = [];
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          if (arr[i] === arr[j] && !duplicates.includes(arr[i])) { duplicates.push(arr[i]); }
        }
      }
      return duplicates;
    }
    module.exports = { findDuplicates };
  `;

  test('PASS — finds duplicates [1,2,3,2,4,3] → contains 2 and 3', () => {
    const exports = runInSandbox(passingCode);
    const result = exports.findDuplicates([1, 2, 3, 2, 4, 3]);
    expect(result).toContain(2);
    expect(result).toContain(3);
  });

  test('PASS — returns empty array for no duplicates', () => {
    const exports = runInSandbox(passingCode);
    expect(exports.findDuplicates([1, 2, 3])).toHaveLength(0);
  });

  test('PASS — [5,5,5] returns [5] (single entry, not three)', () => {
    const exports = runInSandbox(passingCode);
    const result = exports.findDuplicates([5, 5, 5]);
    expect(result).toEqual([5]);
  });

  test('FAIL (starter) — still has nested loop pattern in source', () => {
    const exports = runInSandbox(failingCode);
    const src = exports.findDuplicates.toString();
    const nestedLoopPattern = /for\s*\([^)]*\)\s*\{[^}]*for\s*\(/s;
    expect(nestedLoopPattern.test(src)).toBe(true);
  });

  test('PASS (optimised) — does NOT have nested loop pattern in source', () => {
    const exports = runInSandbox(passingCode);
    const src = exports.findDuplicates.toString();
    const nestedLoopPattern = /for\s*\([^)]*\)\s*\{[^}]*for\s*\(/s;
    expect(nestedLoopPattern.test(src)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
describe('Ticket Tests — LF-004: Validate and sanitise user input', () => {
  const passingCode = `
    function createPost(title, wordCount) {
      if (!title || !title.trim()) throw new Error('Title is required');
      if (!wordCount || wordCount <= 0) throw new Error('wordCount must be a positive number');
      return { title: title.trim(), wordCount };
    }
    module.exports = { createPost };
  `;
  const failingCode = `
    function createPost(title, wordCount) {
      return { title, wordCount };
    }
    module.exports = { createPost };
  `;

  test('PASS — valid input is trimmed and returned', () => {
    const exports = runInSandbox(passingCode);
    const result = exports.createPost('  Hello World  ', 10);
    expect(result.title).toBe('Hello World');
    expect(result.wordCount).toBe(10);
  });

  test('PASS — empty title throws Error mentioning "title"', () => {
    const exports = runInSandbox(passingCode);
    expect(() => exports.createPost('', 5)).toThrow(/title/i);
  });

  test('PASS — whitespace-only title throws', () => {
    const exports = runInSandbox(passingCode);
    expect(() => exports.createPost('   ', 5)).toThrow();
  });

  test('PASS — zero wordCount throws', () => {
    const exports = runInSandbox(passingCode);
    expect(() => exports.createPost('Title', 0)).toThrow();
  });

  test('PASS — negative wordCount throws', () => {
    const exports = runInSandbox(passingCode);
    expect(() => exports.createPost('Title', -1)).toThrow();
  });

  test('FAIL (starter) — does NOT trim title', () => {
    const exports = runInSandbox(failingCode);
    const result = exports.createPost('  Hello World  ', 10);
    expect(result.title).toBe('  Hello World  ');  // not trimmed
  });

  test('FAIL (starter) — does NOT throw for empty title', () => {
    const exports = runInSandbox(failingCode);
    expect(() => exports.createPost('', 5)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
describe('Ticket Tests — LF-005: Remove hard-coded API key', () => {
  const passingCode = `
    function getApiKey() {
      if (!process.env.API_KEY) throw new Error('API_KEY environment variable is not set');
      return process.env.API_KEY;
    }
    module.exports = { getApiKey };
  `;
  const failingCode = `
    function getApiKey() {
      const apiKey = "sk-abc123supersecretkey9999";
      return apiKey;
    }
    module.exports = { getApiKey };
  `;

  test('PASS — throws when API_KEY not in env', () => {
    const exports = runInSandbox(passingCode, {});   // no API_KEY
    expect(() => exports.getApiKey()).toThrow(/API_KEY|not set/i);
  });

  test('PASS — returns env value when API_KEY is set', () => {
    const exports = runInSandbox(passingCode, { API_KEY: 'my-real-key' });
    expect(exports.getApiKey()).toBe('my-real-key');
  });

  test('FAIL (starter) — returns hard-coded key without reading env', () => {
    const exports = runInSandbox(failingCode, {});   // no env
    expect(exports.getApiKey()).toBe('sk-abc123supersecretkey9999');
  });

  test('FAIL (starter) — does NOT throw when env var is missing', () => {
    const exports = runInSandbox(failingCode, {});
    expect(() => exports.getApiKey()).not.toThrow();
  });
});
