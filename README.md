# SPIT MaintainX

Full-stack maintenance management system — Hono + Drizzle + Cloudflare Workers backend, React + TypeScript + Tailwind frontend.

## Architecture

```
spit-maintainx-clean/     # Backend API (Hono on Cloudflare Workers, Drizzle + Neon Postgres)
spit-maintainx-frontend/  # Frontend SPA (Vite, React 19, TypeScript, Tailwind CSS v4, React Router)
wrangler.jsonc            # Cloudflare Workers deploy config
```

## Quick Start

**Prerequisites:** Node.js 18+

### 1. Backend

```bash
cd spit-maintainx-clean
npm install
npm run dev          # Hono dev server on http://localhost:8787
```

Database: Drizzle ORM with Neon Serverless Postgres. Migrations in `drizzle/`, config in `drizzle.config.ts`, seed data via `scripts/seed.ts`.

### 2. Frontend

```bash
cd spit-maintainx-frontend
npm install
npm run dev          # Vite dev server on http://localhost:5173
                     # /api requests proxy → localhost:8787
```

### 3. Deploy

```bash
cd spit-maintainx-frontend && npm run build    # outputs to dist/
cd .. && npx wrangler deploy                    # serves API + built frontend
```

## Frontend Features

- **9 routes**: Dashboard, Suppliers, Parts Catalog, Inventory, Purchase Orders (list + detail), Approvals Queue, Projects (list + detail), Maintenance (contracts / breakdowns / work orders)
- **8 modal forms**: Create Supplier, Part, PO, Receive Goods, Project, Maintenance Contract, Breakdown Log, Work Order, Job Sheet
- **Build-time Tailwind** via `@tailwindcss/vite` (no CDN)
- **Component tree**: `Layout` (header + NavLink sidebar) → route pages → reusable UI primitives (Modal, StatusBadge, Toast, EmptyState)

## Commands

| Layer | Type-check | Dev Server | Build |
|---|---|---|---|
| Backend | `npx tsc --noEmit` | `npm run dev` | `npx wrangler deploy` |
| Frontend | `npx tsc -b --noEmit` | `npm run dev` | `npm run build` |

