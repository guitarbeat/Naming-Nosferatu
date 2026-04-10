# Name Nosferatu - Cat Name Tournament

A React + Vite SPA for running tournaments to rank cat names using an Elo rating system. Users vote on names in a bracket-style tournament, suggest new names, and view analytics/leaderboards.

## Architecture

- **Frontend**: React 19 + Vite (port 5000), TypeScript, Tailwind CSS v4, Framer Motion
- **Database/Backend**: Supabase (PostgreSQL, Auth, RPCs) — anon key used directly from the frontend
- **State**: Zustand (global), TanStack Query (server state)
- **UI**: @heroui/react components, lucide-react icons
- **Analytics/Math**: `simple-statistics` for ELO percentile rank, std dev, z-scores (`src/shared/lib/ratingStats.ts`)
- **Date Math**: `date-fns` for clean relative date calculations in analytics (subDays, subWeeks, etc.)
- **Fuzzy Search**: `fuse.js` via `useFuzzySearch` hook (`src/shared/hooks/useFuzzySearch.ts`) — used in AdvancedNameFilter and hidden names panel

## Running the App

```bash
pnpm run dev
```

Starts the Vite dev server on port 5000.

## Key Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Start Vite dev server (port 5000) |
| `pnpm run build` | Production build |
| `pnpm run lint` | Run linting |
| `pnpm run test` | Run tests |

## Project Structure

```
src/
  app/           # Entry point, providers, routing
  features/      # Feature modules (tournament, analytics, admin, names)
  shared/        # Reusable UI + utilities
  services/      # Auth adapters (Supabase auth + username-based)
  store/         # Zustand global store
  integrations/  # Auto-generated Supabase types + client
  styles/        # Global CSS
config/          # Vite, Biome, TypeScript, vitest configs
scripts/         # Vite console forward plugin, maintenance scripts
supabase/        # Database migrations (SQL)
```

## Database (Supabase)

Tables managed via Supabase (see `supabase/migrations/`):
- `cat_names` — Cat name options with Elo ratings, hidden/locked/deleted flags
- `cat_app_users` — User accounts (username-based)
- `user_cat_name_ratings` — Per-user Elo ratings for each name
- `cat_user_roles` — User role assignments (admin, moderator, user)
- `cat_audit_log` — Audit trail

Key RPCs: `apply_tournament_match_elo`, `save_user_ratings`, `get_leaderboard_stats`, `get_site_stats`, `add_cat_name`, `soft_delete_cat_name`

## Environment Variables

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase public anon key (safe to use in frontend)

## Authentication

- Username-based auth stored in localStorage (primary — no account needed)
- Optional Supabase Auth for admin users (`/admin` route)
- Admin status determined by `cat_user_roles` table in Supabase

## Notes

- This is a pure frontend SPA — all data operations go through Supabase RPCs
- The app works in "demo mode" if Supabase is unavailable (graceful fallbacks)
- Supabase anon key is a public key — safe to expose in frontend code
- Layout sizing is centralized in `src/styles/tokens.css` and consumed by `layout.css`: navbar safe area, app bottom padding, section spacing, hero height, and analytics chart heights should be changed through those tokens rather than hardcoded Tailwind sizes.
