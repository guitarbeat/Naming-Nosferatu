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
- [ ] **CSS Strategy**:
    - The codebase mixes CSS Modules (`*.module.css`) and global CSS (`*.css`). Standardize on one approach (likely CSS Modules or Tailwind utility classes) to prevent style leakage and reduce bundle size.
- [ ] **Design Tokens**:
    - Ensure colors and spacing variables are consistent. Found references to `var(--color-gold)` etc. in code. Centralize these in `index.css` or Tailwind config.

## Feature Logic
- [~] **Tournament Logic**:
    - **Analysis Complete:** Found `tournamentsAPI` object (~345 lines) in `src/shared/services/supabase/modules/general.ts` with 5 methods (createTournament, updateTournamentStatus, getUserTournaments, saveTournamentSelections, saveTournamentRatings).
    - **Recommendation:** Defer migration - too complex for current session. Requires comprehensive testing and dedicated refactoring time.
    - **Future Work:** Move to `features/tournament/services/` when test coverage is comprehensive.

## General
- [~] **Type definitions**:
    - **DRY Violations Found:**
      - ~~**CRITICAL:** Three different `TournamentState` interfaces~~ **FIXED:** Renamed to `TournamentUIState` in components.ts
      - **MODERATE:** `TournamentName` (store.ts) is a subset of `NameItem` (components.ts) - redundant type (remaining)
    - **Completed:**
      - ✅ Renamed `TournamentState` → `TournamentUIState` in types/components.ts
      - ✅ Updated 3 references in core/hooks/tournamentHooks.ts
      - ✅ Removed duplicate from ViewRouter.tsx
    - **Remaining:**
      - Replace `TournamentName` with `NameItem` throughout codebase (~25 files)


