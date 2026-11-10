# 🚀 ProjectFlow — Multi-Tenant SaaS Project Management Platform (MERN Stack)

<div align="center">

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.21-lightgrey?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

**A modern, production-grade, Jira/Linear-like project management SaaS platform built with the MERN stack featuring row-level multi-tenant workspace isolation, interactive drag-and-drop Kanban boards, Scrum sprint management, RBAC, audit logs, and Stripe subscription billing.**

</div>

---

## 📑 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Architecture & Multi-Tenancy Strategy](#-architecture--multi-tenancy-strategy)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start Guide](#-quick-start-guide)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Demo Credentials](#-demo-credentials)
- [Intern Reflection & Ownership](#-intern-reflection--ownership)

---

## 🌟 Project Overview
ProjectFlow is a full-featured SaaS project management tool engineered to demonstrate real-world enterprise architecture:
1. **True Multi-Tenancy**: Shared database schema with row-level `organization` isolation enforced via middleware.
2. **Interactive Kanban Boards**: HTML5 drag-and-drop ticket reordering across customizable workflow swimlanes with optimistic UI updates.
3. **Sprint Cadence**: Scrum sprint planning, activation, progress tracking, and issue migration.
4. **Role-Based Access Control (RBAC)**: Owner, Admin, Member, and Viewer roles with granular permission guards.
5. **Audit Trail & Webhooks**: Immutable logging of mutations and asynchronous outgoing webhooks with cryptographic HMAC signatures.
6. **Stripe Billing Integration**: Self-serve subscription tiers (Free, Starter, Pro, Enterprise) with automatic feature limit gates.

---

## 🏗 Architecture & Multi-Tenancy Strategy

### Tenant Isolation Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      Client Request                         │
│             Headers: { 'X-Tenant-ID': 'acme-tech' }         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              tenant.middleware.js (Row-Level Guard)         │
│  1. Resolves Organization by slug ('acme-tech')             │
│  2. Validates User is an active member in OrgMembership     │
│  3. Attaches req.organization and req.membership            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Queries                        │
│   All DB operations automatically scoped:                   │
│   Issue.find({ organization: req.organization._id, ... })   │
│   Strict zero cross-tenant data leakage                     │
└─────────────────────────────────────────────────────────────┘
```

**Why Shared Schema with Tenant ID?**
- Simple to operate, deploy, and explain.
- No complex dynamic database pooling or migration overhead.
- Scales gracefully to thousands of tenants using MongoDB compound indexes `{ organization: 1, ... }`.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | Responsive SPA, fast HMR, clean Linear/Jira style |
| **Backend** | Node.js, Express.js | Modular RESTful API with middleware chain |
| **Database** | MongoDB 7, Mongoose ODM | Document store with compound tenant indexes |
| **Auth** | JSON Web Tokens (JWT), Bcrypt.js | Stateless authentication with Bearer tokens |
| **Billing** | Stripe (Test Mode) | Tiered pricing plans with membership & project limits |
| **DevOps** | Docker, Docker Compose, GitHub Actions | Containerized production deployment & CI checks |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port 27017 or via Docker)

### Option 1: Docker (Single Command)
```bash
# Clone the repository
git clone https://github.com/prateekjukaria/saas-projectflow.git
cd saas-projectflow

# Run entire stack in containers
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/v1`

---

### Option 2: Local Development Run

#### 1. Setup Backend:
```bash
cd backend
npm install
cp .env.example .env

# Run database seed with fake users, projects, and Kanban issues
npm run seed

# Start API server
npm run dev
```

#### 2. Setup Frontend:
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Owner** | `prateek@projectflow.io` | `password123` |
| **Admin** | `alex@projectflow.io` | `password123` |
| **Member**| `sarah@projectflow.io` | `password123` |
| **Tenant**| Slug: `acme-tech` | Organization: Acme Technologies |

---

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` — Register user & issue JWT
- `POST /api/v1/auth/login` — Login user & return token
- `GET /api/v1/auth/me` — Current user profile

### Workspaces & Tenants
- `GET /api/v1/organizations` — List user's workspaces
- `POST /api/v1/organizations` — Create new workspace
- `GET /api/v1/organizations/members` — List team seats
- `POST /api/v1/organizations/members/invite` — Invite team member

### Projects & Kanban Boards
- `GET /api/v1/projects` — List workspace projects
- `POST /api/v1/projects` — Create project (auto-creates default board & columns)
- `GET /api/v1/boards/:id` — Get board columns with nested issues
- `POST /api/v1/boards/:id/columns` — Create board column

### Issues & Sprints
- `GET /api/v1/issues` — Query issues with filters
- `POST /api/v1/issues` — Create issue with auto-generated key (`PRJ-1`)
- `POST /api/v1/issues/:id/move` — Drag-and-drop column & position update
- `POST /api/v1/issues/:id/comments` — Add threaded discussion comment
- `POST /api/v1/sprints` — Create sprint cycle
- `POST /api/v1/sprints/:id/start` — Start sprint
- `POST /api/v1/sprints/:id/complete` — Complete sprint & rollover tasks

### Billing & Compliance
- `GET /api/v1/billing/plans` — List pricing tiers
- `POST /api/v1/billing/subscribe` — Upgrade plan & adjust quotas
- `GET /api/v1/audit` — Query workspace audit log

---

## 🎓 Intern Reflection & Ownership

### What I Owned
1. **Full Architecture Implementation**: Designed and built both frontend and backend using the MERN stack with complete separation of concerns.
2. **Multi-Tenant Isolation Strategy**: Implemented the `tenant.middleware.js` to ensure zero data crossover between different workspaces.
3. **HTML5 Drag & Drop Kanban**: Engineered the fluid Kanban board with optimistic UI updates and instant position persistence.
4. **Security & RBAC**: Structured role guards for Owner, Admin, Member, and Viewer across destructive endpoints.

### Key Learnings
- Balancing security with user experience in multi-tenant SaaS.
- Managing relational-style data (projects -> boards -> columns -> issues) cleanly within MongoDB.
- Containerization and orchestration with Docker Compose for seamless reproducible environments.

---

<div align="center">
<b>Developed with passion by Prateek Jukaria · Capstone Full-Stack Project</b>
</div>
