# Repository Consolidation & Optimization Opportunities

This document tracks potential areas for code consolidation and simplification to improve maintainability without feature loss.

## High Priority: Regressions & Cleanup
- [x] **Verify Auth Logic**: Moved `src/shared/utils/auth.ts` to `src/features/auth/utils/authUtils.ts`. No conflicts found.
- [x] **Remove deprecated shims**: Removed `src/shared/components/CommonUI.tsx` and updated all consumers to import directly from component directories.

## Component Consolidation
- [x] **Button Unification**:
    - `TournamentButton` is a thin wrapper around `Button` adding default plus icon. Used in 3 locations (TournamentToolbar, PersonalResults). Keeping as semantic component for now, but could be simplified to direct Button usage with startIcon prop in future cleanup.
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
- [~] **Tournament Logic**:
    - **Analysis Complete:** Found `tournamentsAPI` object (~345 lines) in `src/shared/services/supabase/modules/general.ts` with 5 methods (createTournament, updateTournamentStatus, getUserTournaments, saveTournamentSelections, saveTournamentRatings).
    - **Recommendation:** Defer migration - too complex for current session. Requires comprehensive testing and dedicated refactoring time.
    - **Future Work:** Move to `features/tournament/services/` when test coverage is comprehensive.

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


