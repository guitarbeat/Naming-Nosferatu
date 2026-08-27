# AGENTS.md

## Cursor Cloud specific instructions

### Runtime requirements

- **Node.js 24.x** — selected via `.nvmrc` and `engines` in `package.json`. Run `nvm install` and `nvm use` so local and CI builds match Vercel's active-LTS runtime.
- **pnpm 10.27.0** — pinned via `packageManager` in `package.json`. Install it with Corepack or `npm install -g pnpm@10.27.0` under Node 24.

### Key commands

All commands use `pnpm` from the project root:

| Action | Command |
|--------|---------|
| Install deps | `pnpm install` |
| Dev server (port 5000) | `pnpm dev` |
| Run tests | `pnpm test` |
| Lint (maintenance + biome + tsc) | `pnpm run lint` |
| Build | `pnpm run build` |
| Auto-fix formatting | `pnpm run fix` |

### Environment variables

Copy `config/.env.example` to `.env` at the project root. The app gracefully degrades when Supabase credentials are empty (runs in offline mode), so the dev server and tests work without them. Full E2E features (tournament voting, auth, leaderboard data) require valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Gotchas

- The `pnpm run lint` command (`lint:full` step) currently reports 2 pre-existing Biome formatting errors in `dynamic-island-nav.tsx` and one tournament file. These do not block `lint:types` or tests.
- Vite config is at `config/vite.config.ts` (not root). All config lives under `config/`.
- The dev server binds to `0.0.0.0:5000` with `strictPort: false`, so it may pick a different port if 5000 is occupied.
- Tests use jsdom environment and run via Vitest (`config/vitest.config.ts`).
- There are no git hooks, Makefiles, or devcontainer configs — just `pnpm install` and go.
