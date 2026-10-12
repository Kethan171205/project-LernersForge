// routes/tickets.js — CRUD for Kanban tickets
const express = require('express');
const router  = express.Router();
const db      = require('../db');

const VALID_COLUMNS = ['todo', 'inprogress', 'review', 'done'];

// GET /tickets — return all tickets (for Kanban board)
router.get('/', (req, res) => {
  const tickets = db.getAllTickets();
  return res.json({ tickets });
});

// GET /tickets/:id — return a single ticket (for Ticket screen)
router.get('/:id', (req, res) => {
  const ticket = db.getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  return res.json({ ticket });
});

// PATCH /tickets/:id/move — move a ticket to a different column
// Body: { column: "todo" | "inprogress" | "review" | "done" }
router.patch('/:id/move', (req, res) => {
  const { column } = req.body;

  if (!VALID_COLUMNS.includes(column)) {
    return res.status(400).json({ error: `column must be one of: ${VALID_COLUMNS.join(', ')}` });
  }

  const ticket = db.moveTicket(req.params.id, column);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  return res.json({ ticket });
});

module.exports = router;
