# Contributing to Naming Nosferatu

Thank you for your interest in contributing to **Naming Nosferatu**! We take craftsmanship, accessibility, and zero-defect runtime performance seriously.

This guide outlines our architecture, conventions, and quality gates to ensure a smooth development workflow.

---

## 🏗️ Architecture Overview

Naming Nosferatu follows a **feature-driven modular architecture** structured into four distinct layers:

```
src/
├── app/          # Bootstrap, global routes (HomeRoute, AdminRoute), providers, and root layout
├── features/     # Encapsulated domain modules (tournament/, dashboard/)
├── shared/       # Reusable UI primitives, hooks, storage adapters, constants, and utilities
└── store/        # Unified Zustand store, persistent state slices, and atomic selector hooks
```

### Key Architectural Guidelines
1. **Encapsulation**: Place domain-specific logic, bracket visualizers, and state actions inside `src/features/<feature-name>/`.
2. **Atomic Zustand Selectors**: Always export and consume granular selector hooks (e.g. `useTournament()`, `useUser()`, `useSiteSettings()`) rather than subscribing to the root store object. This avoids unnecessary component re-renders.
3. **Offline-First Persistence**: All local updates must gracefully pass through `src/shared/lib/storage.ts` using AES encryption, memory fallback, and quota handling. Never assume external services (e.g., Supabase) are reachable.

---

## 🛠️ Prerequisites & Setup

- **Node.js**: `24.x` (managed via `.nvmrc`)
- **Package Manager**: `pnpm 10.27.0` (pinned in `package.json`)

```bash
# Clone the repository
git clone https://github.com/guitarbeat/Naming-Nosferatu.git
cd Naming-Nosferatu

# Use the active LTS Node version
nvm use

# Install dependencies with frozen lockfile
pnpm install

# Start local dev server (http://localhost:3000)
pnpm dev
```

---

## 📜 Development Scripts

All core commands run through `pnpm`:

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Dev Server** | `pnpm dev` | Starts Vite dev server on port 3000 |
| **Run Tests** | `pnpm test` | Runs the Vitest test suite |
| **Type Check** | `pnpm run lint:types` | Runs `tsc --noEmit` |
| **Lint & Format Check** | `pnpm run lint` | Runs Biome checks and TypeScript verification |
| **Auto-Fix Formatting** | `pnpm run fix` | Auto-formats code and organizes imports with Biome |
| **Check Dependencies** | `pnpm run check:deps` | Runs Knip to identify unused exports or dependencies |
| **Production Build** | `pnpm run build` | Builds bundled assets and service worker to `/dist` |

---

## 🎨 Code Style & Quality Standards

### 1. Biome & TypeScript
- We use **Biome** for lightning-fast formatting and linting.
- **Tabs** for indentation, **double quotes** (`"`), and explicit curly braces for all control blocks.
- **Zero Errors / Zero Warnings**: PRs must pass `pnpm run lint` and `pnpm run check:deps` cleanly before review.

### 2. Accessibility (a11y)
- Support **prefers-reduced-motion** in all Framer Motion and Three.js/OGL visualizers.
- Provide accessible names (`aria-label`, `title`) and keyboard activation (`onKeyDown` handling `Enter` and `Space`) on all custom interactive elements.
- Maintain WCAG AA contrast (≥ 4.5:1 for body text) across both Light and Dark themes.

### 3. State & React Hooks
- Keep React dependency arrays exhaustive and reference stable primitive identifiers or memoized values.
- Never trigger state mutations inside render passes.

---

## 🚀 Submitting a Pull Request

1. **Create a branch**: `git checkout -b feature/my-new-feature`
2. **Make your changes** following the feature architecture.
3. **Run local verification**:
   ```bash
   pnpm run fix
   pnpm run lint
   pnpm run check:deps
   pnpm test
   pnpm run build
   ```
4. **Push and open a PR** using the provided Pull Request template.
