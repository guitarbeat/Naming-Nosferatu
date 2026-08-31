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
| Dev server (port 3000) | `pnpm dev` |
| Run tests | `pnpm test` |
| Lint (biome + tsc) | `pnpm run lint` |
| Build | `pnpm run build` |
| Auto-fix formatting | `pnpm run fix` |

### Environment variables

Copy `config/.env.example` to `.env` at the project root. The app runs in local/offline mode without extra credentials. Optional `VITE_SENTRY_DSN` enables production error tracking.

### Gotchas

- Vite config is at `config/vite.config.ts` (not root). All config lives under `config/`.
- The dev server binds to `0.0.0.0:3000` with `strictPort: false`, so it may pick a different port if 3000 is occupied. Preview uses port 5000.
- Tests use jsdom environment and run via Vitest (`config/vitest.config.ts`).
- There are no git hooks, Makefiles, or devcontainer configs — just `pnpm install` and go.
