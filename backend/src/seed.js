const db = require('./db');

console.log('Seeding database with 10 sample tickets...');

const countRow = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
if (countRow.count >= 10) {
  console.log('Database already has enough tickets. Skipping seeding.');
  process.exit(0);
}

// Clear first if we want a clean state, or just add up to 10
// Let's add 10 tickets
const sampleTickets = [
  {
    ticket_id: 'TKT-001',
    customer_name: 'John Doe',
    customer_email: 'john.doe@example.com',
    subject: 'Unable to login to dashboard',
    description: 'I keep getting a 403 Forbidden error when trying to access the analytics dashboard. My credentials work on the main site, but not here. Please assist.',
    status: 'Open',
    priority: 'High',
    assignee: 'Alice Smith',
    tags: 'auth, login'
  },
  {
    ticket_id: 'TKT-002',
    customer_name: 'Jane Smith',
    customer_email: 'jane.smith@example.com',
    subject: 'Billing discrepancy for May invoice',
    description: 'My invoice shows a charge of $150 but my subscription is for the $99 plan. I was not notified of any plan changes or overage charges.',
    status: 'In Progress',
    priority: 'Medium',
    assignee: 'Bob Johnson',
    tags: 'billing, stripe'
  },
  {
    ticket_id: 'TKT-003',
    customer_name: 'Robert Davis',
    customer_email: 'robert.d@example.com',
    subject: 'Feature Request: Dark mode toggle',
    description: 'Would love to see a dark mode option for the dashboard UI. Working late at night is straining my eyes. Thanks!',
    status: 'Closed',
    priority: 'Low',
    assignee: 'Alice Smith',
    tags: 'ui, dark-mode'
  },
  {
    ticket_id: 'TKT-004',
    customer_name: 'Sarah Connor',
    customer_email: 's.connor@cyberdyne.com',
    subject: 'API returning 500 error on checkout endpoint',
    description: 'When checking out via the custom API integration, I receive a 500 server error payload. Our production checkout flow is currently blocked.',
    status: 'Open',
    priority: 'High',
    assignee: 'Alice Smith',
    tags: 'api, checkout'
  },
  {
    ticket_id: 'TKT-005',
    customer_name: 'Bruce Wayne',
    customer_email: 'bruce@waynecorp.com',
    subject: 'Request for custom enterprise contract pricing',
    description: 'We are looking to scale our integration to over 10 million requests per month. We need to discuss custom pricing options and SLA contracts.',
    status: 'Open',
    priority: 'Medium',
    assignee: 'Bob Johnson',
    tags: 'enterprise, sales'
  },
  {
    ticket_id: 'TKT-006',
    customer_name: 'Peter Parker',
    customer_email: 'peter.parker@dailybugle.com',
    subject: 'Mobile app crashes on ticket list load',
    description: 'Every time I navigate to the ticket backlog tab on the Android client, the application immediately crashes. I have cleared the cache and reinstalled.',
    status: 'In Progress',
    priority: 'High',
    assignee: 'Alice Smith',
    tags: 'mobile, crash'
  },
  {
    ticket_id: 'TKT-007',
    customer_name: 'Clark Kent',
    customer_email: 'clark.kent@dailyplanet.com',
    subject: 'Updated email address in account profile',
    description: 'I would like to update my primary billing and account email to my new newsroom address. I could not find a way to edit this in the settings panel.',
    status: 'Closed',
    priority: 'Low',
    assignee: 'Bob Johnson',
    tags: 'account, profile'
  },
  {
    ticket_id: 'TKT-008',
    customer_name: 'Tony Stark',
    customer_email: 'tony@starkindustries.com',
    subject: 'Webhooks delay in production environment',
    description: 'Webhooks are arriving 5-10 minutes late. In our staging environment, they arrive instantly. This is causing data synchronization lag in our internal systems.',
    status: 'Open',
    priority: 'High',
    assignee: 'Unassigned',
    tags: 'webhooks, performance'
  },
  {
    ticket_id: 'TKT-009',
    customer_name: 'Selina Kyle',
    customer_email: 'selina@catmail.com',
    subject: 'Password reset email not sending',
    description: 'I clicked the forgot password link multiple times, but I have not received the reset email, not even in my spam folder.',
    status: 'In Progress',
    priority: 'Medium',
    assignee: 'Unassigned',
    tags: 'auth, password-reset'
  },
  {
    ticket_id: 'TKT-010',
    customer_name: 'Diana Prince',
    customer_email: 'diana@themiscira.gov',
    subject: 'Incorrect data format in CSV export',
    description: 'The date field in the exported CSV contains raw timestamps instead of the standardized formatted dates. This breaks our automated ingestion script.',
    status: 'Closed',
    priority: 'Medium',
    assignee: 'Bob Johnson',
    tags: 'export, csv'
  }
];

const insertTicket = db.prepare(`
  INSERT OR IGNORE INTO tickets (ticket_id, customer_name, customer_email, subject, description, status, priority, assignee, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertNote = db.prepare(`
  INSERT INTO notes (ticket_id, note_text, created_at)
  VALUES (?, ?, ?)
`);

const transaction = db.transaction(() => {
  for (const t of sampleTickets) {
    insertTicket.run(t.ticket_id, t.customer_name, t.customer_email, t.subject, t.description, t.status, t.priority, t.assignee, t.tags);
  }
  // Add some default notes
  insertNote.run('TKT-002', 'Investigating billing logs for May. Checked Stripe dashboard.', '2026-06-10T14:30:00Z');
  insertNote.run('TKT-002', 'Reached out to user to confirm billing currency.', '2026-06-11T09:15:00Z');
  insertNote.run('TKT-003', 'Marked as feature request and logged to product backlog.', '2026-06-09T10:00:00Z');
  insertNote.run('TKT-004', 'Confirmed 500 error in server logs. Database connection pool exhaustion suspected.', '2026-06-12T11:00:00Z');
  insertNote.run('TKT-006', 'Recreated crash on Pixel 7 test device. NullPointerException in TicketAdapter.', '2026-06-12T12:00:00Z');
});

try {
  transaction();
  console.log('Database seeded successfully with 10 tickets.');
} catch (error) {
  console.error('Error seeding database:', error);
  process.exit(1);
}
