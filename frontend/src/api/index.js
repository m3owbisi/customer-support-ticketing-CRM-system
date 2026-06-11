const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Fetch all tickets with filters.
 * @param {object} params - { status, search, priority, page }
 */
export async function getTickets(params) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/tickets?${query}`);
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

/**
 * Fetch a single ticket's full details.
 * @param {string} id - Ticket ID
 */
export async function getTicketDetails(id) {
  const res = await fetch(`${API_URL}/tickets/${id}`);
  if (!res.ok) throw new Error('Failed to fetch ticket details');
  return res.json();
}

/**
 * Create a new ticket.
 * @param {object} ticketData - { customer_name, customer_email, subject, description, priority, assignee }
 */
export async function createTicket(ticketData) {
  const res = await fetch(`${API_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create ticket');
  return data;
}

/**
 * Update an existing ticket status, priority, assignee, or append a note.
 * @param {string} id - Ticket ID
 * @param {object} updateData - { status, priority, assignee, note_text }
 */
export async function updateTicket(id, updateData) {
  const res = await fetch(`${API_URL}/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update ticket');
  return data;
}
