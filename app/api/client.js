import API_BASE_URL from '../config.js';

// Generic request helper
async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    // Surface the server error message if available
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

// ── Users ──────────────────────────────────────────────────────
export const login = (name, email) =>
  request('/users/login', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });

export const deleteAccount = (userId) =>
  request(`/users/${userId}`, { method: 'DELETE' });

// ── Tickets ────────────────────────────────────────────────────
export const getTickets = () => request('/tickets');
export const getTicket  = (id) => request(`/tickets/${id}`);

export const moveTicket = (id, column) =>
  request(`/tickets/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ column }),
  });

// ── Pipeline ───────────────────────────────────────────────────
export const submitCode = (ticketId, code, userId) =>
  request('/submit', {
    method: 'POST',
    body: JSON.stringify({ ticketId, code, userId }),
  });

// ── Mentor ─────────────────────────────────────────────────────
export const getMentorHint = (ticketId, code, errors) =>
  request('/mentor', {
    method: 'POST',
    body: JSON.stringify({ ticketId, code, errors }),
  });

// ── Health ─────────────────────────────────────────────────────
export const healthCheck = () => request('/health');
