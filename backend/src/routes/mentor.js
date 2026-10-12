// routes/mentor.js — AI Senior Dev mentor powered by Google Gemini
// Called when the CI/CD pipeline fails. Returns a 2-sentence hint only —
// never gives the full solution (per SRS requirement).

require('dotenv').config();
const express = require('express');
const router  = express.Router();

// Gemini SDK (installed in package.json)
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Friendly fallback shown when Gemini is unavailable
const FALLBACK_HINT =
  "Re-read the acceptance criteria carefully — the answer is closer than you think. " +
  "Focus on what the failing test error message is actually telling you.";

// ── POST /mentor ─────────────────────────────────────────────
// Body: { ticketId, code, errors: string[] }
// Returns: { hint: string }
router.post('/', async (req, res) => {
  const { ticketId, code, errors } = req.body;

  if (!ticketId || !code) {
    return res.status(400).json({ error: 'ticketId and code are required' });
  }

  // If no API key is configured, return the fallback immediately
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return res.json({ hint: FALLBACK_HINT });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // gemini-1.5-flash is free-tier and very fast
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build the errors summary string
    const errorSummary = Array.isArray(errors) && errors.length > 0
      ? errors.join('\n')
      : 'The pipeline returned a generic failure.';

    // ── The prompt ───────────────────────────────────────────
    // Strict instructions: 2-sentence hint, NO direct solution.
    const prompt = `
You are a strict Senior Tech Lead doing a code review. A junior developer submitted
code for ticket "${ticketId}" and the automated CI/CD pipeline FAILED.

FAILING CODE:
\`\`\`javascript
${code.slice(0, 1500)}
\`\`\`

PIPELINE ERRORS:
${errorSummary}

Your task: Give exactly 2 short, direct sentences.
- Sentence 1: Name the specific BIS IS 17041 security principle or software engineering concept that was violated.
- Sentence 2: Give a structural hint pointing to WHAT to fix (not HOW) — do not write any code.
Do NOT provide the solution. Do NOT write code. Do NOT use bullet points. Just 2 plain sentences.
`.trim();

    // Set a 4-second timeout to stay within the SRS 5-second requirement
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const result = await model.generateContent(prompt);
    clearTimeout(timeout);

    const hint = result.response.text().trim();

    // Sanity-check: if the hint is suspiciously long (> 400 chars) it may
    // contain a full solution — truncate and warn.
    const safeHint = hint.length > 400
      ? hint.slice(0, 400) + '…'
      : hint;

    return res.json({ hint: safeHint });

  } catch (err) {
    // Network error, rate limit, timeout, etc. — use the friendly fallback
    console.error('Gemini error:', err.message);
    return res.json({ hint: FALLBACK_HINT });
  }
});

module.exports = router;
