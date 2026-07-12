# SPIT MaintainX — Agent Context

## Repo Structure

```
spit-maintainx-clean/     # Backend: Hono on Cloudflare Workers + Neon (Drizzle ORM)
spit-maintainx-frontend/  # Frontend: Vite + React 19 + TypeScript + Tailwind CSS v4
wrangler.jsonc            # Cloudflare Workers config (assets → frontend/dist)
```

## Backend (`spit-maintainx-clean/`)

- **Stack**: Hono, Drizzle ORM, Neon Serverless Postgres, Cloudflare Workers
- **Dev**: `npx wrangler dev` (serves on `:8787`)
- **Deploy**: `npx wrangler deploy` (from repo root; see `wrangler.jsonc`)

## Frontend (`spit-maintainx-frontend/`)

- **Stack**: Vite 8, React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), React Router 7
- **Dev**: `npm run dev` → Vite on `:5173` with `/api` proxy → backend `:8787`
- **Type-check**: `npx tsc -b --noEmit`
- **Build**: `npm run build` → outputs to `dist/`
- **Deploy**: Build first, then `npx wrangler deploy` from repo root serves `dist/`

## Architecture (Frontend)

```
src/
  types/index.ts           # All TypeScript interfaces
  api/client.ts             # API_BASE, CURRENT_USER, callApi<T>()
  hooks/useData.ts          # Data hooks (useSuppliers, useParts, useStockLevels, etc.) + useToast
  components/
    Layout.tsx              # Header + NavLink sidebar, wraps all routes via <Outlet />
    ui/                     # Reusable: Modal, StatusBadge, PriorityBadge, Toast, EmptyState
    modals/                 # Form modals: CreateSupplier, CreatePart, CreatePO, ReceiveGoods, etc.
  App.tsx                   # BrowserRouter + 9 routes + page sub-components + top-level modals/toasts
```

### Data Flow
`AppContent` → `hooks/useData.ts` hooks → `api/client.ts` → `callApi<T>(path)` → backend (`VITE_API_URL` or `/api` proxy)

### Routing (9 routes)
`/` Dashboard · `/suppliers` · `/parts` · `/inventory` · `/pos` + `/pos/:id` · `/approvals` · `/projects` + `/projects/:id` · `/maintenance`

### Key Patterns
- Page sub-components live at the bottom of `App.tsx` as named functions (Dashboard, SuppliersView, POListView, etc.)
- Modals and Toasts render above `<Routes>` so they persist across navigation
- Lazy data loading uses `useLocation().pathname` in a `useEffect` to fetch data when navigating
- All forms use `addToast(msg, 'error'|'success')` for feedback
