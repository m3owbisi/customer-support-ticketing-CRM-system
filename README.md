# SupportFlow — Support CRM Ticket Management System

SupportFlow is a modern, responsive full-stack Customer Support CRM and Ticket Management System. Built with Node.js/Express, React (Vite), and Node's native SQLite, it allows support teams to log, track, prioritize, search, and resolve customer issues through a clean dashboard.

## 🚀 Key Features

### P0 — Core MVP Features
1. **Create Tickets**: Log issues with customer details (name, email), subject, description, priority, and assignees.
2. **Sequential ID Generation**: Automatically stamps tickets with sequential, zero-padded IDs (e.g., `TKT-001`).
3. **Dashboard List**: A paginated, responsive table of all tickets featuring color-coded status badges (Open - blue, In Progress - amber, Closed - green).
4. **Debounced Live Search**: Search instantly across name, email, ID, subject, and description with a 300ms debounce.
5. **Combine Search & Filters**: Easily filter by Status and Priority simultaneously with live result updates.
6. **Detailed View & Status Updates**: A split-screen ticket panel allowing real-time status updates and internal comment logs.

### P1 — Premium Enhancements
*   **Ticket Priority Field**: Low / Medium / High settings with visual badges.
*   **Assignee Field**: Input and update free-text assignee names inline.
*   **Metrics Summary Bar**: High-level counters showing total, open, in-progress, and closed ticket counts.
*   **Export as CSV**: Instantly download the active list of tickets as a standard CSV format.

---

## 🛠️ Tech Stack

*   **Backend**: Node.js, Express.js
*   **Database**: Node.js Native SQLite (`node:sqlite`) — *zero external compilation required*
*   **Frontend**: React (Vite), Tailwind CSS v4, Lucide Icons, React Router v6, React Hot Toast
*   **APIs**: RESTful JSON API

---

## 💾 Database Schema

### `tickets` Table
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Internal row ID |
| `ticket_id` | TEXT | UNIQUE NOT NULL | User-facing formatted ID (e.g., `TKT-001`) |
| `customer_name`| TEXT | NOT NULL | Customer's full name |
| `customer_email`| TEXT | NOT NULL | Validated email format |
| `subject` | TEXT | NOT NULL | Brief subject title |
| `description` | TEXT | NOT NULL | Full ticket content |
| `status` | TEXT | NOT NULL DEFAULT 'Open' | Enum: `Open`, `In Progress`, `Closed` |
| `priority` | TEXT | NOT NULL DEFAULT 'Medium'| Enum: `Low`, `Medium`, `High` |
| `assignee` | TEXT | DEFAULT NULL | Support agent's name |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Auto-stamped |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Auto-updated on modification |

### `notes` Table
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Internal row ID |
| `ticket_id` | TEXT | FK → `tickets.ticket_id` | Linked ticket reference |
| `note_text` | TEXT | NOT NULL | Internal agent comment content |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Time note was added |

---

## 📡 REST API Reference

### 1. Health Monitor
*   **Method**: `GET`
*   **Endpoint**: `/api/health`
*   **Response**: `200 OK`
    ```json
    { "status": "ok", "timestamp": "2026-06-11T12:00:00.000Z" }
    ```

### 2. Create Ticket
*   **Method**: `POST`
*   **Endpoint**: `/api/tickets`
*   **Body**:
    ```json
    {
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "subject": "Login Failure",
      "description": "Getting 403 error on console",
      "priority": "High"
    }
    ```
*   **Response**: `201 Created`
    ```json
    {
      "ticket_id": "TKT-004",
      "created_at": "2026-06-11 05:45:46"
    }
    ```

### 3. List / Search / Filter Tickets
*   **Method**: `GET`
*   **Endpoint**: `/api/tickets`
*   **Query Params**:
    *   `status` (optional: `Open`, `In Progress`, `Closed`)
    *   `priority` (optional: `Low`, `Medium`, `High`)
    *   `search` (optional: string search text)
    *   `page` (optional: page index, default: `1`)
    *   `limit` (optional: default: `10`)
*   **Response**: `200 OK`
    ```json
    {
      "tickets": [...],
      "total": 4,
      "summary": { "total": 4, "open": 1, "in_progress": 2, "closed": 1 },
      "page": 1,
      "limit": 10
    }
    ```

### 4. Fetch Ticket Details
*   **Method**: `GET`
*   **Endpoint**: `/api/tickets/:ticket_id`
*   **Response**: `200 OK`
    ```json
    {
      "ticket_id": "TKT-001",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "subject": "Login Failure",
      "description": "...",
      "status": "Open",
      "priority": "High",
      "assignee": "Alice Smith",
      "created_at": "...",
      "updated_at": "...",
      "notes": [
        { "note_text": "First investigation note", "created_at": "..." }
      ]
    }
    ```

### 5. Update Ticket / Add Note
*   **Method**: `PUT`
*   **Endpoint**: `/api/tickets/:ticket_id`
*   **Body** (all optional):
    ```json
    {
      "status": "In Progress",
      "priority": "Medium",
      "assignee": "Bob Johnson",
      "note_text": "Added stripe log check."
    }
    ```
*   **Response**: `200 OK`
    ```json
    {
      "success": true,
      "updated_at": "2026-06-11 12:15:00"
    }
    ```

---

## 🏃 Local Setup

### Prerequisites
*   **Node.js**: Version `22.5.0` or higher (recommended for built-in SQLite support)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize environmental configurations:
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Start the server (runs on `http://localhost:3001`):
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.
