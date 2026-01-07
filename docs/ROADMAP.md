# Roadmap & Known Issues

## Application Roadmap

### ✅ Completed Milestones
- **Pass 1: "Stop the Bleeding"**: Removed orphaned CSS, consolidated types, decomposed `CommonUI`.
- **Pass 2: "Split Violations"**: Split `nameManagementCore.tsx` and `useAppStore.ts`. Decoupled `TournamentSetup.module.css`. enforced file limits.
- **Pass 3: "Linting & Tooling"**: Migrated CI to `pnpm` and integrated `check:limits` and `lint` into the workflow.
- **Pass 4: "Documentation"**: Standardized feature development workflows in `DEVELOPMENT.md` (consolidated workflow guides).
- **Pass 5: "Tournament Refactoring"**: Refactored `TournamentUI.tsx` to use HeroUI/Tailwind, extracted `useTournamentVote` hook, optimized undo timer, added framer-motion animations, improved type safety with `BracketMatch` interface, and unified design system.
- **Pass 6: "Code Quality Improvements"**: 
  - Fixed all TODO comments (admin status check, tournament fetching, type consolidation)
  - Reduced `Tournament.tsx` from 516 to 419 lines via component/hook extraction
  - Split `AnalysisUI.module.css` (793 lines) into 6 component-specific modules (all under 500 lines)
  - Extracted `UndoBanner`, `TournamentErrorState`, `TournamentLoadingState` components
  - Created `useUndoWindow` and `useBracketTransformation` hooks
- **Pass 7: "Documentation Consolidation"**:
  - Consolidated 29 documentation files into 16 active files (45% reduction)
  - Created single sources of truth: `STYLING_GUIDE.md`, `LEGACY_MIGRATION.md`, `USABILITY_GUIDE.md`, `BUGS.md`
  - Applied DRY principles to eliminate redundant documentation
  - Updated all cross-references and navigation
- **Pass 8: "Tournament.tsx Refactoring"**:
  - Reduced `Tournament.tsx` from 419 to 330 lines (under 400-line limit)
  - Extracted interfaces (`VoteData`, `TournamentProps`) to `types/components.ts`
  - Created `useTournamentHandlers` hook for all event handlers
  - Created `debugLogging` utility for throttled development logging
- **Pass 9: "File Size Compliance & Bug Fixes"**:
  - Fixed critical bug: Created missing `AnalysisBulkActions` component
  - Fixed error handling inconsistency in `handleBulkUnhide`
  - Fixed code style issues (`React.useEffect` → `useEffect`, unused imports)
  - Split `analysis-mode.css` (1287 lines) into 5 files (all under 750-line limit)
  - All files now comply with size limits

### 🔮 Future Goals
- **Testing Coverage**: Expand Vitest coverage beyond minimal setup.
- **Performance Optimization**: Review and optimize bundle size, lazy loading opportunities, and render performance.

## Known Technical Debt

| Item | Severity | Status | Notes |
|------|----------|--------|-------|
| `Tournament.tsx` | Low | ✅ Resolved | Reduced from 516 to 330 lines (under 400-line limit). Extracted handlers and interfaces. |
| Test Coverage | Low | Pending | Core logic needs unit tests. |

## Risks
- **CSS Specificity**: Legacy CSS might conflict with new module extractions if not carefully scoped.
- **State Complexity**: `useAppStore` is large; creating more slices is recommended if it grows.
