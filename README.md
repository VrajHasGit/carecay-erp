# Carecay ERP

**The internal operating system for Carecay's used-car business today — and the foundation for a bigger company-wide software platform.**

Carecay ERP runs the full purchase-to-sale pipeline for the dealership: every stage of a vehicle's lifecycle — inquiry, valuation, purchase, refurbishment, stock, sale, delivery, finance, compliance — is modeled as a distinct, reusable pipeline stage rather than hardcoded one-off screens. That structure is deliberate: this repo is meant to be the base this grows from as Carecay's software ambitions expand beyond a single dealership's internal tool.

This version runs on a self-hosted Node/Express + MySQL backend (see below). The next iteration of the platform is planned to move to **Supabase** (managed Postgres, auth, storage) as the company scales — the data-access layer in this codebase (`src/lib/localFirebase/`) already isolates the frontend from the backend implementation specifically so that migration doesn't require rewriting the application.

---

## What it does today

A role-based ERP covering the full lifecycle of a used vehicle:

- **Purchase pipeline** — Inquiry → Valuation → Follow-Up → Closer → Order Booking → Payment → Documents → Stock
- **Sales pipeline** — Inquiry → Follow-Up → Test Drive → Closer → Order Booking → Finance → Payment → Delivery → GST Invoice
- **Operations** — Workshop/refurbishment job cards, stock inventory with photo management, gate passes, delivery notes, customer records
- **Management** — Role-based dashboards, targets & achievements, daily task tracking, employee performance, notifications
- **Admin** — User management with branch/role access control, configurable company settings

Every pipeline stage supports both organic creation (a standalone "+ Add" action) and promotion from the previous stage (a "Send to X" handoff), so the system matches how a real dealership floor actually works — deals don't always start at step one.

## Tech stack

- **Frontend** — React 19, React Router 7, Vite
- **Backend (current)** — Node.js + Express REST API, backed by MySQL (a generic JSON-document store per collection, so new fields never require a schema migration)
- **Backend (planned)** — Supabase (Postgres + Auth + Storage), as the platform grows past a single-dealership tool
- **Auth** — JWT-based sessions with bcrypt password hashing
- **Media** — Client-side image compression, stored as base64 or uploaded to configurable object storage (Cloudflare R2 / Cloudinary)
- **Deployment** — Static frontend (Vercel-ready); backend is a standalone Node service that can run anywhere

The data layer is intentionally decoupled from any single backend vendor — the frontend talks to a thin compatibility layer (`src/lib/localFirebase/`) that mimics document-store semantics (collection/doc/query) regardless of what's underneath. That's what let this project move off Firebase onto local MySQL without touching a single page component, and it's the same seam the eventual Supabase migration will go through.

## Getting started

**Prerequisites:** Node.js 18+, MySQL 8+

```bash
# 1. Install dependencies
npm install

# 2. Set up the database
mysql -u root -p < server/schema.sql         # creates carecay_crm + all tables

# 3. Configure the backend
cp server/.env.example server/.env           # fill in your MySQL credentials + JWT secret

# 4. Configure the frontend
cp .env.example .env.local                   # fill in local API URL / media upload config

# 5. Run everything
npm run dev:local                            # starts the API server + Vite dev server together
```

Visit `http://localhost:5173` and log in with an account seeded via `server/import.js` or created through User Management.

## Project structure

```
src/
  components/          Layout, Sidebar, Topbar, notifications, media viewer, print templates
  components/modals/   One modal per business entity — the primary data-entry surface
  contexts/            Auth, real-time data sync, notifications
  lib/localFirebase/   Backend-agnostic data-access shim (collection/doc/query semantics)
  pages/               One page per pipeline stage / module
  services/            Generic CRUD, ID generation, notification dispatch
  utils/               Calculations (EMI, GST, negotiation), formatting, cross-collection auto-fill
server/
  index.js             Express REST API
  db.js                MySQL connection pool
  import.js            Data recovery / seed script
```

## Roadmap

- Migrate the backend from MySQL to Supabase (Postgres + Auth + Storage) as the primary datastore
- Harden auth and access control now that the system is standing on its own (independent of a single BaaS vendor's default security posture)
- Extend the pipeline model to support additional branches/entities under the Carecay umbrella
- Keep the frontend's data-access layer backend-agnostic so future infrastructure changes stay isolated from page/component code
