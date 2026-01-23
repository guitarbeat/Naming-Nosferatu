# Refactor to Tailwind CSS Summary

The following components and features have been refactored to use Tailwind CSS utility classes, removing their dependencies on CSS Modules and custom stylesheets.

## Components Refactored
1.  **ErrorComponent**
    - Removed `ErrorComponent.module.css`
    - Implemented `cn` utility for class merging
    - Styled variants: `inline`, `list`, `boundary`

2.  **NameGrid**
    - Removed `NameGrid.module.css`
    - Preserved Masonry layout logic while using Tailwind for container and item styling
    - Updated `EmptyState` and `Loading` wrappers

3.  **ErrorBoundary**
    - Removed `ErrorBoundary.module.css`
    - Implemented glassmorphism error UI
    - Added "Copy Details" functionality with Tailwind styling

4.  **NameManagementView**
    - Removed `NameManagementView.module.css`
    - Updated layout for Dashboard/Profile/Tournament modes
    - Added entry animations

5.  **App & AppLayout**
    - Removed `App.module.css`
    - Updated global app container and toast container positioning
    - Configured `min-h-screen` and global backgrounds

6.  **TournamentSetup & LoginScene**
    - Removed `LoginScene.module.css` and `tournament.module.css`
    - Refactored Login screen to use Tailwind (glassmorphism, gradients)
    - Updated Identity/Avatar section in setup

## Files Removed
- `source/components/ErrorComponent.module.css`
- `source/components/NameGrid.module.css`
- `source/components/ErrorBoundary.module.css`
- `source/components/FormPrimitives.module.css`
- `source/components/NameManagementView/NameManagementView.module.css`
- `source/App.module.css`
- `source/features/auth/LoginScene.module.css`
- `source/features/tournament/tournament.module.css`

## Utility Creation
- Created/Verified `source/utils/cn.ts` for properly merging Tailwind classes.

## Notes
- `CatBackground` and `LiquidGlass` retain their specific CSS files (`CatBackground.css`, `LiquidGlass.css`) due to complex keyframe animations and SVG filter logic that is cleaner/more reliable in CSS.
- The global style architecture in `source/styles/` was preserved to support legacy components, but `index.css` initializes Tailwind.

7.  **ProfileMode & TournamentMode**
    - Removed NameManagementView.module.css imports (which were broken after deletion)
    - Refactored layout, sticky filters, and progress bars to Tailwind.
