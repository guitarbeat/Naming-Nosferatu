# Name Nosferatu

A modern React application for discovering, ranking, and analyzing cat names through interactive tournament-style matchups, Elo rating calculations, and community analytics.

## Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite 7](https://vitejs.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://motion.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (UI state & local persistence), [TanStack Query](https://tanstack.com/query/latest) (Server state)
- **Backend (Optional)**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
- **Testing**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/)
- **Tooling**: [Biome](https://biomejs.dev/) (Linting & Formatting), [TypeScript](https://www.typescriptlang.org/), [pnpm](https://pnpm.io/)

## Quick Start

### Requirements
- **Node.js**: `24.x` (active LTS, via `.nvmrc` and `engines`)
- **pnpm**: `10.27.0` (pinned via `packageManager`)

### Setup & Commands

```bash
# 1. Clone & install
git clone https://github.com/guitarbeat/name-nosferatu.git
cd name-nosferatu
pnpm install

# 2. Configure environment (optional)
cp .env.example .env
```

The application operates in offline/local-storage mode when Supabase credentials are not provided. For full cloud synchronization, add your credentials to `.env`:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous public key

### Key Commands

| Command | Action |
|---------|--------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm test` | Run test suite with Vitest |
| `pnpm run test:watch` | Run tests in watch mode |
| `pnpm run test:coverage` | Generate test coverage report |
| `pnpm run lint` | Run Biome linter and TypeScript checks |
| `pnpm run fix` | Automatically fix formatting and import ordering |
| `pnpm run check:deps` | Analyze unused dependencies with Knip |
| `pnpm run build` | Build production bundle (`dist/`) |
| `pnpm run preview` | Preview production build locally |

## Project Structure

All configuration files are centralized in `config/` to keep the root directory clean:

```text
├── config/             # Build and tool configs (Vite, Biome, Vitest, Knip)
├── public/             # Static assets and web app manifest
├── src/                # Application source code
│   ├── app/            # Application bootstrap, routing, providers, and layout shell
│   ├── features/       # Feature modules: tournament/ and dashboard/
│   ├── shared/         # Reusable UI components, hooks, API client, and utilities
│   └── store/          # Zustand store and local storage persistence slices
├── .env.example        # Environment variable template
├── AGENTS.md           # Engineering guidelines and coding standards
└── index.html          # Application entry point
```

## Engineering Guidelines

Detailed code standards, architectural rules, TypeScript conventions, and agent instructions are documented in [AGENTS.md](./AGENTS.md).

## License

This project is licensed under the [MIT License](./LICENSE).

