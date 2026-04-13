# Naming Nosferatu — Cat Name Tournament

A React + Vite application for running cat name tournaments with ELO-based ratings. Users pick their favourite cat names through head-to-head matchups; results are stored in Supabase.

## Architecture

- **Frontend**: React 19 + TypeScript, Vite 7, TailwindCSS 4, HeroUI component library
- **Backend**: Supabase (PostgreSQL + RPCs). No custom Express server — all data access goes through Supabase JS client calling database functions.
- **State**: Zustand stores + TanStack Query for server state
- **Routing**: React Router v7
- **Build tool**: Vite with config at `config/vite.config.ts`

## Key Directories

```
src/
  app/           # Root app shell, providers, router
  features/      # Feature modules (names, tournament, admin, analytics…)
  shared/        # Shared utilities, hooks, services
    services/supabase/
      runtime.ts        # Supabase client singleton, withSupabase/withSupabaseOrThrow helpers
      ratingService.ts  # apply_tournament_match_elo + save_user_ratings RPCs
      statsService.ts   # Site/leaderboard stats RPCs
      authAdapter.ts    # Auth integration
  integrations/supabase/
    types.ts            # Auto-generated Supabase DB types
config/
  vite.config.ts        # Vite config (port 5000 for Replit)
  tsconfig.json
supabase/
  migrations/           # Full DB schema and incremental migrations
```

## Environment Variables

Set these in Replit Secrets for Supabase connectivity:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key |

## Running the App

The **Start application** workflow runs:
```
pnpm install --frozen-lockfile && pnpm exec vite --config config/vite.config.ts --port 5000 --host 0.0.0.0
```

## Deployment

Configured for Replit autoscale deployment. Build command: `npm run build`. Run command: `node ./dist/index.cjs`.

## Notable Migrations (Supabase)

- Tables were renamed: `cat_name_options` → `cat_names`, `cat_name_ratings` → `user_cat_name_ratings`
- `cat_tournament_selections` was dropped; global win/loss counters are now on `cat_names`
- Key RPCs: `apply_tournament_match_elo`, `save_user_ratings`, `get_leaderboard_stats`, `get_site_stats`, `add_cat_name`, `soft_delete_cat_name`

## Bug Fixes Applied

- **Win/Loss stats always zero**: `tournament.voteHistory` in the global store was never populated. Added `recordVote` and `clearVoteHistory` actions to `tournamentSlice`, called from `useTournamentState.handleVote` and `handleQuit`.
- **2v2 win/loss attribution**: Added `winnerMemberIds`/`loserMemberIds` to vote records so `TournamentFlow` can expand team votes to individual name wins/losses correctly.
- **Null crash on 2v2 `memberNames`**: Added optional-chaining fallback in `Tournament.tsx` `handleVoteAdapter` so missing `memberNames` doesn't throw.
- **Stuck tournament on corrupt history**: `deriveBracketState` in `tournamentLogic.ts` now skips invalid history records (where winner doesn't match either side) instead of looping forever, and clears the stale cache entry.
