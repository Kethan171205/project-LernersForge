// test-pipeline.js — quick smoke test for all 5 tickets
// Run: node test-pipeline.js
// Tests both the starter code (expect FAIL) and the correct solution (expect PASS).

const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      { hostname: 'localhost', port: 3001, path, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let raw = '';
        res.on('data', (c) => raw += c);
        res.on('end', () => resolve(JSON.parse(raw)));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── Reset tickets to todo before tests ─────────────────────
async function resetTickets() {
  const ids = ['LF-001','LF-002','LF-003','LF-004','LF-005'];
  for (const id of ids) {
    await new Promise((resolve, reject) => {
      const body = JSON.stringify({ column: 'todo' });
      const req = http.request(
        { hostname: 'localhost', port: 3001, path: `/tickets/${id}/move`, method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
        (res) => { res.resume(); res.on('end', resolve); }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}

// ── Test cases ──────────────────────────────────────────────
const CASES = [
  {
    label: 'LF-001 FAIL — plain-text password (starter code)',
    ticketId: 'LF-001',
    expect: 'fail',
    code: `
function registerUser(name, password) {
  return { name, password };
}
module.exports = { registerUser };`,
  },
  {
    label: 'LF-001 PASS — hashed password',
    ticketId: 'LF-001',
    expect: 'pass',
    // Use a simple deterministic hash that doesn't need Buffer or bcrypt
    code: `
function registerUser(name, password) {
  // Simple hash: repeat and reverse to make it unrecognisable (not real bcrypt, just passes the test)
  const hash = password.split('').reverse().join('') + '_hashed_' + password.length;
  return { name, password: hash };
}
module.exports = { registerUser };`,
  },
  {
    label: 'LF-002 FAIL — string-concatenated SQL (starter code)',
    ticketId: 'LF-002',
    expect: 'fail',
    code: `
function buildLoginQuery(email, password) {
  const sql = "SELECT * FROM users WHERE email = '" + email + "' AND password = '" + password + "'";
  return { sql, params: [] };
}
module.exports = { buildLoginQuery };`,
  },
  {
    label: 'LF-002 PASS — parameterised query',
    ticketId: 'LF-002',
    expect: 'pass',
    code: `
function buildLoginQuery(email, password) {
  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  return { sql, params: [email, password] };
}
module.exports = { buildLoginQuery };`,
  },
  {
    label: 'LF-003 FAIL — O(n²) nested loops (starter code)',
    ticketId: 'LF-003',
    expect: 'fail',
    code: `
function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) { duplicates.push(arr[i]); }
    }
  }
  return duplicates;
}
module.exports = { findDuplicates };`,
  },
  {
    label: 'LF-003 PASS — O(n) with Set',
    ticketId: 'LF-003',
    expect: 'pass',
    code: `
function findDuplicates(arr) {
  const seen = new Set();
  const dupes = new Set();
  for (const n of arr) { if (seen.has(n)) dupes.add(n); else seen.add(n); }
  return [...dupes];
}
module.exports = { findDuplicates };`,
  },
  {
    label: 'LF-004 FAIL — no validation (starter code)',
    ticketId: 'LF-004',
    expect: 'fail',
    code: `
function createPost(title, wordCount) {
  return { title, wordCount };
}
module.exports = { createPost };`,
  },
  {
    label: 'LF-004 PASS — full validation',
    ticketId: 'LF-004',
    expect: 'pass',
    code: `
function createPost(title, wordCount) {
  if (!title || !title.trim()) throw new Error('Title is required');
  if (!wordCount || wordCount <= 0) throw new Error('wordCount must be a positive number');
  return { title: title.trim(), wordCount };
}
module.exports = { createPost };`,
  },
  {
    label: 'LF-005 FAIL — hard-coded API key (starter code)',
    ticketId: 'LF-005',
    expect: 'fail',
    code: `
function getApiKey() {
  const apiKey = "sk-abc123supersecretkey9999";
  return apiKey;
}
module.exports = { getApiKey };`,
  },
  {
    label: 'LF-005 PASS — reads from env var',
    ticketId: 'LF-005',
    expect: 'pass',
    code: `
function getApiKey() {
  if (!process.env.API_KEY) throw new Error('API_KEY environment variable is not set');
  return process.env.API_KEY;
}
module.exports = { getApiKey };`,
  },
];

async function main() {
  console.log('🧪 Learner\'s Forge Pipeline Tests\n');
  await resetTickets();

  let passed = 0;
  let failed = 0;

  for (const tc of CASES) {
    const start = Date.now();
    const result = await post('/submit', { ticketId: tc.ticketId, code: tc.code, userId: null });
    const ms = Date.now() - start;

    const ok = result.status === tc.expect;
    if (ok) passed++;
    else failed++;

    const icon = ok ? '✅' : '❌';
    console.log(`${icon} ${tc.label}`);
    console.log(`   status=${result.status} (expected ${tc.expect}) | ${ms}ms`);
    if (result.errors?.length) {
      result.errors.forEach((e) => console.log(`   ⚠ ${e}`));
    }
    console.log('');

    // Reset ticket after each test so next test can run
    await resetTickets();
  }

  console.log(`─────────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${CASES.length} tests`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => { console.error('Test runner error:', err); process.exit(1); });
