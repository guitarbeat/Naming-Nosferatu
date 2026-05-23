# Contributing

Thank you for your interest in contributing to **Naming Nosferatu**! Here's how to get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the dev server:
   ```bash
   pnpm dev
   ```
4. Create a feature branch from `main`

## Tech Stack

- **React 19** + **TypeScript** — UI and type safety
- **Vite 7** — Build tooling
- **Tailwind CSS 4** — Styling
- **Supabase** — Backend services
- **pnpm** — Package manager (workspace enabled)

## Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting, with [Lefthook](https://github.com/evilmartians/lefthook) enforcing checks via git hooks.

- Run lint and format checks locally:
  ```bash
  pnpm biome check .
  ```
- Auto-fix issues:
  ```bash
  pnpm biome check --fix .
  ```
- All PRs must pass CI checks before merging

## Pull Request Process

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes and commit with clear messages
3. Push and open a PR against `main`
4. Ensure CI passes
5. Request review

## Commit Messages

Use clear, descriptive commit messages:

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `chore: maintenance task`
