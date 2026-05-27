# AGENTS.md

## Cursor Cloud specific instructions

### Runtime requirements

- **Node.js 20.19.6** — pinned via `.nvmrc` and `engines` in `package.json`. The nvm-installed binary at `/home/ubuntu/.nvm/versions/node/v20.19.6/bin` must be first in PATH (the default `/exec-daemon/node` is v22 which is too new for pnpm 10.27.x).
- **pnpm 10.27.0** — installed via `npm install -g pnpm@10.27.0` under the Node 20 prefix. Latest pnpm (v11+) requires Node 22+ and will not work.

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
