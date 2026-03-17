---
description: Plan for refactoring and consolidating the codebase to improve maintainability and performance.
---

# Refactoring & Consolidation Plan

## Objective

Streamline the project structure by consolidating utility files, removing unused code, and flattening nested "core" directories. Ensure no regressions by running tests and linting at each step.

## Completed Tasks

- [x] Consolidate `src/shared/utils/tournamentUtils.ts` into `src/features/tournament/tournamentUtils.ts`.
- [x] Consolidate `src/shared/utils/core/tournament.ts` into `src/features/tournament/tournamentUtils.ts`.
- [x] Merge `src/shared/utils/tournamentUtils.test.ts` into `src/features/tournament/tournamentUtils.test.ts`.
- [x] Fix module imports in `src/core/hooks/tournamentHooks.ts`, `PersonalResults.tsx`, and `useBracketTransformation.ts`.
- [x] Resolve linting issues in `src/features/tournament/tournamentUtils.ts` (added `NameItem` import).
- [x] Remove unused `src/shared/utils/core/tournament.ts` and `src/shared/utils/tournamentUtils.js`.

## Active Tasks

- [ ] Flatten `src/shared/utils/core/` directory:
  - [ ] Move `auth.ts` to `src/features/auth/utils/authUtils.ts` (if feature exists) or `src/shared/utils/auth.ts`.
  - [ ] Move `ui.ts` to `src/shared/utils/ui.ts`.
  - [ ] Move `export.ts` to `src/shared/utils/export.ts`.
  - [ ] Move `metrics.ts` to `src/shared/utils/metrics.ts`.
  - [ ] Move `performance.ts` to `src/shared/utils/performance.ts`.
  - [ ] Move `validation.ts` to `src/shared/utils/validation.ts`.
  - [ ] Move `name.ts` to `src/shared/utils/names.ts`.
  - [ ] Update `src/shared/utils/index.ts` to re-export from the new flat locations.
  - [ ] Delete `src/shared/utils/core/` directory.
- [ ] Update all imports referencing `src/shared/utils/core/*` to point to the new locations.
- [ ] run `pnpm run lint` and `pnpm run lint:types` after each significant move.

## Future Tasks

- [ ] Identify and remove any other unused "core" buckets.
- [ ] Standardize naming conventions (e.g., `*Utils.ts` suffix vs plain nouns).
- [ ] Ensure all new utility files have corresponding tests (consolidate tests from `src/shared/utils/core/*.test.ts`).

## Notes

- Be careful with circular dependencies when moving files.
- Always check for grep results before moving to ensure all references are caught.
