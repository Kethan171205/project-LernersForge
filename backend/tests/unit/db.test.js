// tests/unit/db.test.js — unit tests for every db.js function
const path = require('path');
const fs   = require('fs');
const os   = require('os');

// ── Isolated test DB ─────────────────────────────────────────
// Each test run gets its own temp file so tests never touch learnersforge.json
const TEST_DB = path.join(os.tmpdir(), `lf_test_db_${Date.now()}.json`);
process.env.DB_PATH = TEST_DB;

// Require AFTER setting env var so db.js picks up the test path
const db = require('../../src/db');

afterAll(() => {
  // Clean up the temp file after all tests in this file finish
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

// ─────────────────────────────────────────────────────────────
describe('DB — initialisation', () => {
  test('creates the JSON file on first require', () => {
    expect(fs.existsSync(TEST_DB)).toBe(true);
  });

  test('seeds exactly 5 tickets on first run', () => {
    const tickets = db.getAllTickets();
    expect(tickets).toHaveLength(5);
  });

  test('ticket IDs are LF-001 through LF-005', () => {
    const ids = db.getAllTickets().map(t => t.id);
    expect(ids).toEqual(['LF-001', 'LF-002', 'LF-003', 'LF-004', 'LF-005']);
  });

  test('all tickets start in the "todo" column', () => {
    const tickets = db.getAllTickets();
    tickets.forEach(t => expect(t.column_name).toBe('todo'));
  });
});

// ─────────────────────────────────────────────────────────────
describe('DB — users', () => {
  test('getUserByEmail returns null for unknown email', () => {
    expect(db.getUserByEmail('nobody@test.com')).toBeNull();
  });

  test('createUser inserts a new user and returns it', () => {
    const user = db.createUser('Alice', 'alice@test.com');
    expect(user).toMatchObject({ name: 'Alice', email: 'alice@test.com' });
    expect(user.id).toBe(1);
    expect(user.created_at).toBeDefined();
  });

  test('getUserByEmail finds the created user', () => {
    const user = db.getUserByEmail('alice@test.com');
    expect(user).not.toBeNull();
    expect(user.name).toBe('Alice');
  });

  test('getUserById returns the correct user', () => {
    const user = db.getUserById(1);
    expect(user).not.toBeNull();
    expect(user.email).toBe('alice@test.com');
  });

  test('getUserById returns null for non-existent id', () => {
    expect(db.getUserById(9999)).toBeNull();
  });

  test('createUser auto-increments ID', () => {
    const user2 = db.createUser('Bob', 'bob@test.com');
    expect(user2.id).toBe(2);
  });

  test('deleteUser removes user and returns true', () => {
    const user = db.createUser('Temp', 'temp@test.com');
    const result = db.deleteUser(user.id);
    expect(result).toBe(true);
    expect(db.getUserById(user.id)).toBeNull();
  });

  test('deleteUser returns false for non-existent id', () => {
    expect(db.deleteUser(9999)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
describe('DB — tickets', () => {
  test('getAllTickets returns array of 5', () => {
    expect(db.getAllTickets()).toHaveLength(5);
  });

  test('getTicketById returns correct ticket', () => {
    const t = db.getTicketById('LF-003');
    expect(t).not.toBeNull();
    expect(t.title).toMatch(/O\(n/);  // title contains O(n...)
    expect(t.priority).toBe('MEDIUM');
  });

  test('getTicketById returns null for unknown id', () => {
    expect(db.getTicketById('LF-999')).toBeNull();
  });

  test('moveTicket changes column and returns updated ticket', () => {
    const t = db.moveTicket('LF-001', 'inprogress');
    expect(t).not.toBeNull();
    expect(t.column_name).toBe('inprogress');
    // Verify it persisted
    expect(db.getTicketById('LF-001').column_name).toBe('inprogress');
  });

  test('moveTicket returns null for unknown id', () => {
    expect(db.moveTicket('LF-999', 'done')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
describe('DB — submissions', () => {
  test('createSubmission stores and returns a submission', () => {
    const sub = db.createSubmission(1, 'LF-001', 'const x = 1;', 'fail', ['[TEST] bad code']);
    expect(sub.id).toBe(1);
    expect(sub.status).toBe('fail');
    expect(sub.ticket_id).toBe('LF-001');
    expect(sub.user_id).toBe(1);
  });

  test('deleteUser also removes their submissions', () => {
    // Create user + submission
    const user = db.createUser('DelTest', 'del@test.com');
    db.createSubmission(user.id, 'LF-002', 'code', 'pass', []);
    // Delete user
    db.deleteUser(user.id);
    // Read raw store — submissions for that user_id should be gone
    const store = JSON.parse(fs.readFileSync(TEST_DB, 'utf8'));
    const remaining = store.submissions.filter(s => s.user_id === user.id);
    expect(remaining).toHaveLength(0);
  });
});
