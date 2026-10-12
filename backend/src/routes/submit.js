// routes/submit.js — the CI/CD pipeline
// Accepts user code, runs hidden functional tests + static security scan.
// All execution happens in Node's built-in `vm` sandbox — no eval on device.

const express = require('express');
const router  = express.Router();
const vm      = require('vm');   // built-in, no install needed
const db      = require('../db');

// ── Security scanner ─────────────────────────────────────────
// Each rule has a regex and the BIS standard it enforces.
// If a rule MATCHES the code, it's a violation.
const SECURITY_RULES = [
  {
    id:       'SEC-01',
    standard: 'IS 17041 – Credential Storage',
    pattern:  /password\s*[:=]\s*password\b/i,
    message:  'Plain-text password detected: never store raw passwords.',
  },
  {
    id:       'SEC-02',
    standard: 'IS 17041 – Input Sanitisation',
    // Catches SQL built by string concatenation (quote + variable + quote pattern)
    pattern:  /["'`]\s*\+\s*\w+\s*\+\s*["'`]/,
    message:  'String-concatenated SQL detected: use parameterised queries.',
  },
  {
    id:       'SEC-03',
    standard: 'IS 17041 – Secret Management',
    // Catches hard-coded keys like "sk-abc123..." or "AIza..." or long hex strings
    pattern:  /["'`](sk-[A-Za-z0-9]{8,}|AIza[A-Za-z0-9_\-]{10,}|[A-Za-z0-9]{20,})["'`]/,
    message:  'Hard-coded secret detected: move credentials to environment variables.',
  },
  {
    id:       'SEC-04',
    standard: 'IS 17041 – Code Injection Prevention',
    pattern:  /\beval\s*\(/,
    message:  'eval() is forbidden: it executes arbitrary code and is a security risk.',
  },
];

// Run all security rules against the submitted code.
// Returns an array of violation error strings (empty = clean).
function runSecurityScan(code, ticketId) {
  const violations = [];
  for (const rule of SECURITY_RULES) {
    if (rule.pattern.test(code)) {
      violations.push(`[${rule.id}] ${rule.message}`);
    }
  }
  return violations;
}

// ── Sandboxed code runner ────────────────────────────────────
// Runs the user's code string inside vm.runInNewContext with a timeout.
// Returns the module.exports object the code sets, or throws on error.
function runCodeInSandbox(code, timeoutMs = 2000, extraEnv = {}) {
  // We give the sandbox a minimal CommonJS shim so users can write
  // `module.exports = { ... }` exactly as the starter code shows.
  const sandbox = {
    module:  { exports: {} },
    exports: {},
    require: () => { throw new Error('require() is not available in the sandbox'); },
    // Merge base env with any overrides; LF-005 test controls API_KEY via extraEnv
    process: { env: { ...process.env, ...extraEnv } },
    console: { log: () => {}, error: () => {} },
  };
  sandbox.exports = sandbox.module.exports;

  vm.runInNewContext(code, sandbox, { timeout: timeoutMs });
  return sandbox.module.exports;
}

// ── Hidden test cases ────────────────────────────────────────
// Each key matches a ticket ID. The function receives the exports object
// and throws an Error (with a descriptive message) if a test fails.

const TICKET_TESTS = {

  // LF-001: Hash the plain-text password
  'LF-001': function (exports) {
    if (typeof exports.registerUser !== 'function') {
      throw new Error('registerUser function is not exported.');
    }
    const result = exports.registerUser('Alice', 'secret123');
    if (!result || typeof result !== 'object') {
      throw new Error('registerUser must return an object.');
    }
    // The raw password must NOT appear in the output
    if (result.password === 'secret123') {
      throw new Error('Password is still stored in plain text. Apply a hash before storing.');
    }
    // The stored value must look like a bcrypt hash
    if (typeof result.password !== 'string' || result.password.length < 10) {
      throw new Error('Stored value must be a hashed string (at least 10 chars, not plain text).');
    }
  },


  // LF-002: Fix SQL injection in login query
  'LF-002': function (exports) {
    if (typeof exports.buildLoginQuery !== 'function') {
      throw new Error('buildLoginQuery function is not exported.');
    }
    const { sql, params } = exports.buildLoginQuery('user@test.com', 'mypassword');
    if (typeof sql !== 'string') {
      throw new Error('buildLoginQuery must return { sql: string, params: array }.');
    }
    // The raw values must NOT appear embedded inside the SQL string
    if (sql.includes('user@test.com') || sql.includes('mypassword')) {
      throw new Error('User input is still embedded in the SQL string. Use ? placeholders instead.');
    }
    // params must be an array carrying the actual values
    if (!Array.isArray(params) || params.length < 2) {
      throw new Error('params array must contain at least 2 values (email and password).');
    }
    // SQL should contain a placeholder
    if (!sql.includes('?') && !sql.includes('$1')) {
      throw new Error('SQL query must use ? or $1 placeholders for parameterised queries.');
    }
  },

  // LF-003: Optimise O(n²) to O(n)
  'LF-003': function (exports) {
    if (typeof exports.findDuplicates !== 'function') {
      throw new Error('findDuplicates function is not exported.');
    }
    // Correctness test 1
    const r1 = exports.findDuplicates([1, 2, 3, 2, 4, 3]);
    if (!Array.isArray(r1)) throw new Error('findDuplicates must return an array.');
    if (!r1.includes(2) || !r1.includes(3)) {
      throw new Error(`Expected [2, 3] to be in result, got [${r1}].`);
    }
    // Correctness test 2 — no duplicates
    const r2 = exports.findDuplicates([1, 2, 3]);
    if (r2.length !== 0) {
      throw new Error(`Expected [] for no duplicates, got [${r2}].`);
    }
    // Correctness test 3 — all same
    const r3 = exports.findDuplicates([5, 5, 5]);
    if (!r3.includes(5) || r3.length !== 1) {
      throw new Error(`Expected [5] for [5,5,5], got [${r3}].`);
    }
    // O(n²) detection: if the code still has nested for-loops it likely hasn't been refactored.
    // We check by looking for two or more 'for' loops inside each other in the source.
    // Simple heuristic: count opening braces after each 'for' keyword.
    const strippedCode = exports.findDuplicates.toString();
    const nestedLoopPattern = /for\s*\([^)]*\)\s*\{[^}]*for\s*\(/s;
    if (nestedLoopPattern.test(strippedCode)) {
      throw new Error('Still using nested loops (O(n²)). Refactor to O(n) using a Set or Map.');
    }
  },

  // LF-004: Validate and sanitise user input
  'LF-004': function (exports) {
    if (typeof exports.createPost !== 'function') {
      throw new Error('createPost function is not exported.');
    }
    // Test: valid input
    const r1 = exports.createPost('  Hello World  ', 10);
    if (!r1 || r1.title !== 'Hello World') {
      throw new Error(`Title should be trimmed. Expected "Hello World", got "${r1?.title}".`);
    }
    if (r1.wordCount !== 10) {
      throw new Error(`wordCount should be 10, got ${r1?.wordCount}.`);
    }
    // Test: empty title
    let threw = false;
    try { exports.createPost('', 5); } catch (e) {
      threw = true;
      if (!e.message.toLowerCase().includes('title')) {
        throw new Error(`Empty title error message should mention "title". Got: "${e.message}"`);
      }
    }
    if (!threw) throw new Error('createPost should throw for an empty title.');

    // Test: whitespace-only title
    threw = false;
    try { exports.createPost('   ', 5); } catch (e) { threw = true; }
    if (!threw) throw new Error('createPost should throw for a whitespace-only title.');

    // Test: zero wordCount
    threw = false;
    try { exports.createPost('Hello', 0); } catch (e) {
      threw = true;
      if (!e.message.toLowerCase().includes('wordcount') && !e.message.toLowerCase().includes('positive')) {
        throw new Error(`Zero wordCount error should mention "wordCount" or "positive". Got: "${e.message}"`);
      }
    }
    if (!threw) throw new Error('createPost should throw for wordCount = 0.');

    // Test: negative wordCount
    threw = false;
    try { exports.createPost('Hello', -5); } catch (e) { threw = true; }
    if (!threw) throw new Error('createPost should throw for a negative wordCount.');
  },

  // LF-005: Remove hard-coded API key
  // Note: we run the code TWICE in isolated sandboxes to test both scenarios.
  'LF-005': function (exports, code) {
    // Test 1: no API_KEY in env → should throw
    const exportsNoKey = runCodeInSandbox(code, 2000, { API_KEY: undefined });
    if (typeof exportsNoKey.getApiKey !== 'function') {
      throw new Error('getApiKey function is not exported.');
    }
    // Remove API_KEY from sandbox env by running with empty-string override trick
    // We set it to empty string and check the code guards against that too
    const sandboxNoKey = (() => {
      const s = { module: { exports: {} }, exports: {}, require: () => {}, process: { env: {} }, console: { log: () => {} } };
      s.exports = s.module.exports;
      vm.runInNewContext(code, s, { timeout: 2000 });
      return s.module.exports;
    })();
    let threw = false;
    try { sandboxNoKey.getApiKey(); } catch (e) {
      threw = true;
      if (!e.message.toLowerCase().includes('api_key') && !e.message.toLowerCase().includes('not set') && !e.message.toLowerCase().includes('environment')) {
        throw new Error(`Error message should mention API_KEY or "not set". Got: "${e.message}"`);
      }
    }
    if (!threw) throw new Error('getApiKey() must throw when API_KEY env var is missing.');

    // Test 2: with API_KEY set → should return it
    const sandboxWithKey = (() => {
      const s = { module: { exports: {} }, exports: {}, require: () => {}, process: { env: { API_KEY: 'test-key-abc123' } }, console: { log: () => {} } };
      s.exports = s.module.exports;
      vm.runInNewContext(code, s, { timeout: 2000 });
      return s.module.exports;
    })();
    const key = sandboxWithKey.getApiKey();
    if (key !== 'test-key-abc123') {
      throw new Error(`getApiKey() should return process.env.API_KEY. Got: "${key}"`);
    }
  },
};

// ── POST /submit ─────────────────────────────────────────────
// Body: { ticketId, code, userId }
// Returns: { status: "pass"|"fail", errors: [], standard: "..." }
router.post('/', (req, res) => {
  const { ticketId, code, userId } = req.body;

  if (!ticketId || !code) {
    return res.status(400).json({ error: 'ticketId and code are required' });
  }

  const ticket = db.getTicketById(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const errors = [];
  let status = 'pass';

  // ── Step 1: Static security scan ─────────────────────────
  // Skip the security scan for the ticket that teaches SQL injection
  // (its starter code would trip the SQL rule)
  const skipSecurityScan = ['LF-002']; // SQL ticket — we test it functionally instead
  if (!skipSecurityScan.includes(ticketId)) {
    const secViolations = runSecurityScan(code, ticketId);
    errors.push(...secViolations);
  }

  // ── Step 2: Functional tests ──────────────────────────────
  const testFn = TICKET_TESTS[ticketId];
  if (testFn) {
    try {
      const exports = runCodeInSandbox(code, 2000);
      testFn(exports, code);   // pass code so tests can create their own sandboxes
    } catch (err) {
      // Functional test failure
      errors.push(`[TEST] ${err.message}`);
    }

  } else {
    // No test defined for this ticket — pass automatically
    errors.push('[INFO] No automated tests defined for this ticket yet.');
  }

  // ── Step 3: Determine overall status ─────────────────────
  // Any error = fail. Security violations always fail.
  const securityErrors = errors.filter((e) => e.startsWith('[SEC'));
  const testErrors     = errors.filter((e) => e.startsWith('[TEST'));

  if (securityErrors.length > 0 || testErrors.length > 0) {
    status = 'fail';
  }

  // ── Step 4: Record submission + move ticket ───────────────
  if (userId) {
    db.createSubmission(userId, ticketId, code, status, errors);
  }

  const column = status === 'pass' ? 'done' : 'review';
  db.moveTicket(ticketId, column);

  // ── Step 5: Respond ───────────────────────────────────────
  return res.json({
    status,
    errors,
    standard: ticket.standard,
    ticketId,
  });
});

module.exports = router;
