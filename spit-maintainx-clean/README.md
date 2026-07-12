# spit-maintainx-clean (Backend)

This folder contains the backend API, database schema, and migration scripts for Maintainx.

Quick commands

Install dependencies:

```bash
cd spit-maintainx-clean
pnpm install
```

Run development server:

```bash
pnpm run dev
```

Database & migrations

- Drizzle config: `drizzle.config.ts`
- Migrations: `drizzle/migrations/`
- Seed script: `scripts/seed.ts`

Useful notes

- Edit environment variables or database connection in `drizzle.config.ts`.
- Run migrations with your preferred Drizzle/CLI workflow.
# SPIT MaintainX — Phase 1 + Phase 2 (Cleaned)
## Suppliers • Parts • Inventory Ledger • Requisitions • Purchase Orders + 1-Level Approval

**Status:** Phase 1 + Phase 2 — Cleaned up version (status consistency fixed + PO read endpoints added)

This is the first deliverable based on the full architect prompt.

### What’s included in Phase 1
- Complete Drizzle schema (Suppliers, Parts, Stock Locations, Inventory Transactions + current stock levels, Requisitions, POs)
- Strong emphasis on **immutable inventory ledger** + transactional stock updates
- Core services with proper database transactions
- Hono + Cloudflare Workers API (REST style, easy to evolve to tRPC later)
- Zod validation
- Seed script with realistic demo data
- Basic but production-minded patterns

### Tech Stack (Phase 1)
- Cloudflare Workers (TypeScript)
- Hono
- Drizzle ORM + Neon Postgres
- Zod
- Wrangler

---

## Quick Start (Local Development)

### 1. Prerequisites
- A Neon Postgres database (free tier is fine)
- Node.js 20+
- Wrangler CLI (`npm install -g wrangler`)

### 2. Setup

```bash
cd spit-maintainx-phase1

# Install dependencies
npm install

# Copy environment template
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and put your Neon connection string:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Run Database Migrations

```bash
npm run db:generate
npm run db:migrate
```

### 4. Seed Demo Data

```bash
npm run db:seed
```

### 5. Start Local Worker

```bash
npm run dev
```

API will be available at `http://localhost:8787`

---

## Key API Endpoints (Phase 1)

### Suppliers
- `GET /api/suppliers`
- `POST /api/suppliers`
- `GET /api/suppliers/:id`

### Parts
- `GET /api/parts`
- `POST /api/parts`
- `GET /api/parts/:id`

### Stock Locations
- `GET /api/locations`

### Inventory
- `GET /api/inventory` (current stock levels)
- `GET /api/inventory/transactions` (ledger)

### Requisitions
- `POST /api/requisitions` (create with items)
- `GET /api/requisitions/:id`

### Purchase Orders
- `POST /api/pos` (create from requisition or directly)
- `POST /api/pos/:id/receive` (goods receipt — this updates stock transactionally)
- `GET /api/pos/:id`

---

## Important Design Decisions (Phase 1)

1. **Inventory is append-only ledger first**
   - Every stock movement creates a row in `inventory_transactions`
   - `stock_levels` table is maintained for fast current quantity queries (updated in same transaction)

2. **No approvals in Phase 1**
   - Requisitions and POs can be created freely
   - Approval engine comes in Phase 2

3. **Created by is simple string for now**
   - Later we will add proper users + sessions

4. **Strong focus on data integrity**
   - All stock changes go through `InventoryService` with `db.transaction()`

---

## Next Phases (from the full prompt)

- **Phase 2**: Generic Approval Engine + Notifications
- **Phase 3**: Projects + full PO lifecycle + better dashboards
- **Phase 4**: Assets + Parts Breakdown Structure + Work Orders + consumption logging

---

## Frontend (Phase 4 Complete)

A modern React + Vite + Tailwind SPA has been added at `../spit-maintainx-frontend/`.

### Features
- **Dashboard** with KPI cards and quick actions
- **Suppliers, Parts, Inventory** management with create forms and stock receive
- **Purchase Orders** full lifecycle: create with line items, list, view, status badges, goods receipt
- **Approvals** queue with one-click approve/reject + comment
- **Projects** with summary (PO count, committed value, status breakdown)
- **Maintenance Module** (Contracts, Breakdown Logs, Work Orders, Job Sheets) with cross-linked create flows
- Responsive, professional UI with modals, toasts, loading states, and status color coding
- Works against the Hono API (configure `VITE_API_URL`)

### Run Frontend
```bash
cd spit-maintainx-frontend
npm run dev
```

Set `VITE_API_URL=http://localhost:8787` in `.env.local` (or use default) when backend runs on `wrangler dev`.

The frontend uses Tailwind Play CDN for zero-config beautiful styling + React for rich interactions.

---

## API Additions (for Frontend)
- `GET /api/locations` + `POST /api/locations` (stock locations for receive goods)

---

## Want me to continue?

Just say:
- “Improve dashboard with charts”
- “Add user auth / sessions”
- “Add Requisitions full flow”
- “Deploy to Cloudflare Pages + Workers”
- Or give feedback

This is now a complete, usable internal tool for SPIT maintenance & procurement operations.