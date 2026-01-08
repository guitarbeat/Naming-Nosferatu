# Repository Consolidation & Optimization Opportunities

This document tracks potential areas for code consolidation and simplification to improve maintainability without feature loss.

## High Priority: Regressions & Cleanup
- [x] **Verify Auth Logic**: Moved `src/shared/utils/auth.ts` to `src/features/auth/utils/authUtils.ts`. No conflicts found.
- [x] **Remove deprecated shims**: Removed `src/shared/components/CommonUI.tsx` and updated all consumers to import directly from component directories.

## Component Consolidation
- [x] **Button Unification**:
    - `TournamentButton` is a thin wrapper around `Button` adding default plus icon. Used in 3 locations (TournamentToolbar, PersonalResults). Keeping as semantic component for now, but could be simplified to direct Button usage with startIcon prop in future cleanup.
- [ ] **Header vs Navbar**:
    - Clarify the relationship between `src/shared/components/AppNavbar` (main nav) and `src/shared/components/Header/CollapsibleHeader.tsx`. If `CollapsibleHeader` is only used in specific views (Analytics/Results), consider moving it closer to those features or renaming to `ViewHeader`.
- [x] **AppNavbar Simplification**:
    - Completed navigation consolidation by removing redundant `navbarCore.tsx` (243 lines). AppNavbar components now import from `src/shared/navigation` module. Reduced from 12 to 11 files.

## Style Consolidation
- [ ] **CSS Strategy**:
    - The codebase mixes CSS Modules (`*.module.css`) and global CSS (`*.css`). Standardize on one approach (likely CSS Modules or Tailwind utility classes) to prevent style leakage and reduce bundle size.
- [ ] **Design Tokens**:
    - Ensure colors and spacing variables are consistent. Found references to `var(--color-gold)` etc. in code. Centralize these in `index.css` or Tailwind config.

## Feature Logic
- [ ] **Tournament Logic**:
    - Continue moving tournament-specific logic from `shared/` to `features/tournament/`.
    - Check if `src/shared/services/supabase/modules/` contains tournament logic that belongs in `features/tournament/services/`.

## General
- [ ] **Type definitions**:
    - Review `src/types/` for fragmentation. Consolidate component props and domain models.
