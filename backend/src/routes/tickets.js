const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateNextTicketId } = require('../utils/ticketId');

// Email regex helper
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @route GET /api/tickets
 * @desc List all tickets with search, filtering, and pagination
 */
router.get('/', (req, res) => {
  try {
    const { status, search, priority, page = 1, limit = 10 } = req.query;

    const conditions = [];
    const params = [];

    // Filter by Status
    if (status && status !== 'All') {
      conditions.push('status = ?');
      params.push(status);
    }

    // Filter by Priority
    if (priority && priority !== 'All') {
      conditions.push('priority = ?');
      params.push(priority);
    }

    // Search query
    if (search && search.trim() !== '') {
      const trimmedSearch = search.trim();
      conditions.push('(customer_name LIKE ? OR customer_email LIKE ? OR ticket_id LIKE ? OR subject LIKE ? OR description LIKE ? OR tags LIKE ?)');
      const wildcard = `%${trimmedSearch}%`;
      params.push(wildcard, wildcard, wildcard, wildcard, wildcard, wildcard);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const offset = (pageNum - 1) * limitNum;

    // Get matching count
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM tickets ${whereClause}`);
    const total = countStmt.get(...params).count;

    // Fetch matching tickets
    const ticketsStmt = db.prepare(`
      SELECT id, ticket_id, customer_name, customer_email, subject, description, status, priority, assignee, tags, created_at, updated_at
      FROM tickets
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    const tickets = ticketsStmt.all(...params, limitNum, offset);

    // Get overall counts summary for stats cards
    const summaryStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed
      FROM tickets
    `);
    const counts = summaryStmt.get();
    const summary = {
      total: counts.total || 0,
      open: counts.open || 0,
      in_progress: counts.in_progress || 0,
      closed: counts.closed || 0
    };

    res.json({
      tickets,
      total,
      summary,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve tickets' });
  }
});

/**
 * @route POST /api/tickets
 * @desc Create a new ticket
 */
router.post('/', (req, res) => {
  try {
    const { customer_name, customer_email, subject, description, priority = 'Medium', assignee, tags } = req.body;

    // Client/Server Validation
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Customer name is required' });
    }
    if (customer_name.trim().length < 2) {
      return res.status(400).json({ error: 'Validation Error', message: 'Customer name must be at least 2 characters' });
    }
    if (!customer_email || !customer_email.trim() || !emailRegex.test(customer_email.trim())) {
      return res.status(400).json({ error: 'Validation Error', message: 'Please enter a valid email address' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Subject is required' });
    }
    if (subject.trim().length < 5) {
      return res.status(400).json({ error: 'Validation Error', message: 'Subject must be at least 5 characters' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Description is required' });
    }
    if (description.trim().length < 10) {
      return res.status(400).json({ error: 'Validation Error', message: 'Description must be at least 10 characters' });
    }
    if (priority && !['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ error: 'Validation Error', message: 'Priority must be Low, Medium, or High' });
    }

    const transaction = db.transaction(() => {
      const ticket_id = generateNextTicketId(db);
      const insertStmt = db.prepare(`
        INSERT INTO tickets (ticket_id, customer_name, customer_email, subject, description, status, priority, assignee, tags)
        VALUES (?, ?, ?, ?, ?, 'Open', ?, ?, ?)
      `);
      insertStmt.run(
        ticket_id,
        customer_name.trim(),
        customer_email.trim().toLowerCase(),
        subject.trim(),
        description.trim(),
        priority,
        assignee && assignee.trim() ? assignee.trim() : null,
        tags && tags.trim() ? tags.trim().toLowerCase() : null
      );
      
      const details = db.prepare('SELECT created_at FROM tickets WHERE ticket_id = ?').get(ticket_id);
      return { ticket_id, created_at: details.created_at };
    });

    const result = transaction();
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to create ticket' });
  }
});

/**
 * @route GET /api/tickets/:ticket_id
 * @desc Get details of a single ticket with notes
 */
router.get('/:ticket_id', (req, res) => {
  try {
    const { ticket_id } = req.params;
    
    const ticket = db.prepare('SELECT * FROM tickets WHERE ticket_id = ?').get(ticket_id);
    if (!ticket) {
      return res.status(404).json({ error: 'Not Found', message: `Ticket ${ticket_id} not found` });
    }

    const notes = db.prepare('SELECT note_text, created_at FROM notes WHERE ticket_id = ? ORDER BY created_at ASC').all(ticket_id);

    res.json({
      ...ticket,
      notes
    });
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch ticket details' });
  }
});

/**
 * @route PUT /api/tickets/:ticket_id
 * @desc Update status, priority, assignee, and/or add notes
 */
router.put('/:ticket_id', (req, res) => {
  try {
    const { ticket_id } = req.params;
    const { status, priority, assignee, note_text, tags } = req.body;

    const transaction = db.transaction(() => {
      const ticket = db.prepare('SELECT 1 FROM tickets WHERE ticket_id = ?').get(ticket_id);
      if (!ticket) return null;

      // Append note if provided
      if (note_text && note_text.trim() !== '') {
        const insertNote = db.prepare('INSERT INTO notes (ticket_id, note_text) VALUES (?, ?)');
        insertNote.run(ticket_id, note_text.trim());
      }

      // Fields to update
      const fields = [];
      const values = [];

      if (status) {
        if (!['Open', 'In Progress', 'Closed'].includes(status)) {
          throw new Error('Invalid status value');
        }
        fields.push('status = ?');
        values.push(status);
      }

      if (priority) {
        if (!['Low', 'Medium', 'High'].includes(priority)) {
          throw new Error('Invalid priority value');
        }
        fields.push('priority = ?');
        values.push(priority);
      }

      if (assignee !== undefined) {
        fields.push('assignee = ?');
        values.push(assignee && assignee.trim() !== '' ? assignee.trim() : null);
      }

      if (tags !== undefined) {
        fields.push('tags = ?');
        values.push(tags && tags.trim() !== '' ? tags.trim().toLowerCase() : null);
      }

      if (fields.length > 0) {
        fields.push("updated_at = CURRENT_TIMESTAMP");
        const updateStmt = db.prepare(`UPDATE tickets SET ${fields.join(', ')} WHERE ticket_id = ?`);
        updateStmt.run(...values, ticket_id);
      }

      const updateInfo = db.prepare('SELECT updated_at FROM tickets WHERE ticket_id = ?').get(ticket_id);
      return { success: true, updated_at: updateInfo.updated_at };
    });

    const result = transaction();
    if (!result) {
      return res.status(404).json({ error: 'Not Found', message: `Ticket ${ticket_id} not found` });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating ticket:', error);
    if (error.message === 'Invalid status value' || error.message === 'Invalid priority value') {
      return res.status(400).json({ error: 'Validation Error', message: error.message });
    }
    res.status(500).json({ error: 'Server Error', message: 'Failed to update ticket' });
  }
});

module.exports = router;
