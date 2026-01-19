# Resolution Plan: Address TODOs

## Goal
Resolve all outstanding tasks in `TODO.md`, focusing on CSS consolidation, Code Quality improvements, and missing Features.

## User Review Required
> [!NOTE]
> This plan touches multiple areas: CSS structure, App Architecture (Lazy Loading), and Feature Logic.

## Proposed Changes

### 1. CSS Consolidation (Style Cleanup)
*   **Merge Analysis CSS**: Combine `analysis-mode-tokens.css`, `analysis-mode-global.css`, `analysis-mode-components.css` -> `source/shared/styles/analysis-mode.css`.
*   **Merge Component CSS**: Combine `form-controls.css`, `components-primitives.css` -> `source/shared/styles/components.css`.
*   **Update Imports**:
    *   Update `source/shared/styles/index.css` to import the new files.
    *   Update `ValidatedInput.tsx`, `PerformanceBadge.tsx`, `OfflineIndicator.tsx`, `EmptyState.tsx` to import `components.css`.

### 2. Code Quality (Architecture)
*   **App.tsx**:
    *   Convert `TournamentFlow` and `UnifiedDashboard` imports to `React.lazy`.
    *   Wrap strict `ErrorBoundary` around each lazy loaded route.
    *   Ensure `Suspense` fallbacks are present (Skeletons).

### 3. Features (New Capabilities)
*   **Export Results**:
    *   Implement `exportToCSV` function in `UnifiedDashboard.tsx`.
    *   Connect to "Export" button in `PersonalResults`.
*   **Name Suggestion Favorites**:
    *   Persist favorites to `localStorage` in `RandomGenerator` (part of `UnifiedDashboard`).
*   **Tournament History**:
    *   Add a "History" view in `UnifiedDashboard/PersonalResults` using `voteHistory` data.

## Orphaned Component Cleanup (User Request)
- [ ] Delete `source/shared/utils/logger.ts` (Unused)
- [ ] Verify if `source/features/gallery/GalleryView.tsx` is unused (it might be lazy loaded now) and delete if confirmed orphaned.
- [ ] Delete `source/shared/utils/date.ts` (Duplicate of `source/shared/utils/basic.ts`) - *Already deleted*

## Verification
- [ ] Verify CSS cleanup doesn't break styles
- [ ] Verify functionality (Lazy loading, Error Boundaries)
- [ ] Verify new features (Export, Favorites, History)
- [ ] Verify no build errors after component deletionact.
2.  **App**: Verify app loads without flashing errors, and chunks are loaded lazily (network tab).
3.  **Features**:
    *   Click "Export" -> Check downloaded CSV.
    *   Favorite a name -> Refresh page -> Check if favorite persists.
    *   View "History" -> Verify vote history is displayed.
