// test-phase4.js — Phase 4 end-to-end test: submit → fail → mentor hint
const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      { hostname: 'localhost', port: 3001, path, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => { let r = ''; res.on('data', c => r += c); res.on('end', () => resolve(JSON.parse(r))); }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔄 Phase 4 End-to-End Test\n');

  // Step 1: Submit bad code → expect fail
  const starterCode = `
function registerUser(name, password) {
  return { name, password };
}
module.exports = { registerUser };`;

  const submitResult = await post('/submit', { ticketId: 'LF-001', code: starterCode, userId: null });
  console.log('1. Pipeline result:', submitResult.status, '| Errors:', submitResult.errors?.length);
  console.assert(submitResult.status === 'fail', 'Expected fail');

  // Step 2: Call mentor with the failed code + errors
  const t0 = Date.now();
  const mentorResult = await post('/mentor', {
    ticketId: 'LF-001',
    code: starterCode,
    errors: submitResult.errors,
  });
  const ms = Date.now() - t0;

  console.log(`2. Mentor response (${ms}ms):`);
  console.log('   "' + mentorResult.hint + '"');
  console.assert(mentorResult.hint && mentorResult.hint.length > 10, 'Hint should not be empty');
  console.assert(ms < 5000, 'Mentor must respond in under 5 seconds');

  // Step 3: Verify hint is not the full solution (no code blocks)
  const hasCode = mentorResult.hint.includes('function ') || mentorResult.hint.includes('bcrypt.hash');
  console.log('3. Hint contains code?', hasCode ? '⚠ Yes (check prompt)' : '✅ No');

  console.log('\n✅ Phase 4 test complete');
}

main().catch(err => { console.error(err); process.exit(1); });
