# Codebase Reduction Report

This report summarizes actionable ideas to reduce codebase size, complexity, and dependencies, based on analysis using `knip`, `tsr`, `jscpd`, and `ts-prune`.

## 1. Unused Dependencies

The following dependencies appear to be unused and should be considered for removal to reduce bundle size and install time.

### Dependencies
- **`react-responsive-masonry`**: Verified unused in `src` and `config`.
  - *Action*: `npm uninstall react-responsive-masonry`

### DevDependencies
- **`@testing-library/react`**
- **`@testing-library/jest-dom`**
- **`@testing-library/user-event`**
  - *Context*: The `test` directory contains documentation, and `src` lacks test setup files. If no tests are currently implemented, these libraries are dead weight.
  - *Action*: `npm uninstall @testing-library/react @testing-library/jest-dom @testing-library/user-event`

## 2. Dead Code & Unused Exports

Several files contain exports that are never imported elsewhere in the codebase.

### **Major Cleanup Candidate: `errorManager`**
File: `src/shared/services/errorManager/index.ts`
- **Status**: This file seems to be a large utility module where almost ALL exports are unused.
- **Unused Exports**: `getGlobalScope`, `createHash`, `ERROR_TYPES`, `RETRY_CONFIG`, `generateErrorId`, `parseError`, `determineSeverity`, `getUserFriendlyMessage`, `isRetryable`, `CircuitBreaker`, `withRetry`, `createResilientFunction`, and more.
- *Action*: Review if this module is a "planned feature" or legacy code. If not needed, **delete the entire file** or remove the unused exports.

### Specific Unused Exports
| File | Symbol | Action |
|------|--------|--------|
| `src/features/tournament/components/AnalysisWrappers.tsx` | `AnalysisDashboardWrapper` | Remove export or component |
| `src/features/tournament/components/TournamentSidebar/PhotoComponents.tsx` | `default` | Switch to named export or remove |
| `src/shared/components/AnalysisPanel/components/AnalysisComponents.tsx` | `AnalysisBadge` | Remove component |
| `src/shared/utils/coreUtils.ts` | `generatePairs` | Remove function |
| `src/features/profile/hooks/useProfile.ts` | `UserStats`, `SelectionStats`, `UserWithRoles` (Interfaces) | Remove unused types |

## 3. Code Duplication
- **Tool**: `jscpd`
- **Result**: **0 Duplicates Found**.
- *Status*: The codebase is clean of significant copy-pasted code blocks (based on default settings of min 5 lines / 50 tokens).

## 4. Configuration Cleanup
- **`vite.config.ts`**: Flagged by `tsr` as unused, but this is the build config.
  - *Action*: Ignore this, it is essential.
- **`knip.json`**: You may want to untrack `vite`, `vitest`, `eslint`, etc. in `ignoreDependencies` to verify they are actually used (they likely are), but keeping them ignored avoids noise.
- **`package.json` vs usage**: Use `npm run check:deps` regularly to keep dependencies clean.

## 5. Summary of Actionable Steps
1. Run: `npm uninstall react-responsive-masonry @testing-library/react @testing-library/jest-dom @testing-library/user-event`
2. Delete usages of `@testing-library` in `package.json` scripts if any (none found in main scripts).
3. Delete or refactor `src/shared/services/errorManager/index.ts`.
4. Remove specific unused exports listed above.
