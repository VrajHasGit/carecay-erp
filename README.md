# Carecay ERP

**The internal operating system for Carecay's used-car business today — and the foundation for a bigger company-wide software platform.**

Carecay ERP runs the full purchase-to-sale pipeline for the dealership: every stage of a vehicle's lifecycle — inquiry, valuation, purchase, refurbishment, stock, sale, delivery, finance, compliance — is modeled as a distinct, reusable pipeline stage rather than hardcoded one-off screens. That structure is deliberate: this repo is meant to be the base this grows from as Carecay's software ambitions expand beyond a single dealership's internal tool.

This version runs on **Google Firebase** (Firestore, Auth, Storage) — a fully managed backend, so there's no server to host or database schema to maintain.

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
- **Backend** — Google Firebase: Firestore (document database), Firebase Auth (sessions), Firebase Storage (media)
- **Media** — Client-side image compression, stored in Firebase Storage (or configurable object storage — Cloudflare R2 / Cloudinary)
- **Deployment** — Static frontend (Vercel-ready); Firebase is fully managed, no backend to deploy or maintain

## Getting started

**Prerequisites:** Node.js 18+, a Firebase project (Firestore + Auth + Storage enabled)

```bash
# 1. Install dependencies
npm install

# 2. Configure the frontend
cp .env.example .env.local                   # fill in your Firebase project config

# 3. Run the app
npm run dev
```

Visit `http://localhost:5173` and log in with an account created through Firebase Auth / User Management.

## Project structure

```
src/
  components/          Layout, Sidebar, Topbar, notifications, media viewer, print templates
  components/modals/   One modal per business entity — the primary data-entry surface
  contexts/            Auth, real-time data sync, notifications
  firebase.js          Firebase app initialization (Firestore, Auth, Storage)
  pages/               One page per pipeline stage / module
  services/            Generic CRUD (Firestore), ID generation, notification dispatch
  utils/               Calculations (EMI, GST, negotiation), formatting, cross-collection auto-fill
```

## Roadmap

- Harden Firestore security rules and access control as the system grows
- Extend the pipeline model to support additional branches/entities under the Carecay umbrella
