const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Custom fetch wrapper with timeout support.
 */
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 10000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    throw error;
  }
}

/**
 * Fetch all tickets with filters.
 * @param {object} params - { status, search, priority, page }
 */
export async function getTickets(params) {
  const query = new URLSearchParams(params).toString();
  const res = await fetchWithTimeout(`${API_URL}/tickets?${query}`);
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

/**
 * Fetch a single ticket's full details.
 * @param {string} id - Ticket ID
 */
export async function getTicketDetails(id) {
  const res = await fetchWithTimeout(`${API_URL}/tickets/${id}`);
  if (!res.ok) throw new Error('Failed to fetch ticket details');
  return res.json();
}

/**
 * Create a new ticket.
 * @param {object} ticketData - { customer_name, customer_email, subject, description, priority, assignee }
 */
export async function createTicket(ticketData) {
  const res = await fetchWithTimeout(`${API_URL}/tickets`, {
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
  const res = await fetchWithTimeout(`${API_URL}/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update ticket');
  return data;
}
