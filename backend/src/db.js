// db.js — lightweight JSON file database (no native compilation needed)
// Data is stored in learnersforge.json next to this backend folder.
// The API mimics what the routes expect: getUser, createUser, getTickets, etc.

const fs   = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH ||
  path.join(__dirname, '..', 'learnersforge.json');


// ── Helpers ───────────────────────────────────────────────────

// Read the whole store from disk (synchronous — fine for a local dev server)
function read() {
  if (!fs.existsSync(DB_PATH)) return null;
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

// Write the whole store back to disk atomically
function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Auto-increment: find the next integer id in an array of objects
function nextId(arr) {
  if (arr.length === 0) return 1;
  return Math.max(...arr.map((r) => r.id || 0)) + 1;
}

// ── Seed data ────────────────────────────────────────────────

const SEED_TICKETS = [
  {
    id: 'LF-001',
    title: 'Hash the plain-text password',
    priority: 'HIGH',
    standard: 'IS 17041 – Credential Storage',
    column_name: 'todo',
    created_at: new Date().toISOString(),
    description:
      'Our user registration endpoint stores passwords in plain text. ' +
      'A security audit flagged this as a critical vulnerability. ' +
      'Your task: replace the plain-text assignment with a bcrypt hash.\n\n' +
      'Acceptance criteria:\n' +
      '• The returned object must NOT contain the raw password string.\n' +
      '• The stored value must start with "$2" (bcrypt prefix).\n' +
      '• The function must be named `registerUser` and accept (name, password).',
    starter_code:
`// TODO: Hash the password before storing it
// Hint: use the 'bcrypt' npm package (bcrypt.hashSync)

function registerUser(name, password) {
  // ❌ Security issue — never store raw passwords
  const user = {
    name: name,
    password: password,   // <-- fix this line
  };
  return user;
}

module.exports = { registerUser };`,
  },
  {
    id: 'LF-002',
    title: 'Fix SQL injection in login query',
    priority: 'HIGH',
    standard: 'IS 17041 – Input Sanitisation',
    column_name: 'todo',
    created_at: new Date().toISOString(),
    description:
      'The login function builds its SQL query by concatenating user input directly into the string. ' +
      'This lets an attacker log in as anyone with a classic SQL injection payload.\n\n' +
      'Acceptance criteria:\n' +
      '• Use a parameterised query — pass values as the second argument array, not in the string.\n' +
      '• The function must be named `buildLoginQuery(email, password)` and return { sql, params }.',
    starter_code:
`// TODO: Replace string concatenation with a parameterised query

function buildLoginQuery(email, password) {
  // ❌ Vulnerable — attacker can inject SQL through email or password
  const sql = "SELECT * FROM users WHERE email = '" + email +
              "' AND password = '" + password + "'";
  return { sql, params: [] };
}

module.exports = { buildLoginQuery };`,
  },
  {
    id: 'LF-003',
    title: 'Optimise O(n²) function to O(n)',
    priority: 'MEDIUM',
    standard: 'IS 17041 – Algorithm Efficiency',
    column_name: 'todo',
    created_at: new Date().toISOString(),
    description:
      'The `findDuplicates` function uses nested loops, giving it O(n²) time complexity. ' +
      'For large arrays this causes severe performance degradation.\n\n' +
      'Acceptance criteria:\n' +
      '• Refactor to O(n) using a Set or Map.\n' +
      '• The function must be named `findDuplicates(arr)` and return an array of duplicate values.\n' +
      '• Must still return correct results: findDuplicates([1,2,3,2,4,3]) → [2,3].',
    starter_code:
`// TODO: Refactor from O(n²) to O(n) using a Set or Map

function findDuplicates(arr) {
  const duplicates = [];
  // ❌ Nested loop — O(n²) time complexity
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}

module.exports = { findDuplicates };`,
  },
  {
    id: 'LF-004',
    title: 'Validate and sanitise user input',
    priority: 'MEDIUM',
    standard: 'IS 17041 – Data Validation',
    column_name: 'todo',
    created_at: new Date().toISOString(),
    description:
      'The `createPost` function accepts user input without any validation. ' +
      'Empty titles or negative word counts can corrupt the database.\n\n' +
      'Acceptance criteria:\n' +
      '• Reject empty or whitespace-only titles — throw Error("Title is required").\n' +
      '• Reject non-positive wordCount — throw Error("wordCount must be a positive number").\n' +
      '• If valid, return { title: trimmedTitle, wordCount } (title must be trimmed).',
    starter_code:
`// TODO: Add input validation before creating a post

function createPost(title, wordCount) {
  // ❌ No validation — bad data goes straight to the DB
  return {
    title: title,
    wordCount: wordCount,
  };
}

module.exports = { createPost };`,
  },
  {
    id: 'LF-005',
    title: 'Remove hard-coded API key',
    priority: 'HIGH',
    standard: 'IS 17041 – Secret Management',
    column_name: 'todo',
    created_at: new Date().toISOString(),
    description:
      'A developer accidentally committed an API key directly in the source code. ' +
      'This key is now in the git history and must be treated as compromised.\n\n' +
      'Acceptance criteria:\n' +
      '• The function `getApiKey()` must NOT contain any hard-coded string that looks like a key.\n' +
      '• It must read from process.env.API_KEY instead.\n' +
      '• If the env var is missing, throw Error("API_KEY environment variable is not set").',
    starter_code:
`// TODO: Move the API key to an environment variable

function getApiKey() {
  // ❌ Hard-coded secret — never do this in real code!
  const apiKey = "sk-abc123supersecretkey9999";
  return apiKey;
}

module.exports = { getApiKey };`,
  },
];

// ── Initialise store ─────────────────────────────────────────

function init() {
  const existing = read();
  if (existing) {
    // Already seeded — nothing to do
    console.log('✅ Database loaded from learnersforge.json');
    return;
  }

  // First run — create and seed the store
  const store = {
    users:       [],   // { id, name, email, created_at }
    tickets:     SEED_TICKETS,
    submissions: [],   // { id, user_id, ticket_id, code, status, errors, submitted_at }
  };
  write(store);
  console.log('✅ Database created and seeded with 5 tickets.');
}

// ── Public API ───────────────────────────────────────────────
// Each function reads the store, does its work, writes it back,
// and returns the result — just like better-sqlite3's sync API.

const db = {

  // ── Users ───────────────────────────────────────────────────
  getUserByEmail(email) {
    const { users } = read();
    return users.find((u) => u.email === email) || null;
  },

  createUser(name, email) {
    const store = read();
    const user = {
      id: nextId(store.users),
      name,
      email,
      created_at: new Date().toISOString(),
    };
    store.users.push(user);
    write(store);
    return user;
  },

  getUserById(id) {
    const { users } = read();
    return users.find((u) => u.id === id) || null;
  },

  deleteUser(id) {
    const store = read();
    // Remove submissions too
    store.submissions = store.submissions.filter((s) => s.user_id !== id);
    const before = store.users.length;
    store.users = store.users.filter((u) => u.id !== id);
    write(store);
    return store.users.length < before; // true if something was deleted
  },

  // ── Tickets ─────────────────────────────────────────────────
  getAllTickets() {
    return read().tickets;
  },

  getTicketById(id) {
    return read().tickets.find((t) => t.id === id) || null;
  },

  moveTicket(id, column) {
    const store = read();
    const ticket = store.tickets.find((t) => t.id === id);
    if (!ticket) return null;
    ticket.column_name = column;
    write(store);
    return ticket;
  },

  // ── Submissions ─────────────────────────────────────────────
  createSubmission(userId, ticketId, code, status, errors) {
    const store = read();
    const sub = {
      id:           nextId(store.submissions),
      user_id:      userId,
      ticket_id:    ticketId,
      code,
      status,
      errors:       JSON.stringify(errors || []),
      submitted_at: new Date().toISOString(),
    };
    store.submissions.push(sub);
    write(store);
    return sub;
  },
};

// Run init when this module is first required
init();

module.exports = db;
