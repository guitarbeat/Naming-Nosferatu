# Name Nosferatu - Cat Name Tournament

A React + Express full-stack web application for running tournaments to rank cat names using an Elo rating system.

## Architecture

- **Frontend**: React 19 + Vite (port 5000), TypeScript, Tailwind CSS v4, Framer Motion
- **Backend**: Express 5 API server (port 3001), TypeScript with `tsx watch`
- **Database**: Replit PostgreSQL via Drizzle ORM
- **State**: Zustand (global), TanStack Query (server state)
- **UI**: @heroui/react components, lucide-react icons

## Running the App

Both servers start together via `pnpm run dev:full` (concurrently):
- Vite dev server → port 5000 (frontend, with proxy to /api → 3001)
- Express API server → port 3001

## Key Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev:full` | Start both servers concurrently |
| `pnpm run dev:server` | Express API server only |
| `pnpm run dev:client` | Vite frontend only |
| `pnpm run db:push` | Push Drizzle schema to database |
| `pnpm run db:seed` | Seed database with default cat names |
| `pnpm run build` | Production build |

## Database Schema (shared/schema.ts)

Tables (Drizzle ORM):
- `cat_names` — Cat name options with ratings, hidden/locked/deleted flags
- `cat_app_users` — User accounts (UUID primary key, userName unique)
- `user_cat_name_ratings` — Per-user Elo ratings for each name
- `cat_user_roles` — User role assignments (admin, moderator, user)
- `cat_audit_log` — Audit trail

## Project Structure

```
src/           # React frontend
  app/         # Entry points, providers
  features/    # Feature modules (tournament, analytics, admin)
  shared/      # Reusable UI + utilities
  services/    # Auth adapters
  store/       # Zustand stores
server/        # Express API
  index.ts     # Server entrypoint, CORS, rate limiting
  routes.ts    # All API routes
  db.ts        # Drizzle database connection
  auth.ts      # Admin API key middleware
  supabaseAuth.ts # Optional Supabase JWT auth middleware
shared/        # Shared between frontend and backend
  schema.ts    # Drizzle schema definitions
  fallbackNames.ts # Default cat names
config/        # Vite, Biome, TypeScript configs
scripts/       # Seed script, maintenance checks
```

## Environment Variables

- `DATABASE_URL` — Replit Postgres connection string (auto-set)
- `PORT` — Express server port (default 3001)
- `ADMIN_API_KEY` — Secret key for admin API routes
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Optional: Supabase for auth
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — Optional: Supabase server-side auth

## Authentication

- Admin operations use `x-admin-key` header (checked server-side with `ADMIN_API_KEY`)
- User auth: Supabase JWT if configured, otherwise localStorage username (demo mode)
- The app functions in demo mode without Supabase credentials

## Notes

- Supabase is optional — the app works fully without it using Replit Postgres + localStorage auth
- The server has graceful fallback to mock data if the database is unreachable
- `drizzle.config.ts` points to `shared/schema.ts` and uses `DATABASE_URL`
