/**
 * Generates the next sequential ticket ID.
 * E.g., if max ticket ID is TKT-003, returns TKT-004.
 * @param {import('better-sqlite3').Database} db 
 * @returns {string}
 */
async function generateNextTicketId(db) {
  const stmt = db.prepare('SELECT MAX(CAST(SUBSTR(ticket_id, 5) AS INTEGER)) as "maxId" FROM tickets');
  const result = await stmt.get();
  const maxVal = result ? (result.maxId || result.maxid || 0) : 0;
  const nextNumber = Number(maxVal) + 1;
  return `TKT-${String(nextNumber).padStart(3, '0')}`;
}

module.exports = { generateNextTicketId };
