const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

// Transaction wrapper helper for compatibility
db.transaction = function(fn) {
  return function(...args) {
    db.exec('BEGIN TRANSACTION');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };
};

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Closed')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
    assignee TEXT DEFAULT NULL,
    tags TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    note_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
  );
`);

// Alter existing table to add tags column if it doesn't exist
try {
  db.exec('ALTER TABLE tickets ADD COLUMN tags TEXT DEFAULT NULL');
} catch (error) {
  // Column already exists
}

// Insert seed data if tables are empty
const rowCount = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
if (rowCount.count === 0) {
  const insertTicket = db.prepare(`
    INSERT INTO tickets (ticket_id, customer_name, customer_email, subject, description, status, priority, assignee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNote = db.prepare(`
    INSERT INTO notes (ticket_id, note_text, created_at)
    VALUES (?, ?, ?)
  `);

  const seedTickets = [
    {
      ticket_id: 'TKT-001',
      customer_name: 'John Doe',
      customer_email: 'john.doe@example.com',
      subject: 'Unable to login to dashboard',
      description: 'I keep getting a 403 Forbidden error when trying to access the analytics dashboard. My credentials work on the main site, but not here. Please assist.',
      status: 'Open',
      priority: 'High',
      assignee: 'Alice Smith'
    },
    {
      ticket_id: 'TKT-002',
      customer_name: 'Jane Smith',
      customer_email: 'jane.smith@example.com',
      subject: 'Billing discrepancy for May invoice',
      description: 'My invoice shows a charge of $150 but my subscription is for the $99 plan. I was not notified of any plan changes or overage charges.',
      status: 'In Progress',
      priority: 'Medium',
      assignee: 'Bob Johnson'
    },
    {
      ticket_id: 'TKT-003',
      customer_name: 'Robert Davis',
      customer_email: 'robert.d@example.com',
      subject: 'Feature Request: Dark mode toggle',
      description: 'Would love to see a dark mode option for the dashboard UI. Working late at night is straining my eyes. Thanks!',
      status: 'Closed',
      priority: 'Low',
      assignee: 'Alice Smith'
    }
  ];

  const transaction = db.transaction(() => {
    for (const t of seedTickets) {
      insertTicket.run(t.ticket_id, t.customer_name, t.customer_email, t.subject, t.description, t.status, t.priority, t.assignee);
    }
    
    // Add some sample notes
    insertNote.run('TKT-002', 'Investigating billing logs for May. Checked Stripe dashboard.', '2026-06-10T14:30:00Z');
    insertNote.run('TKT-002', 'Reached out to user to confirm billing currency.', '2026-06-11T09:15:00Z');
    insertNote.run('TKT-003', 'Marked as feature request and logged to product backlog.', '2026-06-09T10:00:00Z');
  });

  transaction();
  console.log('Database seeded successfully.');
}

module.exports = db;
