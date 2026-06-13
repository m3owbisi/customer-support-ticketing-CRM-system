# Backend Architecture & Database Structure
## Support CRM System — Datastraw Technologies

**Runtime**: Node.js 20 LTS  
**Framework**: Express 4.19.2  
**Database**: SQLite via Node.js Native SQLite (`node:sqlite`)  
**Deployment**: Render.com (free tier)  
**Last Updated**: June 2025

---

## 1. Architecture Overview

### System Pattern

```
React SPA (Vercel)
       │
       │  HTTPS + JSON  (CORS: Vercel origin only)
       ▼
Express REST API (Render.com)
       │
       ├── src/index.js          Entry point, middleware stack, server boot
       ├── src/db.js             SQLite connection + schema initialisation
       ├── src/routes/
       │   ├── tickets.js        All /api/tickets/* handlers
       │   └── health.js         GET /api/health
       ├── src/utils/
       │   └── ticketId.js       Sequential TKT-XXX ID generator
       └── src/middleware/
           ├── errorHandler.js   Global error → structured JSON
           └── notFound.js       Unmatched route → 404 JSON
       │
       │  Synchronous SQL (node:sqlite)
       ▼
SQLite file  (database.sqlite — gitignored, lives on Render disk)
```

### Authentication Strategy
**None in MVP.** The API is open-access. CORS restricts requests to the known Vercel frontend origin. Authentication (JWT, sessions) is a V2 feature — route structure supports prepending middleware without refactoring.

### Data Flow
1. React component calls `api/client.js` (Axios instance)
2. Axios adds `Content-Type: application/json` header
3. Request crosses HTTPS to Render backend
4. Express middleware stack: CORS check → body parse → Morgan log → route handler
5. Route handler validates input, runs parameterised SQLite query via `db.js`
6. Result serialised to JSON, returned with appropriate HTTP status
7. Axios interceptor handles non-2xx; component handles 2xx

### Caching Strategy
**None in MVP.** SQLite reads via `node:sqlite` are synchronous and complete in < 5ms for the dataset sizes expected (< 1,000 tickets). A Redis caching layer is not justified and would require a separate paid service. If the app scales to 10,000+ tickets, add an in-memory LRU cache with `node-lru-cache` before reaching for Redis.

---

## 2. Database Schema

**Database**: SQLite (file: `database.sqlite`)  
**Client**: `node:sqlite` (`DatabaseSync` synchronous API — no async/await needed for queries)  
**Naming**: `snake_case` for all tables and columns  
**Timestamps**: `created_at` and `updated_at` on all tables  
**No UUIDs**: SQLite `AUTOINCREMENT` integer PKs for internal IDs; `ticket_id` (`TKT-XXX`) is the user-facing unique identifier

### Entity Relationship

```
┌──────────────────────────┐         ┌──────────────────────┐
│         tickets          │         │        notes          │
├──────────────────────────┤         ├──────────────────────┤
│ id            INTEGER PK │ ◄───┐   │ id         INTEGER PK│
│ ticket_id     TEXT UNIQUE│     │   │ ticket_id  TEXT  FK  │──► tickets.ticket_id
│ customer_name TEXT       │     └───│ note_text  TEXT      │
│ customer_email TEXT      │         │ created_at DATETIME  │
│ subject       TEXT       │         └──────────────────────┘
│ description   TEXT       │
│ status        TEXT       │    One ticket → zero or many notes
│ created_at    DATETIME   │    Deleting a ticket cascades to its notes
│ updated_at    DATETIME   │
└──────────────────────────┘
```

---

### Table: `tickets`

**Purpose**: Core table — one row per customer support issue

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Internal row ID — never exposed in API responses |
| `ticket_id` | `TEXT` | `UNIQUE NOT NULL` | User-facing ID: `TKT-001`, `TKT-002`, etc. |
| `customer_name` | `TEXT` | `NOT NULL` | Full name of the customer reporting the issue |
| `customer_email` | `TEXT` | `NOT NULL` | Customer email address |
| `subject` | `TEXT` | `NOT NULL` | One-line issue title |
| `description` | `TEXT` | `NOT NULL` | Full issue description |
| `status` | `TEXT` | `NOT NULL DEFAULT 'Open'` | Enum: `Open` \| `In Progress` \| `Closed` |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Auto-set on INSERT; never modified |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Updated on every PUT |

**Indexes**:
- `PRIMARY KEY` on `id` (implicit)
- `UNIQUE` index on `ticket_id` (implicit from constraint)
- `CREATE INDEX idx_tickets_status ON tickets(status)` — speeds up filter-by-status queries
- `CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC)` — speeds up default newest-first sort

**Constraints**:
- `status` values enforced at application layer (route validation), not DB ENUM — SQLite has no ENUM type
- `customer_email` format validated at application layer before insert
- `ticket_id` uniqueness enforced by the DB UNIQUE constraint as a safety net; application logic prevents collisions

**Valid status values** (enforced in route handler):
```javascript
const VALID_STATUSES = ['Open', 'In Progress', 'Closed'];
```

---

### Table: `notes`

**Purpose**: Internal notes added by support agents to a ticket — append-only audit trail

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Internal row ID |
| `ticket_id` | `TEXT` | `NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE` | Foreign key to parent ticket |
| `note_text` | `TEXT` | `NOT NULL` | Free-text note content |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Auto-set on INSERT; notes are immutable |

**Indexes**:
- `PRIMARY KEY` on `id` (implicit)
- `CREATE INDEX idx_notes_ticket_id ON notes(ticket_id)` — speeds up fetching all notes for a ticket

**Rules**:
- Notes are **append-only** — no UPDATE or DELETE on notes in MVP
- `ON DELETE CASCADE` — deleting a ticket removes all its notes automatically
- No `updated_at` — notes cannot be edited

---

### Schema Initialisation (`src/db.js`)

```javascript
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '..', 'database.sqlite');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better concurrent read performance (where supported)
try {
  db.exec('PRAGMA journal_mode = WAL');
} catch (e) {
  // Ignored if WAL is unsupported in dev environment
}

// Enforce foreign key constraints (SQLite disables them by default)
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id      TEXT    UNIQUE NOT NULL,
    customer_name  TEXT    NOT NULL,
    customer_email TEXT    NOT NULL,
    subject        TEXT    NOT NULL,
    description    TEXT    NOT NULL,
    status         TEXT    NOT NULL DEFAULT 'Open',
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id  TEXT    NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    note_text  TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_tickets_status
    ON tickets(status);

  CREATE INDEX IF NOT EXISTS idx_tickets_created_at
    ON tickets(created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_notes_ticket_id
    ON notes(ticket_id);
`);

module.exports = db;
```

---

## 3. API Endpoints

**Base URL (production)**: `https://your-api.onrender.com/api`  
**Base URL (local dev)**: `http://localhost:3001/api`  
**Content-Type**: All requests and responses use `application/json`  
**Authentication**: None required — all endpoints are public  
**Error format**: All errors return `{ "error": "ERROR_CODE", "message": "Human-readable description" }`

---

### `GET /api/health`

**Purpose**: Uptime check — confirms the server and DB connection are alive  
**Authentication**: None  
**Query params**: None  
**Request body**: None

**Response 200**:
```json
{
  "status": "ok",
  "timestamp": "2025-06-01T10:00:00.000Z"
}
```

**Side effects**: None — read-only  
**Caching**: None — must always reflect live server state  
**Notes**: Ping this endpoint from UptimeRobot (free tier) every 5 minutes to prevent Render free-tier spin-down (cold starts take ~30s)

---

### `POST /api/tickets`

**Purpose**: Create a new support ticket  
**Authentication**: None  
**Request body**:

```json
{
  "customer_name":  "Sneha Mehta",
  "customer_email": "sneha@example.com",
  "subject":        "Order #4521 not received",
  "description":    "I placed an order 2 weeks ago and it has not arrived. Tracking shows no updates since June 1."
}
```

**Validation rules** (applied before DB write):

| Field | Rule | Error message |
|-------|------|--------------|
| `customer_name` | Required; string; length 2–255 | `"customer_name is required"` / `"customer_name must be 2–255 characters"` |
| `customer_email` | Required; valid email format | `"customer_email is required"` / `"customer_email must be a valid email address"` |
| `subject` | Required; string; length 5–500 | `"subject is required"` / `"subject must be 5–500 characters"` |
| `description` | Required; string; length 10–5000 | `"description is required"` / `"description must be 10–5000 characters"` |

**Response 201**:
```json
{
  "ticket_id":  "TKT-015",
  "created_at": "2025-06-01T10:00:00.000Z"
}
```

**Error responses**:

| Status | Code | When |
|--------|------|------|
| `400` | `VALIDATION_ERROR` | Any field fails validation |
| `500` | `INTERNAL_ERROR` | DB write fails |

**Side effects**:
- Inserts one row into `tickets` with auto-generated `ticket_id`, `status = 'Open'`, both timestamps set to `NOW()`
- No email sent, no external calls

**Implementation notes**:
- Generate `ticket_id` before INSERT using `ticketId.js` utility
- All four fields must be trimmed (`String.trim()`) before validation and insert
- Return only `ticket_id` and `created_at` — not the full ticket object (keeps response minimal; client redirects to list)

---

### `GET /api/tickets`

**Purpose**: List all tickets, with optional search and status filter  
**Authentication**: None  
**Request body**: None  
**Query parameters**:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | No | Case-insensitive search across 5 fields |
| `status` | string | No | Filter to exact status value: `Open`, `In Progress`, or `Closed` |

**Example requests**:
```
GET /api/tickets
GET /api/tickets?status=Open
GET /api/tickets?search=sneha
GET /api/tickets?search=sneha&status=Open
```

**Response 200**:
```json
{
  "tickets": [
    {
      "ticket_id":      "TKT-015",
      "customer_name":  "Sneha Mehta",
      "subject":        "Order #4521 not received",
      "status":         "Open",
      "created_at":     "2025-06-01T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Note**: List response intentionally omits `customer_email` and `description` — these are fetched on the detail endpoint only, keeping list payloads small.

**SQL query logic**:

```javascript
// src/routes/tickets.js — GET handler
function buildListQuery(search, status) {
  const conditions = [];
  const params = [];

  if (status && ['Open', 'In Progress', 'Closed'].includes(status)) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    conditions.push(`(
      customer_name  LIKE ? OR
      customer_email LIKE ? OR
      ticket_id      LIKE ? OR
      subject        LIKE ? OR
      description    LIKE ?
    )`);
    params.push(term, term, term, term, term);
  }

  const where = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  return {
    sql: `SELECT ticket_id, customer_name, subject, status, created_at
          FROM tickets ${where}
          ORDER BY created_at DESC`,
    params
  };
}
```

**Error responses**:

| Status | Code | When |
|--------|------|------|
| `400` | `VALIDATION_ERROR` | `status` param is not a valid enum value |
| `500` | `INTERNAL_ERROR` | DB read fails |

**Side effects**: None — read-only

---

### `GET /api/tickets/:ticket_id`

**Purpose**: Fetch full detail for a single ticket, including all notes  
**Authentication**: None  
**URL param**: `ticket_id` — e.g. `TKT-015`  
**Request body**: None

**Response 200**:
```json
{
  "ticket_id":      "TKT-015",
  "customer_name":  "Sneha Mehta",
  "customer_email": "sneha@example.com",
  "subject":        "Order #4521 not received",
  "description":    "I placed an order 2 weeks ago...",
  "status":         "Open",
  "created_at":     "2025-06-01T10:00:00.000Z",
  "updated_at":     "2025-06-01T10:00:00.000Z",
  "notes": [
    {
      "id":         1,
      "note_text":  "Contacted shipping carrier. Ref #XYZ-999.",
      "created_at": "2025-06-02T09:15:00.000Z"
    }
  ]
}
```

**Implementation**:
```javascript
// Two queries — one for ticket, one for its notes
const ticket = db
  .prepare('SELECT * FROM tickets WHERE ticket_id = ?')
  .get(ticketId);

if (!ticket) {
  return res.status(404).json({
    error: 'TICKET_NOT_FOUND',
    message: `Ticket ${ticketId} does not exist`
  });
}

const notes = db
  .prepare('SELECT id, note_text, created_at FROM notes WHERE ticket_id = ? ORDER BY created_at ASC')
  .all(ticketId);

// Strip internal `id` from ticket before returning
const { id, ...ticketData } = ticket;
res.json({ ...ticketData, notes });
```

**Error responses**:

| Status | Code | When |
|--------|------|------|
| `404` | `TICKET_NOT_FOUND` | No ticket with this `ticket_id` in DB |
| `500` | `INTERNAL_ERROR` | DB read fails |

**Side effects**: None — read-only

---

### `PUT /api/tickets/:ticket_id`

**Purpose**: Update ticket status and/or add a new note — both operations in one endpoint  
**Authentication**: None  
**URL param**: `ticket_id` — e.g. `TKT-015`  
**Request body** (both fields optional, at least one required):

```json
{
  "status":    "In Progress",
  "note_text": "Contacted shipping carrier. Ref #XYZ-999."
}
```

**Validation rules**:

| Field | Rule | Error message |
|-------|------|--------------|
| Body | At least one of `status` or `note_text` must be present | `"Request body must include status or note_text"` |
| `status` | If present: must be `Open`, `In Progress`, or `Closed` | `"status must be one of: Open, In Progress, Closed"` |
| `note_text` | If present: string; length 1–5000; not blank | `"note_text cannot be empty"` |

**Response 200**:
```json
{
  "success":    true,
  "updated_at": "2025-06-02T09:15:00.000Z"
}
```

**Implementation** (atomic — both operations use a transaction):
```javascript
router.put('/:ticket_id', (req, res) => {
  const { ticket_id } = req.params;
  const { status, note_text } = req.body;

  // 1. Confirm ticket exists
  const ticket = db.prepare('SELECT id FROM tickets WHERE ticket_id = ?').get(ticket_id);
  if (!ticket) return res.status(404).json({ error: 'TICKET_NOT_FOUND', message: `Ticket ${ticket_id} does not exist` });

  // 2. Validate
  if (!status && !note_text) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Request body must include status or note_text' });
  }
  if (status && !['Open', 'In Progress', 'Closed'].includes(status)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'status must be one of: Open, In Progress, Closed' });
  }
  if (note_text !== undefined && String(note_text).trim().length === 0) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'note_text cannot be empty' });
  }

  // 3. Run as a transaction so both writes succeed or both fail
  const now = new Date().toISOString();

  const updateBoth = db.transaction(() => {
    if (status) {
      db.prepare('UPDATE tickets SET status = ?, updated_at = ? WHERE ticket_id = ?')
        .run(status, now, ticket_id);
    }
    if (note_text) {
      db.prepare('INSERT INTO notes (ticket_id, note_text) VALUES (?, ?)')
        .run(ticket_id, String(note_text).trim());
      // Also bump updated_at when a note is added
      if (!status) {
        db.prepare('UPDATE tickets SET updated_at = ? WHERE ticket_id = ?').run(now, ticket_id);
      }
    }
  });

  updateBoth();
  res.json({ success: true, updated_at: now });
});
```

**Error responses**:

| Status | Code | When |
|--------|------|------|
| `400` | `VALIDATION_ERROR` | Body empty, invalid status value, or blank note_text |
| `404` | `TICKET_NOT_FOUND` | No ticket with this `ticket_id` |
| `500` | `INTERNAL_ERROR` | DB write fails |

**Side effects**:
- Updates `tickets.status` if `status` provided
- Updates `tickets.updated_at` in both cases
- Inserts a new row into `notes` if `note_text` provided
- Both writes wrapped in a SQLite transaction — atomic

---

## 4. Middleware Stack

Order matters. Applied top-to-bottom in `src/index.js`:

```javascript
// src/index.js
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const app = express();

// 1. CORS — must be first; rejects disallowed origins before any processing
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type'],
}));

// 2. Body parser — parses application/json request bodies into req.body
app.use(express.json());

// 3. Request logger — logs method, path, status, ms in dev; silent in test
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
}

// 4. Routes
app.use('/api/health',  require('./routes/health'));
app.use('/api/tickets', require('./routes/tickets'));

// 5. 404 handler — catches any request that didn't match a route above
app.use(require('./middleware/notFound'));

// 6. Global error handler — catches any error thrown/passed in routes
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
```

---

## 5. Utility: Ticket ID Generator (`src/utils/ticketId.js`)

```javascript
const db = require('../db');

/**
 * Generates the next sequential ticket ID.
 * Format: TKT-001, TKT-002, ... TKT-999, TKT-1000, ...
 * Reads the current count from DB to determine next ID.
 * NOTE: Not race-condition-safe for concurrent requests.
 * Acceptable for MVP; use a DB sequence or UUID in production.
 */
function generateTicketId() {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
  const next = count + 1;
  return `TKT-${String(next).padStart(3, '0')}`;
}

module.exports = { generateTicketId };
```

---

## 6. Error Handling

### Global Error Handler (`src/middleware/errorHandler.js`)

```javascript
module.exports = function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message, err.stack);

  // Never send stack traces to the client in production
  res.status(err.status || 500).json({
    error:   err.code    || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
  });
};
```

### 404 Handler (`src/middleware/notFound.js`)

```javascript
module.exports = function notFound(req, res) {
  res.status(404).json({
    error:   'NOT_FOUND',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
};
```

### Error Response Format (all endpoints)

```json
{
  "error":   "ERROR_CODE",
  "message": "Human-readable description of what went wrong"
}
```

**Rules**:
- Always JSON — never HTML error pages
- `message` is safe to display directly in the frontend toast
- `error` is a machine-readable code for programmatic handling
- Stack traces logged server-side only, never in response body

### Error Code Reference

| Code | HTTP Status | When |
|------|------------|------|
| `VALIDATION_ERROR` | `400` | Missing field, invalid format, invalid enum value |
| `TICKET_NOT_FOUND` | `404` | `ticket_id` does not exist in DB |
| `NOT_FOUND` | `404` | Route does not exist |
| `INTERNAL_ERROR` | `500` | Unhandled DB error or thrown exception |

---

## 7. Data Validation Rules

All validation runs in the route handler before any DB access. Server-side validation is authoritative — client-side validation is a UX convenience only.

### Email Validation

```javascript
// Simple, robust, avoids false negatives
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string'
    && email.trim().length > 0
    && email.trim().length <= 255
    && emailRegex.test(email.trim());
}
```

### Field Length Limits

| Field | Min | Max | Trimmed before check |
|-------|-----|-----|---------------------|
| `customer_name` | 2 | 255 | Yes |
| `customer_email` | — | 255 | Yes |
| `subject` | 5 | 500 | Yes |
| `description` | 10 | 5000 | Yes |
| `note_text` | 1 | 5000 | Yes |

### Status Validation

```javascript
const VALID_STATUSES = ['Open', 'In Progress', 'Closed'];

function isValidStatus(status) {
  return VALID_STATUSES.includes(status);
}
```

### Content Sanitisation
- All `TEXT` fields stored as-is (no HTML stripping at DB level)
- React escapes all dynamic content by default — XSS risk is at the rendering layer, which React handles
- No user-supplied HTML is ever rendered with `dangerouslySetInnerHTML`
- SQLite parameterised queries prevent SQL injection at the data layer

---

## 8. Seed Data (`src/seed.js`)

Run with `npm run db:seed` to pre-populate 10 sample tickets across all three statuses, so evaluators don't land on an empty app.

```javascript
// src/seed.js
const db = require('./db');
const { generateTicketId } = require('./utils/ticketId');

const SAMPLE_TICKETS = [
  { customer_name: 'Priya Sharma',    customer_email: 'priya@example.com',   subject: 'Cannot log into account',           description: 'I have been trying to log in for 2 days. Password reset emails are not arriving.',        status: 'Open' },
  { customer_name: 'Rahul Verma',     customer_email: 'rahul@example.com',   subject: 'Wrong item delivered',              description: 'I ordered a blue hoodie size L but received a red t-shirt size S.',                    status: 'In Progress' },
  { customer_name: 'Sneha Mehta',     customer_email: 'sneha@example.com',   subject: 'Order #4521 not received',          description: 'My order was supposed to arrive June 1 but tracking shows no movement since May 28.',   status: 'Open' },
  { customer_name: 'Arjun Nair',      customer_email: 'arjun@example.com',   subject: 'Refund not processed',              description: 'I returned my order 3 weeks ago and the refund has not appeared on my card.',           status: 'In Progress' },
  { customer_name: 'Divya Krishnan',  customer_email: 'divya@example.com',   subject: 'App crashes on checkout',           description: 'Every time I try to checkout the app closes. Using iPhone 14, iOS 17.2.',               status: 'Open' },
  { customer_name: 'Karan Malhotra',  customer_email: 'karan@example.com',   subject: 'Discount code not working',         description: 'Code SAVE20 shows invalid at checkout but it arrived in my email today.',                status: 'Closed' },
  { customer_name: 'Anjali Bose',     customer_email: 'anjali@example.com',  subject: 'Subscription charged twice',        description: 'I see two charges of ₹499 on June 5. Please refund the duplicate.',                    status: 'Open' },
  { customer_name: 'Vikram Joshi',    customer_email: 'vikram@example.com',  subject: 'Product damaged on arrival',        description: 'The laptop stand arrived with a cracked base. Attaching photos in follow-up email.',     status: 'In Progress' },
  { customer_name: 'Meera Iyer',      customer_email: 'meera@example.com',   subject: 'Change delivery address',           description: 'I placed order #6832 yesterday and need to change the delivery address before dispatch.', status: 'Closed' },
  { customer_name: 'Sanjay Gupta',    customer_email: 'sanjay@example.com',  subject: 'Invoice not received',              description: 'I need a GST invoice for order #3310 for business expense reimbursement.',               status: 'Closed' },
];

// Only seed if table is empty
const existing = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
if (existing.count > 0) {
  console.log(`Skipping seed — ${existing.count} tickets already exist.`);
  process.exit(0);
}

const insertTicket = db.prepare(`
  INSERT INTO tickets (ticket_id, customer_name, customer_email, subject, description, status)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const seedAll = db.transaction(() => {
  for (const ticket of SAMPLE_TICKETS) {
    const ticketId = generateTicketId();
    insertTicket.run(ticketId, ticket.customer_name, ticket.customer_email,
                     ticket.subject, ticket.description, ticket.status);
  }
});

seedAll();
console.log(`✓ Seeded ${SAMPLE_TICKETS.length} tickets.`);
```

**Notes on Render deployment**: Add `node src/seed.js` to the Render build command (after `npm install`) so the seed runs on first deploy only:
```
npm install && node src/seed.js
```
The seed script exits early if tickets already exist — safe to include in every deploy command.

---

## 9. Database Reset (`src/reset.js`)

For local development only — drops and recreates all tables.

```javascript
// src/reset.js  —  run with: npm run db:reset
// WARNING: destroys all data. Local dev only.
const db = require('./db');

db.exec(`
  DROP TABLE IF EXISTS notes;
  DROP TABLE IF EXISTS tickets;
`);

console.log('✓ Database reset. Run npm run db:seed to re-populate.');
```

---

## 10. API Versioning

**Current version**: Unversioned (no `/api/v1/` prefix)

**Rationale**: This is a single-team internal tool assessed over 3–4 days. API versioning adds URL complexity with no benefit at this scale. The assessment spec defines the routes without versioning.

**V2 migration path**: If the API becomes public or multiple clients consume it, add versioning by introducing a `/api/v1/` prefix and maintaining the original unversioned routes as aliases during a transition period.

---

## 11. Backup & Recovery

**MVP approach**: SQLite file on Render's ephemeral disk. No automated backup.

**Limitations to document in README**:
- Render free-tier ephemeral disk may be wiped on service restart (Render's paid Disk service persists data)
- For a demo deployment, this is acceptable — data loss between restarts does not affect the evaluation
- Production use would require Render's persistent disk ($0.25/GB/month) or exporting the SQLite file to S3 on a schedule

**Local backup** (run manually if needed):
```bash
# From the backend directory
cp database.sqlite database.backup.$(date +%Y%m%d).sqlite
```

**Recovery**: Copy the backup file back to `database.sqlite` and restart the server.

---

## 12. Complete File Structure

```
/backend
├── package.json
├── .env                      # gitignored
├── .env.example              # committed
├── .eslintrc.json
├── .prettierrc
├── database.sqlite           # gitignored — auto-created on first run
└── src/
    ├── index.js              # Express app entry point
    ├── db.js                 # SQLite connection + schema init
    ├── seed.js               # Sample data script
    ├── reset.js              # Dev-only: drop all tables
    ├── routes/
    │   ├── health.js         # GET /api/health
    │   └── tickets.js        # All /api/tickets/* endpoints
    ├── middleware/
    │   ├── errorHandler.js   # Global error → JSON
    │   └── notFound.js       # Unmatched route → 404 JSON
    └── utils/
        └── ticketId.js       # TKT-XXX sequential ID generator
```

---

*This document is the single source of truth for all backend decisions in the Support CRM MVP.*  
*Companion documents: `PRD.md` · `APP_FLOW.md` · `TECH_STACK.md` · `FRONTEND_GUIDELINES.md`*
