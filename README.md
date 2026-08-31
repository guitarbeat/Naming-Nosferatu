# Name Nosferatu

A React application for discovering, voting on, and analyzing cat names with a tournament-style Elo system.

## Overview

Name Nosferatu lets you pick names in a tournament, review analytics, and manage the name pool from an admin view. Data and auth currently run in local/offline mode.

## Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite 7](https://vitejs.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (UI state), [TanStack Query](https://tanstack.com/query/latest) (server state)
- **Testing**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Tooling**: [Biome](https://biomejs.dev/) (linting and formatting), [TypeScript](https://www.typescriptlang.org/), [pnpm](https://pnpm.io/)

## Requirements

- **Node.js**: `24.x` (active LTS)
- **pnpm**: `10.27.0` (pinned by `packageManager`)

## Setup & Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/guitarbeat/Naming-Nosferatu.git
   cd Naming-Nosferatu
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables (optional):
   - Copy `config/.env.example` to `.env` in the root directory.
   - Set `VITE_SENTRY_DSN` if you want production error tracking.

## Running the App

### Development

Starts the Vite dev server on port `3000`.

```bash
pnpm dev
```

### Build & Preview

Builds the application for production and previews the build on port `5000`.

```bash
pnpm run build
pnpm run preview
```

## Testing

The project uses Vitest for unit and integration testing. Configuration is located in `config/vitest.config.ts`.

- **Run all tests**: `pnpm test`
- **Watch mode**: `pnpm run test:watch`
- **Coverage report**: `pnpm run test:coverage`

## Code Quality

- **Lint & Format**: `pnpm run lint` (Biome plus TypeScript)
- **Auto-fix**: `pnpm run fix` (fixes linting and formatting issues)
- **Dependency Audit**: `pnpm run check:deps` (Knip unused-dependency check)

## Project Structure

All configuration files are centralized in the `config/` directory to keep the root clean.

```text
├── config/             # Vite, Vitest, Biome, TypeScript, Knip
├── public/             # Static assets
├── src/                # Main application source
│   ├── app/            # App core, providers, and routes
│   ├── features/       # Feature modules (tournament, dashboard)
│   ├── shared/         # Reusable UI, hooks, and utilities
│   └── store/          # Zustand state management
└── index.html          # Application entry point
```

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.
