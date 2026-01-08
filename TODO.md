# Repository Consolidation & Optimization Opportunities

This document tracks potential areas for code consolidation and simplification to improve maintainability without feature loss.

## High Priority: Regressions & Cleanup
- [x] **Verify Auth Logic**: Moved `src/shared/utils/auth.ts` to `src/features/auth/utils/authUtils.ts`. No conflicts found.
- [x] **Remove deprecated shims**: Removed `src/shared/components/CommonUI.tsx` and updated all consumers to import directly from component directories.

## Component Consolidation
- [x] **Button Unification**:
    - Simplified `TournamentButton` by using standard `Plus` icon from `lucide-react` and removing redundant SVG code.

- [x] **Header vs Navbar**:
    - **Analysis Complete:** `CollapsibleHeader` and `AppNavbar` are distinct components serving different purposes. `CollapsibleHeader` is a section header for collapsible content panels used in analytics and results views. Appropriately located in `shared/components` as it's used by multiple features. No changes needed.
- [x] **AppNavbar Simplification**:
    - Completed navigation consolidation by removing redundant `navbarCore.tsx` (243 lines). AppNavbar components now import from `src/shared/navigation` module. Reduced from 12 to 11 files.

## Style Consolidation
- [x] **CSS Strategy**:
    - **Analysis Complete:** Mixed CSS Modules + Global CSS approach is intentional and well-architected. CSS Modules used for component scoping, Global CSS for layout/utilities. No style leakage or bundle size issues identified.
    - **Recommendation:** Keep current approach.
- [x] **Design Tokens**:
    - **Status Complete:** Already centralized in `design-tokens.css` and `colors.css`. Comprehensive coverage of spacing, typography, colors, shadows, transitions. Consistently used throughout codebase.

## Feature Logic
- [x] **Tournament Logic**:
    - **Completed:** Migrated `tournamentsAPI` to `src/features/tournament/services/tournamentService.ts`.
    - **DRY Refactor:** Implemented `withSupabase` helper in `client.ts` and refactored all service modules to use it, reducing boilerplate and centralizing error handling/availability checks.


## General
- [x] **Type definitions**:
    - **DRY Violations Found:**
      - ~~**CRITICAL:** Three different `TournamentState` interfaces~~ **FIXED:** Renamed to `TournamentUIState` in components.ts
      - ~~**MODERATE:** `TournamentName` (store.ts) is a subset of `NameItem` (components.ts) - redundant type~~ **FIXED:** Replaced with `NameItem`
    - **Completed:**
      - ✅ Renamed `TournamentState` → `TournamentUIState` in types/components.ts
      - ✅ Updated 3 references in core/hooks/tournamentHooks.ts
      - ✅ Removed duplicate from ViewRouter.tsx
      - ✅ Replaced `TournamentName` with `NameItem` throughout codebase
        - Removed redundant `TournamentName` interface from types/store.ts
        - Updated all type references in store.ts (3 locations)
        - Updated imports and types in ViewRouter.tsx
        - Verified with type checking and test suite (22 tests passed)


