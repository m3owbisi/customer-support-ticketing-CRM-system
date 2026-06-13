# 🎫 Support CRM System

A full-stack Customer Support Ticketing System that allows teams to create, manage, filter, and track customer issues efficiently.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2022.5.0-blue.svg)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/react-v18.x-cyan.svg)](https://react.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/styling-Tailwind%20CSS%20v4-blueviolet.svg)](https://tailwindcss.com)
[![Database SQLite](https://img.shields.io/badge/database-SQLite%20(Native)-lightgrey.svg)](https://sqlite.org)
[![Deployment Vercel](https://img.shields.io/badge/frontend-Vercel-black.svg)](https://vercel.com)
[![Deployment Render](https://img.shields.io/badge/backend-Render-informational.svg)](https://render.com)

---

## 🚀 Live Demo

*   🌐 **Frontend (Vercel)**:  
    [https://customer-support-ticketing-crm-syst-kohl.vercel.app/](https://customer-support-ticketing-crm-syst-kohl.vercel.app/)

*   ⚙️ **Backend API (Render)**:  
    [https://customer-support-ticketing-crm-system-k22t.onrender.com](https://customer-support-ticketing-crm-system-k22t.onrender.com)

*   🎥 **Demo Video**:  
    [Add your video link here]

---

## 🧠 Project Overview

This project is a clean, minimal yet feature-rich **Support CRM system** built to demonstrate end-to-end full-stack development skills:

*   **Database Design**: Clean relational database model with SQLite.
*   **Production APIs**: Statically compiled-free SQLite queries, RESTful routing, input validation, and proper CORS mapping.
*   **Frontend Dashboard**: Responsive UI with debounced search, status and priority filters, metrics bar, and CSV export.
*   **Zero-Overengineering Philosophy**: Standardized architecture with minimal external packages.

---

## 🏗️ Tech Stack

### 🔹 Frontend
*   **React.js (Vite)**
*   **Tailwind CSS v4** for clean, responsive styling
*   **Lucide Icons** & **React Hot Toast** for polished visual feedback
*   **Axios** for API calls

### 🔹 Backend
*   **Node.js & Express.js**
*   **Custom Request Logger & Error Middleware**

### 🔹 Database
*   **Node.js Native SQLite (`node:sqlite`)** — *Zero external compilation or native bindings required.*

### 🔹 Deployment
*   **Vercel** (Frontend)
*   **Render** (Backend)

---

## ⚖️ Architectural Decisions

### ✅ Why Node.js + Express + React
*   **Single language (JavaScript/JSX)** across the entire stack for faster context switching and debugging.
*   **Extremely light container footprint** for the backend API, allowing fast cold starts on Render.
*   **Vite's ultra-fast bundling** for quick UI feedback loops.

### ✅ Why Native SQLite (`node:sqlite`)
*   **No dependencies or build steps** like Node-gyp or node-sqlite3 compilations.
*   **Perfect for MVP scale**: Keeps data in a structured, local, file-based SQL schema without database provisioning costs.

### ❌ Why NOT Next.js / FastAPI
*   Avoided SSR complexity and extra hydration weights for a simple single-page dashboard.
*   Avoided a multi-language stack (Python + JS) to maximize simplicity and code reusability.

---

## 📦 Dependency Philosophy

> Every dependency is a maintenance cost.

*   Only essential packages were added.
*   We skipped heavy state management libraries (Redux/Zustand) in favor of React's native hooks (`useState`, `useEffect`).
*   Database interaction uses built-in core libraries rather than ORMs (like Prisma/Sequelize) to keep database reads/writes transparent.

---

## ✨ Features

*   ✅ **Create Support Tickets**: Log issues with customer details, priority, and assignees.
*   ✅ **Sequential Ticket ID**: Automatic formatting (e.g., `TKT-001`).
*   ✅ **Metrics Summary Bar**: High-level counters showing total, open, in-progress, and closed ticket counts.
*   ✅ **Debounced Search**: Instantly query across customer name, email, ID, subject, and description.
*   ✅ **Filter tickets**: Combine Status and Priority filters simultaneously.
*   ✅ **Ticket detail & internal comments**: View and update status, assignee, and add internal notes.
*   ✅ **Export as CSV**: Instant client-side download of the active ticket list.
*   ✅ **Fully deployed system** with environment configuration.

---

## 📁 Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── config/      # Environment mappings
│   │   ├── routes/      # Express API routers
│   │   ├── utils/       # Utility functions
│   │   ├── db.js        # SQLite initialization & schemas
│   │   ├── index.js     # Express App entrypoint
│   │   ├── seed.js      # Database seed script
│   │   └── reset.js     # Database reset script
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios API connection layer
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Dashboard & Form views
│   │   ├── App.jsx      # Root routing/app setup
│   │   └── main.jsx
│   ├── package.json
│   └── vercel.json
│
├── package.json         # Workspace scripts
└── vercel.json          # Root Vercel monorepo configuration
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Get server health and timestamps |
| `GET` | `/api/tickets` | Get all tickets (supports `status`, `priority`, `search`, `page`, `limit`) |
| `POST` | `/api/tickets` | Create a new ticket |
| `GET` | `/api/tickets/:ticket_id` | Get details of a single ticket along with notes |
| `PUT` | `/api/tickets/:ticket_id` | Update ticket details (status, assignee, priority, add note) |

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/m3owbisi/customer-support-ticketing-CRM-system.git
cd customer-support-ticketing-CRM-system
```

---

### 2️⃣ Monorepo Script Setup

From the root directory, you can run unified commands to install and start the app:

Install all dependencies (frontend + backend):
```bash
npm run install-all
```

Create a `.env` file inside the `backend` folder:
```
PORT=3001
# Optional: FRONTEND_URL=http://localhost:5173
```

Run both frontend and backend concurrently:
```bash
npm run dev
```

---

### 3️⃣ Individual Folder Setup

If you prefer running them in separate terminal tabs:

**Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env
npm start
```
*API will be available at `http://localhost:3001`*

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```
*Frontend will be available at `http://localhost:5173`*

---

## 🚧 Challenges & Solutions

### 🔸 Native SQLite Compatibility
*   **Challenge**: Compiling node-sqlite3/better-sqlite3 binaries often fails across developer environments.
*   **Solution**: Migrated to Node 22's native `node:sqlite` module, resolving all system-level binary installation issues.

### 🔸 CORS Errors
*   **Challenge**: Cross-Origin Request blocking between Vercel and Render.
*   **Solution**: Setup dynamic CORS middleware checking localhost and `*.vercel.app` patterns.

### 🔸 State Sync Issues
*   **Challenge**: Changes in details modal (like changing status or adding comments) not reflecting in the parent table.
*   **Solution**: Implemented prop-driven refresh handlers allowing parent dashboard states to reload seamlessly upon ticket modifications.

---

## 🔮 Future Improvements

*   🔐 **Authentication**: Admin/Agent JWT-based login flows.
*   👥 **Role-based Access**: Specific capabilities for admins vs. agents.
*   ⚡ **Real-time Updates**: Integrating WebSockets (Socket.io) for live ticket updates.
*   📊 **Analytics Dashboard**: Rich graphs and charts showing response resolution times.

---

## 🙌 Key Learnings

*   Building and deploying a monorepo structure on Vercel and Render.
*   Leveraging new native Node.js libraries (`node:sqlite`) to simplify installation and dependencies.
*   Managing state interactions cleanly in custom React dashboard layouts.

---

## 👩‍💻 Author

**m3owbisi** (hp0505157@gmail.com)

---

## ⭐ Final Note

This project focuses on **functionality, clarity, and deployment** over perfection.

> "Working software > perfect software."
