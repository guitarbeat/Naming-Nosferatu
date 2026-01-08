# Repository Consolidation & Optimization Opportunities

This document tracks potential areas for code consolidation and simplification to improve maintainability without feature loss.

## High Priority: Regressions & Cleanup
- [ ] **Verify Auth Logic**: Ensure `src/shared/utils/auth.ts` (low-level helpers) does not overlap or conflict with `src/features/auth/hooks/authHooks.ts`. Consolidate if possible.
- [ ] **Remove deprecated shims**: `src/shared/components/CommonUI.tsx` re-exports components. Update consumers to import directly from `Loading`, `Toast`, etc., and remove this shim.

## Component Consolidation
- [ ] **Button Unification**:
    - `src/shared/components/TournamentButton/TournamentButton.tsx` is a wrapper around `Button`. Validate if this warrants a separate component or can be a `variant` or simple prop configuration of `Button`.
- [ ] **Header vs Navbar**:
    - Clarify the relationship between `src/shared/components/AppNavbar` (main nav) and `src/shared/components/Header/CollapsibleHeader.tsx`. If `CollapsibleHeader` is only used in specific views (Analytics/Results), consider moving it closer to those features or renaming to `ViewHeader`.
- [ ] **AppNavbar Simplification**:
    - `src/shared/components/AppNavbar` contains 12 files. Assess if some sub-components (`NavbarBrand`, `NavbarIcons`, `NavbarLink`) can be merged into the main component or grouped to reduce file sprawl.

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
