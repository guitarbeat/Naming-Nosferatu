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
- [x] **Service Decomposition**:
    - **Completed:** Decomposed monolithic `general.ts` into domain-specific services (`admin`, `image`, `name`, `analytics`, `siteSettings`). Original file updated as a barrel export.
- [x] **Store DRYing**:
    - **Completed:** Introduced `updateSlice` utility in `src/core/store/utils.ts` and refactored all store slices to use it, drastically reducing boilerplate.

## General
- [x] **Type definitions**:
    - ✅ Renamed `TournamentState` → `TournamentUIState` to avoid conflicts.
    - ✅ Replaced redundant `TournamentName` with `NameItem`.
    - ✅ Aligned `NameItem` with domain model and updated filtering logic in `names.ts`.
- [x] **Address Remaining TODOs**:
    - ✅ Implemented missing callbacks in `src/features/tournament/hooks/useTournamentSetupHooks.ts`.
- [x] **Type Safety Audit**:
    - ✅ Removed remaining `any` types in `analyticsService.ts`, `nameService.ts`, and `siteSettingsService.ts`.
