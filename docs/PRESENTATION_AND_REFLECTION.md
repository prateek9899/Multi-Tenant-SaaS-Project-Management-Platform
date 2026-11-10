# 🎙️ Final Presentation & Individual Reflection Deliverable

**Project**: Multi-Tenant SaaS Project Management Platform (ProjectFlow)  
**Author**: Prateek Jukaria  
**Track**: Full-Stack Development Capstone  

---

## 📑 Part 1: 10-Minute Final Presentation Guide

Use this slide-by-slide script during your final evaluation or record your video presentation using this outline:

### Slide 1: Introduction & Problem Statement (Time: ~1.5 mins)
* **Title**: ProjectFlow — Enterprise Multi-Tenant SaaS Project Management Platform
* **Presenter**: Prateek Jukaria
* **The Problem**: Modern software teams need isolated, collaborative project tracking like Jira or Linear. However, building software for multiple business clients requires strict workspace data segregation, custom workflow stages, role permissions, and billing lifecycle management without creating a brand new database for every single company.
* **Our Solution**: A unified MERN-stack multi-tenant platform where each tenant gets an isolated workspace with boards, sprints, RBAC security, and subscription tiers.

---

### Slide 2: High-Level System Architecture & Multi-Tenancy Strategy (Time: ~2 mins)
* **Architecture Style**: Decoupled MERN Architecture (React Single Page Application + Express REST API + MongoDB Document Store).
* **Isolation Strategy**: **Shared Schema with Row-Level Tenant Isolation**.
  * Every tenant request includes an `X-Tenant-ID` header.
  * The custom `tenant.middleware.js` automatically resolves the tenant workspace and validates that the requesting user holds an active membership.
  * All database operations are strictly scoped: `Issue.find({ organization: req.organization._id })`.
* **Why This Strategy**: Eliminates complex database connection pooling, offers instant tenant onboarding, keeps resource utilization optimal, and prevents any cross-tenant data leaks using compound MongoDB indexes.

---

### Slide 3: Core Features & Walkthrough (Time: ~3 mins)
* **Interactive Drag-and-Drop Kanban Board**: Built with HTML5 Drag & Drop API, featuring optimistic client-side UI updates, automatic status syncing, and backend persistence.
* **Scrum Sprint Lifecycle**: Sprint planning, starting active sprints, burndown progress bars, and automatic rollover of uncompleted issues upon sprint completion.
* **Role-Based Access Control (RBAC)**: Owner, Admin, Member, and Viewer roles with granular permission guards on sensitive mutations.
* **Audit Trail**: Real-time immutable event log recording who changed what, when, and from which IP address.
* **Subscription & Billing Limits**: Tiered plan structure (Free, Starter, Professional, Enterprise) with automated enforcement of member seats and project quotas.

---

### Slide 4: Engineering Challenges & How They Were Overcome (Time: ~2 mins)
1. **Challenge 1: Zero Cross-Tenant Data Leakage**:
   * *Resolution*: Built a reusable middleware layer and compound unique indexes `{ organization: 1, key: 1 }` ensuring project keys and issue identifiers are isolated per tenant.
2. **Challenge 2: Smooth Drag-and-Drop UX without Latency**:
   * *Resolution*: Implemented optimistic UI state updates in React, updating column lanes instantaneously on the client while persisting the position change asynchronously in the background.
3. **Challenge 3: Complex Scrum Workflow Rules**:
   * *Resolution*: Enforced business rules requiring only one active sprint per project at any given time and auto-migrating unfinished tasks to the backlog.

---

### Slide 5: Results, Numbers & Next Steps (Time: ~1.5 mins)
* **Results**:
  * Clean, production-ready Vite bundle (~318 KB gzipped to under 97 KB) with fast initial load.
  * 100% modular Express REST API with centralized error handling.
  * Comprehensive seed script generating realistic projects, tickets, and team members in seconds.
* **Future Roadmap**:
  * Real-time WebSocket live collaboration for multi-user board updates.
  * Native integration with GitHub webhooks for automatic PR-to-issue linking.
  * Custom reporting dashboards and velocity burndown analytics.

---

## 📝 Part 2: Individual Reflection

*(You can copy and paste this directly into your written project report or Google Drive submission)*

> ### **Intern Reflection: Prateek Jukaria**
>
> "Working on the Multi-Tenant SaaS Project Management Platform was an invaluable hands-on experience in architecting production-grade cloud software. My primary objective was to move beyond simple CRUD applications and build a scalable, multi-tenant system with real-world enterprise requirements.
>
> **What I Owned:**
> - Designed and implemented the complete multi-tenant database schema using MongoDB and Mongoose, enforcing strict row-level isolation via custom Express middleware.
> - Engineered the interactive Kanban board in React with drag-and-drop mechanics, optimistic state updates, and column capacity (WIP) limit enforcement.
> - Implemented role-based access control (RBAC) supporting Owner, Admin, Member, and Viewer permissions across all API endpoints.
> - Developed the Scrum sprint lifecycle, automated issue numbering (`CCP-1`, `MOB-2`), audit event logging, and subscription billing tier logic.
> - Containerized the entire application with Docker and established automated CI/CD pipeline checks via GitHub Actions.
>
> **Key Learnings:**
> Throughout this capstone, I learned how to balance system security with developer ergonomics. Designing multi-tenant software taught me that security cannot be an afterthought; it must be baked into every layer of the API request pipeline. I also deepened my understanding of state management in React, compound database indexing in MongoDB, and creating intuitive user experiences comparable to modern tools like Jira and Linear. This project significantly strengthened my confidence in delivering full-stack enterprise solutions independently."
