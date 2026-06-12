# Technology Stack Documentation
## Support CRM System — Datastraw Technologies

**Last Updated**: June 2025  
**Version**: MVP 1.0  
**Author**: Intern Candidate  

---

## 1. Stack Overview

### Architecture Pattern

| Property | Value |
|----------|-------|
| **Type** | Monolithic (single deployable backend + single deployable frontend) |
| **Pattern** | REST API (Express) + SPA (React) — classic client/server separation |
| **Deployment** | Cloud, free tier: Render.com (API) + Vercel (Frontend) |
| **Repository** | Monorepo — `/backend` and `/frontend` as subdirectories in one GitHub repo |

### Why This Architecture for This Project

A monolithic REST API + SPA is the right choice for this scope because:
- The assessment requires a demonstrable full-stack separation (DB → API → Frontend)
- SQLite is file-based and requires no external DB server — perfect for a free deployment
- Render + Vercel are the simplest free-tier deployment path for this stack with no DevOps overhead
- The feature set (5 CRUD endpoints, 4 screens) does not justify microservices, GraphQL, or a BFF layer

### High-Level Architecture

```
┌─────────────────────┐         HTTPS/JSON        ┌──────────────────────┐
│                     │ ◄────────────────────────► │                      │
│   React SPA         │                            │   Express REST API   │
│   (Vercel CDN)      │                            │   (Render.com)       │
│                     │                            │                      │
│  - Vite build       │                            │  - 5 endpoints       │
│  - React Router     │                            │  - Input validation  │
│  - Axios client     │                            │  - Error middleware  │
│  - Tailwind CSS     │                            │  - CORS configured   │
│                     │                            │          │           │
└─────────────────────┘                            │          ▼           │
                                                   │   SQLite (file DB)   │
                                                   │   better-sqlite3     │
                                                   │   database.sqlite    │
                                                   └──────────────────────┘
```

---

## 2. Frontend Stack

### Core Framework

| Property | Value |
|----------|-------|
| **Framework** | React |
| **Version** | 18.2.0 |
| **Build Tool** | Vite 5.0 |
| **Reason** | Fast dev server with HMR, minimal config, optimal production build, widely understood |
| **Documentation** | https://react.dev · https://vitejs.dev/docs |
| **License** | MIT |

**Why not Next.js**: Next.js adds SSR, file-based routing, and a Node server layer that are unnecessary for an internal CRUD tool with no SEO requirements. Vite + React starts in < 1 second and deploys to Vercel identically. Simpler is correct here.

**Why not Create React App**: CRA is deprecated. Vite is the current standard.

### Routing

| Property | Value |
|----------|-------|
| **Library** | React Router |
| **Version** | 6.22.0 |
| **Mode** | Client-side SPA routing (`createBrowserRouter`) |
| **Reason** | Industry standard, clean nested route config, `useNavigate` hook |
| **Documentation** | https://reactrouter.com/en/main |
| **License** | MIT |

**Route definitions**:
```javascript
createBrowserRouter([
  { path: "/",                  element: <TicketList /> },
  { path: "/tickets/new",       element: <CreateTicket /> },
  { path: "/tickets/:ticket_id",element: <TicketDetail /> },
  { path: "*",                  element: <NotFound /> },
])
```

### State Management

| Property | Value |
|----------|-------|
| **Approach** | React built-ins only: `useState`, `useEffect`, `useCallback` |
| **No external library** | Zustand, Redux, Jotai — all rejected for this scope |
| **Reason** | The app has 4 screens and 3 API resources. A state management library would be engineering overhead with no benefit. Each page component owns its own state. |

**State that lives in each component**:

| Component | State |
|-----------|-------|
| `TicketList` | `tickets[]`, `searchTerm`, `activeFilter`, `loading`, `error` |
| `CreateTicket` | `formData`, `fieldErrors`, `submitting` |
| `TicketDetail` | `ticket`, `notes[]`, `selectedStatus`, `noteInput`, `loading`, `saving` |

### Styling

| Property | Value |
|----------|-------|
| **Framework** | Tailwind CSS |
| **Version** | 3.4.1 |
| **Configuration** | `tailwind.config.js` at `/frontend` root |
| **Reason** | Utility-first, no context switching between files, responsive prefixes built-in, consistent design tokens |
| **Documentation** | https://tailwindcss.com/docs |
| **License** | MIT |

**Custom config additions** (`tailwind.config.js`):
```javascript
theme: {
  extend: {
    colors: {
      brand: { DEFAULT: "#1E3A5F", light: "#2C5F8A" }
    }
  }
}
```

**No CSS modules, no styled-components, no Sass** — Tailwind utilities are sufficient for all styling needs in this project.

### HTTP Client

| Property | Value |
|----------|-------|
| **Library** | Axios |
| **Version** | 1.6.5 |
| **Instance** | Single shared instance at `src/api/client.js` |
| **Reason** | Response/request interceptors for global error handling; cleaner than raw `fetch` for JSON APIs |
| **Documentation** | https://axios-http.com/docs |
| **License** | MIT |

**Axios instance configuration** (`src/api/client.js`):
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" }
});

// Global error handler — all non-2xx responses caught here
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Individual callers handle specific cases (404, 400)
    // Interceptor handles generic 500s and network errors
    return Promise.reject(error);
  }
);
```

### Notifications

| Property | Value |
|----------|-------|
| **Library** | react-hot-toast |
| **Version** | 2.4.1 |
| **Reason** | Lightweight (3kB), zero config, accessible, looks good with Tailwind |
| **Documentation** | https://react-hot-toast.com |
| **License** | MIT |

**Usage**: Wrap app root in `<Toaster />`. Call `toast.success()`, `toast.error()` at action completion points. No custom toast component needed.

### Form Handling

| Property | Value |
|----------|-------|
| **Approach** | Controlled components with `useState` — no form library |
| **Validation** | Custom validation functions called on blur and on submit |
| **Reason** | The app has one form (Create Ticket) with four fields. React Hook Form + Zod would be 2 dependencies for 12 lines of validation logic. |

**Alternatives considered and rejected**:
- `React Hook Form` — appropriate for apps with 5+ complex forms; overkill here
- `Formik` — deprecated in favour of RHF; not relevant
- `Zod` — excellent library but the schema would be 15 lines for 4 simple fields

### Type Safety

| Property | Value |
|----------|-------|
| **Language** | JavaScript (ES2022) |
| **No TypeScript** | Deliberate MVP decision |
| **Reason** | TypeScript adds value on large codebases with multiple contributors. For a 3-day solo MVP with ~500 lines of frontend code, the type annotation overhead slows delivery without proportional benefit. JSDoc comments are used on API call functions for IDE hints. |

**If this were a production codebase**: TypeScript with strict mode would be the correct choice. The architecture (component-per-page, api/ layer separation) is already TypeScript-ready — adding it later requires renaming `.js` to `.ts` and adding type definitions, which is a 1–2 hour migration.

---

## 3. Backend Stack

### Runtime

| Property | Value |
|----------|-------|
| **Platform** | Node.js |
| **Version** | 20.11.0 LTS |
| **Package Manager** | npm (no pnpm/yarn — minimise tooling for a 3-day project) |
| **Entry point** | `src/index.js` |
| **Documentation** | https://nodejs.org/docs/latest-v20.x/api |

### Framework

| Property | Value |
|----------|-------|
| **Framework** | Express.js |
| **Version** | 4.18.2 |
| **Reason** | Mature, minimal, well-understood, no magic — appropriate for a straightforward REST API |
| **Documentation** | https://expressjs.com/en/4x/api.html |
| **License** | MIT |

**Express middleware stack** (applied in order in `src/index.js`):

| Middleware | Package | Version | Purpose |
|------------|---------|---------|---------|
| CORS | `cors` | 2.8.5 | Allow requests from Vercel frontend URL only |
| JSON body parser | `express` built-in | 4.18.2 | Parse `application/json` request bodies |
| Request logger | `morgan` | 1.10.0 | Log method, path, status, response time in dev |
| Routes | local | — | Mount `/api/tickets` and `/api/health` routers |
| 404 handler | local | — | Catch unmatched routes, return JSON 404 |
| Error handler | local | — | Catch all thrown errors, return structured JSON 500 |

**What is NOT included and why**:
- `helmet` — useful for production hardening but adds complexity; Render provides some headers at the infrastructure level
- `express-rate-limit` — appropriate for public APIs; this is a demo app with a single known frontend client
- `compression` — SQLite responses are small; gzip overhead not justified
- `express-validator` — manual validation is 20 lines and keeps dependencies minimal

### Database

| Property | Value |
|----------|-------|
| **Database** | SQLite |
| **Version** | Native SQLite in Node.js (Node 22+) |
| **Client** | `node:sqlite` (`DatabaseSync`) |
| **File path** | `/backend/database.sqlite` (gitignored) |
| **Reason** | Zero config, built-in native support, file-based, synchronous API, works on Render free tier without an external DB server |
| **Documentation** | https://nodejs.org/docs/latest/api/sqlite.html |
| **License** | MIT |

**Why not PostgreSQL**: PostgreSQL requires a separate DB server (Supabase, Railway Postgres, Neon, etc.), connection string configuration, and adds ~$0–5/month cost. For a demo CRM with < 1,000 rows, SQLite is not only sufficient — it is faster for single-server workloads.

**Why not Prisma/Sequelize ORM**: An ORM adds a dependency, an abstraction layer, and migration tooling for 3 tables and 4 endpoints. Raw parameterized SQL with `node:sqlite` is ~40 lines for the full data layer and is easier to read, debug, and explain.

**Schema initialisation** (`src/db.js`):
```javascript
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new DatabaseSync(dbPath);

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
```

**Ticket ID generation** (`src/utils/ticketId.js`):
```javascript
// Generates TKT-001, TKT-002, etc.
function generateTicketId(db) {
  const row = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
  const next = row.count + 1;
  return `TKT-${String(next).padStart(3, '0')}`;
}
```

### Caching

**None in MVP.** SQLite reads are synchronous and fast for < 10,000 rows. API response times will be well under 100ms without caching.

### Authentication

**None in MVP.** Authentication is explicitly out of scope (see PRD §7). The API is open-access. CORS restricts API access to the known frontend origin, which is sufficient for a demo deployment.

### File Storage

**None.** Tickets are text-only. File/image attachments are out of scope for MVP.

### Email Service

**None.** No outbound email in MVP. Email notifications are out of scope.

---

## 4. DevOps & Infrastructure

### Version Control

| Property | Value |
|----------|-------|
| **System** | Git |
| **Platform** | GitHub (public repository) |
| **Default branch** | `main` |

**Branch strategy** (simplified for solo MVP):

| Branch | Purpose |
|--------|---------|
| `main` | Production — auto-deploys to Render + Vercel |
| `feature/*` | New features — merged to main via PR |

No `develop`/`staging` branch needed for a solo 3-day project. Every commit to `main` deploys. Keep commits clean and atomic.

**Required repository files**:
```
/
├── README.md          # Setup, deployment, architecture overview
├── .gitignore         # node_modules, .env, database.sqlite, dist
├── .env.example       # All required env vars with placeholder values
├── /backend
│   └── package.json
└── /frontend
    └── package.json
```

### CI/CD

**Deployment is automatic via platform integrations — no GitHub Actions workflows needed for MVP.**

| Service | Trigger | Action |
|---------|---------|--------|
| Render.com | Push to `main` (backend dir changes) | Runs `npm install`, starts `node src/index.js` |
| Vercel | Push to `main` (frontend dir changes) | Runs `npm run build` (Vite), deploys static output |

**For a production project**: Add GitHub Actions for lint + test on PR, and require checks to pass before merge. For this MVP, the time is better spent on features.

### Hosting

#### Backend — Render.com

| Property | Value |
|----------|-------|
| **Service type** | Web Service (free tier) |
| **Runtime** | Node.js 20 |
| **Root directory** | `backend` |
| **Build command** | `npm install` |
| **Start command** | `node src/index.js` |
| **Environment** | Set `NODE_ENV=production`, `FRONTEND_URL`, `PORT` (auto-provided by Render) |
| **Disk** | SQLite file persists on Render's ephemeral disk between deploys (within same instance) |
| **Free tier limit** | Spins down after 15 min inactivity; ~30s cold start on first request. **Document this prominently in README and call out in demo video.** |

#### Frontend — Vercel

| Property | Value |
|----------|-------|
| **Framework preset** | Vite |
| **Root directory** | `frontend` |
| **Build command** | `npm run build` |
| **Output directory** | `dist` |
| **Environment variable** | `VITE_API_URL` = Render backend URL |
| **Free tier** | No spin-down; instant globally distributed CDN |

### Monitoring

**MVP level — minimal but sufficient:**

| Concern | Solution |
|---------|---------|
| API health check | `GET /api/health` → `{ status: "ok", timestamp }` — can be pinged by UptimeRobot free tier to prevent Render spin-down |
| Error visibility | `console.error` in Express error handler; visible in Render dashboard logs |
| Request logging | `morgan` in development; disabled or set to `tiny` in production |
| Frontend errors | Browser console; no Sentry in MVP |

**V2 additions**: Sentry for both frontend and backend, structured JSON logging (Winston or Pino), Render health check configuration.

### Testing

**MVP testing approach — manual + targeted automated:**

| Type | Tool | Scope |
|------|------|-------|
| Manual | Browser + Postman/curl | All 5 API endpoints; all 4 screens; all 3 user flows + edge cases |
| API integration (recommended) | Supertest | The 4 core endpoints; ~15 test cases covering happy path + error states |
| Unit | None in MVP | Ticket ID generator utility is deterministic and testable if time allows |
| E2E | None in MVP | Playwright is appropriate for V2 |

**Minimum API test cases to write** (if time allows, using Jest + Supertest):
- `POST /api/tickets` — valid body → 201
- `POST /api/tickets` — missing field → 400
- `POST /api/tickets` — invalid email → 400
- `GET /api/tickets` — returns array
- `GET /api/tickets?status=Open` — returns only Open
- `GET /api/tickets?search=test` — returns matching tickets
- `GET /api/tickets/:id` — existing ID → 200 with notes
- `GET /api/tickets/:id` — nonexistent ID → 404
- `PUT /api/tickets/:id` — valid status update → 200
- `PUT /api/tickets/:id` — add note → 200, note retrievable

---

## 5. Development Tools

### Code Quality

| Tool | Version | Config file | Purpose |
|------|---------|-------------|---------|
| ESLint | 8.56.0 | `.eslintrc.json` | Catch errors and anti-patterns |
| Prettier | 3.2.4 | `.prettierrc` | Consistent formatting |
| Husky | — | Not used in MVP | Git hooks add setup overhead not justified for solo project |

**ESLint config** (backend, `.eslintrc.json`):
```json
{
  "env": { "node": true, "es2022": true },
  "extends": ["eslint:recommended"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error"
  }
}
```

**ESLint config** (frontend, `.eslintrc.json`):
```json
{
  "extends": ["react-app"],
  "rules": {
    "no-unused-vars": "error"
  }
}
```

**Prettier config** (`.prettierrc` — shared root):
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### IDE Recommendations

| Tool | Recommendation |
|------|---------------|
| **Editor** | VS Code |
| **Extensions** | ESLint · Prettier · Tailwind CSS IntelliSense · SQLite Viewer · REST Client (for testing API without Postman) |
| **Settings** | `"editor.formatOnSave": true` · `"editor.defaultFormatter": "esbenp.prettier-vscode"` |

---

## 6. Environment Variables

### Backend (`/backend/.env`)

```bash
# Server
PORT=3001                          # Local dev port (Render sets this automatically in production)
NODE_ENV=development               # Set to "production" on Render

# CORS
FRONTEND_URL=http://localhost:5173 # Local dev; set to Vercel URL in production
# e.g. FRONTEND_URL=https://your-app.vercel.app

# Database
# SQLite is file-based — no DATABASE_URL needed.
# File path is resolved relative to the project root in src/db.js.
```

### Frontend (`/frontend/.env.local`)

```bash
# API
VITE_API_URL=http://localhost:3001  # Local dev; set to Render URL in production
# e.g. VITE_API_URL=https://your-api.onrender.com
```

### `.env.example` files

Both `.env` and `.env.local` are gitignored. Each directory must contain a committed `.env.example`:

**`/backend/.env.example`**:
```bash
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
# Production: FRONTEND_URL=https://your-app.vercel.app
```

**`/frontend/.env.example`**:
```bash
VITE_API_URL=http://localhost:3001
# Production: VITE_API_URL=https://your-api.onrender.com
```

### Variable Checklist for Deployment

| Variable | Set In | Value Source |
|----------|--------|-------------|
| `PORT` | Render dashboard | Auto-provided by Render — do NOT hardcode |
| `NODE_ENV` | Render dashboard | Set to `production` |
| `FRONTEND_URL` | Render dashboard | Copy from Vercel deployment URL |
| `VITE_API_URL` | Vercel dashboard (Environment Variables) | Copy from Render service URL |

## 7. Dependency Summary

### Backend (`/backend/package.json`)

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.3"
  }
}
```

**Backend Scripts & Jobs:**
- `start` — `node src/index.js` (plain `node` for production, what Render runs)
- `dev` — `nodemon src/index.js` (watches for file changes and auto-restarts)
- `db:seed` — `node src/seed.js` (inserts 10 sample tickets so evaluators do not land on an empty list)
- `db:reset` — `node src/reset.js` (drops and recreates the database schema)

### Frontend (`/frontend/package.json`)

```json
{
  "dependencies": {
    "axios": "^1.7.2",
    "lucide-react": "^0.395.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hot-toast": "^2.4.1",
    "react-router-dom": "^6.23.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0-alpha.16",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0-alpha.16",
    "vite": "^5.2.11"
  }
}
```

**Frontend Scripts & Jobs:**
- `dev` — `vite` (starts the Vite dev server at `localhost:5173` with HMR)
- `build` — `vite build` (creates the `dist/` production folder deployed on Vercel)
- `preview` — `vite preview` (serves the production build locally to verify before deploying)

### Dependency Philosophy

> **Every dependency is a maintenance cost and an attack surface. Add only what you need and can explain.**

This stack was chosen to be explainable line-by-line. Every library has one clear job:

| Library | One-sentence job |
|---------|-----------------|
| `express` | Handle HTTP routing and middleware on the server |
| `cors` | Allow the Vercel frontend to call the Render API |
| `dotenv` | Load environment variables from a `.env` file |
| `nodemon` | Monitor server files and restart on changes during development |
| `react` | Build the UI as a tree of reusable components |
| `react-dom` | Mount the React component tree into the browser DOM |
| `react-router-dom` | Map URL paths to page components |
| `axios` | Make HTTP requests to the API from the frontend |
| `react-hot-toast` | Show non-blocking success and error notifications |
| `vite` | Bundle and serve the frontend during development and production |
| `tailwindcss` | Apply styling via utility classes in JSX |

---

## 8. Architecture Decisions Log

Documenting key decisions made and why — useful for the demo video and submission write-up.

| Decision | Option Chosen | Options Rejected | Reason |
|----------|--------------|-----------------|--------|
| DB | SQLite + `node:sqlite` | External database servers (PostgreSQL, MySQL) | Zero config, no external server, file-based, native Node.js support, sufficient for demo scale |
| Frontend | React + Vite | Multi-page / SSR frameworks | React is most widely understood; Vite is faster than CRA; SSR is unnecessary overhead for internal tools |
| API style | REST | GraphQL, gRPC | REST matches the assessment spec exactly; simpler to explain and test |
| ORM | None (raw SQL) | ORM libraries | 3 tables, 4 endpoints — an ORM is abstraction without value at this scale |
| State management | useState/useEffect | State management libraries | 4 pages, each owns its state — no shared state problem to solve |
| Auth | None (MVP) | Auth systems | Explicitly out of scope per PRD |
| CSS | Tailwind | CSS Modules, plain CSS | Fastest to write, most consistent output, responsive utilities built-in |
| Deployment | Render + Vercel | Alternative hosting platforms | Most straightforward free path for this exact stack (Node.js + static SPA) |
| TypeScript | No (JS only) | TypeScript | 3-day MVP, solo developer — JS ships faster |

---

*This document covers the MVP technology choices only.*  
*Companion documents: `PRD.md` · `APP_FLOW.md` · `README.md`*
