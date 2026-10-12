// routes/users.js — login (create or find user by email) + delete account
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// POST /users/login
// Body: { name, email }
router.post('/login', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }

  // Find existing user or create a new one
  let user = db.getUserByEmail(trimmedEmail);
  if (user) {
    return res.status(200).json({ user });
  }

  user = db.createUser(trimmedName, trimmedEmail);
  return res.status(201).json({ user });
});

// DELETE /users/:id — Apple App Store requires a "delete account" option
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const deleted = db.deleteUser(id);

  if (!deleted) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ message: 'Account deleted successfully' });
});

module.exports = router;
