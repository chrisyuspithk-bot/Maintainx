# Maintainx

Maintainx is a small full-stack example project composed of a backend (Drizzle + TypeScript) and a frontend (Vite + React/TypeScript).

Status: work-in-progress — useful as a developer sandbox and reference for Drizzle-based projects.

Contents
- Backend: `spit-maintainx-clean/` — API, database schema, and migration scripts.
- Frontend: `spit-maintainx-frontend/` — Vite + React UI.

Quick start

Prerequisites
- Node.js (v18+ recommended)
- A package manager: `pnpm`, `npm`, or `yarn`
- (Optional) Docker or a local database if you want to run the DB outside the project container

Backend (development)

1. Change to the backend folder and install dependencies:

```bash
cd spit-maintainx-clean
pnpm install
```

2. Run the dev server (check `package.json` scripts if `dev` differs):

```bash
pnpm run dev
```

3. Migrations and DB

- The project uses Drizzle ORM with SQL migration files located at `drizzle/migrations/`.
- See `drizzle.config.ts` for database configuration.
- There is a `scripts/seed.ts` file for seeding example data.

Frontend (development)

1. Change to the frontend folder and install dependencies:

```bash
cd spit-maintainx-frontend
pnpm install
```

2. Start the Vite dev server:

```bash
pnpm run dev
```

Project structure (high level)

- `spit-maintainx-clean/`
	- `src/` — backend source code and services
	- `drizzle/` — Drizzle schema and migrations
	- `scripts/seed.ts` — seed script for sample data
- `spit-maintainx-frontend/`
	- `src/` — React app
	- `public/` — static assets

Notes & next steps
- If you want, I can:
	- Edit this README further to add badges, required environment variables, and example requests.
	- Update or create READMEs inside the backend and frontend folders with project-specific commands.

Contributing

Contributions and improvements are welcome — open a PR or create an issue describing the change.

License

Specify your license here (e.g., MIT). If you already have a license file, link to it.

