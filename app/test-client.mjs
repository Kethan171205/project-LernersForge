// app/test-client.mjs — Mobile client end-to-end integration test
// Tests all functions in app/api/client.js against the running backend server.
import * as client from './api/client.js';

let passes = 0;
let fails = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passes++;
  } else {
    console.error(`  ❌ ${message}`);
    fails++;
  }
}

async function run() {
  console.log('\n🚀 Testing Mobile App API Client Integration (app/api/client.js)\n');

  // 1. Health check
  console.log('1. Health Check:');
  try {
    const health = await client.healthCheck();
    assert(health.status === 'ok', `Backend health check ok (status: ${health.status})`);
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // 2. User Login / Registration
  console.log('\n2. User Authentication:');
  let user;
  try {
    const testEmail = `app_e2e_${Date.now()}@test.com`;
    const res = await client.login('Mobile Tester', testEmail);
    user = res.user;
    assert(user && user.id, `User logged in with ID: ${user?.id}`);
    assert(user.email === testEmail, `User email matches: ${user?.email}`);
  } catch (err) {
    assert(false, `Login failed: ${err.message}`);
  }

  // 3. Fetch Tickets
  console.log('\n3. Kanban Board Tickets:');
  try {
    const res = await client.getTickets();
    assert(Array.isArray(res.tickets), 'Returned tickets array');
    assert(res.tickets.length === 5, `Found exactly 5 tickets (got ${res.tickets?.length})`);
    const ids = res.tickets.map(t => t.id);
    assert(ids.includes('LF-001') && ids.includes('LF-005'), 'Contains LF-001 through LF-005');
  } catch (err) {
    assert(false, `getTickets failed: ${err.message}`);
  }

  // 4. Fetch Single Ticket
  console.log('\n4. Single Ticket Details:');
  try {
    const res = await client.getTicket('LF-001');
    assert(res.ticket && res.ticket.id === 'LF-001', 'Retrieved LF-001 ticket');
    assert(typeof res.ticket.starter_code === 'string', 'Ticket includes starter_code');
    assert(typeof res.ticket.description === 'string', 'Ticket includes description');
  } catch (err) {
    assert(false, `getTicket failed: ${err.message}`);
  }

  // 5. Move Ticket Column
  console.log('\n5. Move Ticket Column:');
  try {
    const moved = await client.moveTicket('LF-001', 'inprogress');
    assert(moved.ticket.column_name === 'inprogress', 'Ticket moved to inprogress');
  } catch (err) {
    assert(false, `moveTicket failed: ${err.message}`);
  }

  // 6. Submit Failing Code (Starter code)
  console.log('\n6. Submit Failing Code (CI/CD Pipeline):');
  let failResult;
  try {
    const starterCode = `
      function registerUser(name, password) {
        return { name, password };
      }
      module.exports = { registerUser };
    `;
    failResult = await client.submitCode('LF-001', starterCode, user?.id);
    assert(failResult.status === 'fail', 'Pipeline flagged failing code (status: fail)');
    assert(Array.isArray(failResult.errors) && failResult.errors.length > 0, 'Pipeline returned error feedback');
  } catch (err) {
    assert(false, `submitCode fail test failed: ${err.message}`);
  }

  // 7. Request AI Mentor Hint
  console.log('\n7. AI Senior Dev Mentor Hint:');
  try {
    const hintRes = await client.getMentorHint('LF-001', 'function registerUser(name, password) { return { name, password }; }', failResult?.errors || ['Plain text error']);
    assert(typeof hintRes.hint === 'string' && hintRes.hint.length > 10, 'Received non-empty mentor hint');
    assert(hintRes.hint.length <= 400, 'Hint respects max length limits (< 400 chars)');
    console.log(`     Mentor message: "${hintRes.hint}"`);
  } catch (err) {
    assert(false, `getMentorHint failed: ${err.message}`);
  }

  // 8. Submit Passing Code
  console.log('\n8. Submit Passing Code (CI/CD Pipeline):');
  try {
    const passingCode = `
      function registerUser(name, password) {
        const hash = password.split('').reverse().join('') + '_hashed_' + password.length;
        return { name, password: hash };
      }
      module.exports = { registerUser };
    `;
    const passResult = await client.submitCode('LF-001', passingCode, user?.id);
    assert(passResult.status === 'pass', 'Pipeline verified passing code (status: pass)');
    assert(passResult.errors.length === 0, 'No errors on passing solution');
  } catch (err) {
    assert(false, `submitCode pass test failed: ${err.message}`);
  }

  // 9. Reset Ticket back to todo
  try {
    await client.moveTicket('LF-001', 'todo');
  } catch (_) {}

  // 10. Delete Account (App Store requirement)
  console.log('\n9. Account Deletion:');
  try {
    if (user?.id) {
      const del = await client.deleteAccount(user.id);
      assert(del.message && del.message.includes('deleted'), 'Account deleted successfully');
    }
  } catch (err) {
    assert(false, `deleteAccount failed: ${err.message}`);
  }

  console.log(`\n────────────────────────────────────────`);
  console.log(`Mobile Client API Test Summary: ${passes} passed, ${fails} failed`);
  if (fails > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
