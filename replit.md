# Name Nosferatu

A full-stack cat-name tournament app with React + Vite frontend and Express backend.

## Overview
- Purpose: Run name tournaments, collect ratings, and surface analytics.
- Frontend: React 19, Vite 7, TypeScript, Tailwind CSS, Zustand, TanStack Query.
- Backend: Express + Drizzle ORM + Supabase/Postgres.
- Tests: Vitest + React Testing Library + Supertest.

## Current Project Structure
```text
src/
  app/            # app shell, providers, bootstrap
  features/       # tournament, analytics, admin
  shared/         # reusable UI, hooks, libs, styles
  store/          # Zustand state slices and composition
  integrations/   # external integration types/adapters
server/           # Express API + validation + auth
scripts/          # tooling and maintenance scripts
public/           # static assets
docs/             # project documentation
```

## Development
Use `pnpm` (not npm) in this repo.

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm build
```

## Environment Variables
Required for full functionality:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `ADMIN_API_KEY`

## Runtime Ports
- Frontend dev server: `5000`
- Backend API server: `3001`

## Notes
- Architecture checks run via `pnpm run check:arch`.
- Dependency hygiene runs via `pnpm run check:deps`.
- Main branch is the deployment source.
