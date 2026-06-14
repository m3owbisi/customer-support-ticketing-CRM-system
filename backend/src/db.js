const { AsyncLocalStorage } = require('node:async_hooks');
const path = require('path');

const transactionStorage = new AsyncLocalStorage();
const isPostgres = !!process.env.DATABASE_URL;

let db;

if (isPostgres) {
  const { Pool } = require('pg');
  
  console.log('Connecting to PostgreSQL database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  db = {
    isPostgres: true,
    async exec(sql) {
      const client = transactionStorage.getStore() || pool;
      return client.query(sql);
    },
    prepare(sql) {
      // Convert SQLite '?' placeholders to PostgreSQL '$1', '$2', etc.
      // But we must preserve single quotes, strings, etc.
      // A simple regex placeholder converter:
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);

      return {
        async get(...params) {
          const client = transactionStorage.getStore() || pool;
          const res = await client.query(pgSql, params);
          return res.rows[0] || null;
        },
        async all(...params) {
          const client = transactionStorage.getStore() || pool;
          const res = await client.query(pgSql, params);
          return res.rows;
        },
        async run(...params) {
          const client = transactionStorage.getStore() || pool;
          const res = await client.query(pgSql, params);
          return { changes: res.rowCount };
        }
      };
    },
    async transaction(fn) {
      return async (...args) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await transactionStorage.run(client, async () => {
            return await fn(...args);
          });
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      };
    }
  };
} else {
  const { DatabaseSync } = require('node:sqlite');
  
  console.log('Connecting to local SQLite database...');
  const dbPath = path.resolve(__dirname, '../database.sqlite');
  const sqliteDb = new DatabaseSync(dbPath);
  
  sqliteDb.exec('PRAGMA foreign_keys = ON');

  db = {
    isPostgres: false,
    async exec(sql) {
      return sqliteDb.exec(sql);
    },
    prepare(sql) {
      const stmt = sqliteDb.prepare(sql);
      return {
        async get(...params) {
          return stmt.get(...params) || null;
        },
        async all(...params) {
          return stmt.all(...params);
        },
        async run(...params) {
          return stmt.run(...params);
        }
      };
    },
    async transaction(fn) {
      return async (...args) => {
        sqliteDb.exec('BEGIN TRANSACTION');
        try {
          const result = await fn(...args);
          sqliteDb.exec('COMMIT');
          return result;
        } catch (error) {
          sqliteDb.exec('ROLLBACK');
          throw error;
        }
      };
    }
  };
}

// Database schema initialization
async function initDb() {
  if (isPostgres) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        ticket_id VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Closed')),
        priority VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
        assignee VARCHAR(255) DEFAULT NULL,
        tags TEXT DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        ticket_id VARCHAR(50) NOT NULL,
        note_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
      );
    `);
  } else {
    await db.exec(`
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
  }

  // Alter existing table to add tags column if it doesn't exist
  try {
    if (isPostgres) {
      await db.exec('ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT NULL');
    } else {
      await db.exec('ALTER TABLE tickets ADD COLUMN tags TEXT DEFAULT NULL');
    }
  } catch (error) {
    // Column already exists or error handled
  }

  // Seed initial data if tables are empty
  const rowCount = await db.prepare('SELECT COUNT(*) as count FROM tickets').get();
  if (rowCount && Number(rowCount.count) === 0) {
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

    const transaction = await db.transaction(async () => {
      for (const t of seedTickets) {
        await insertTicket.run(t.ticket_id, t.customer_name, t.customer_email, t.subject, t.description, t.status, t.priority, t.assignee);
      }
      
      await insertNote.run('TKT-002', 'Investigating billing logs for May. Checked Stripe dashboard.', '2026-06-10T14:30:00Z');
      await insertNote.run('TKT-002', 'Reached out to user to confirm billing currency.', '2026-06-11T09:15:00Z');
      await insertNote.run('TKT-003', 'Marked as feature request and logged to product backlog.', '2026-06-09T10:00:00Z');
    });

    await transaction();
    console.log('Database seeded successfully.');
  }
}

initDb().catch(error => {
  console.error('Database initialization failed:', error);
});

module.exports = db;
