// index.js — Express app entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const usersRouter   = require('./routes/users');
const ticketsRouter = require('./routes/tickets');
const submitRouter  = require('./routes/submit');
const mentorRouter  = require('./routes/mentor');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());               // allow requests from the Expo app
app.use(express.json());       // parse JSON bodies

// ── Routes ───────────────────────────────────────────────────
app.use('/users',   usersRouter);
app.use('/tickets', ticketsRouter);
app.use('/submit',  submitRouter);
app.use('/mentor',  mentorRouter);

// Health check — Render uses this to verify the server is up
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', phase: 1 });
});

// ── Start ────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Learner's Forge backend running on port ${PORT}`);
  });
}

module.exports = app;
