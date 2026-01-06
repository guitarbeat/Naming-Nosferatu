# Feature Folder Template

This document outlines the standard folder structure for new features in the application, adhering to V2 design principles.

## Structure

```
src/features/FeatureName/
├── components/                 # Sub-components specific to this feature
│   ├── SubComponent/
│   │   ├── SubComponent.tsx
│   │   ├── SubComponent.module.css
│   │   └── index.ts
│   └── SharedComponent.tsx    # Simple shared components
├── hooks/                      # Business logic extracted from UI
│   ├── useFeatureLogic.ts
│   └── useFeatureData.ts
├── FeatureName.tsx            # Main container/entry component
├── FeatureName.module.css     # Layout styles for the container
└── index.ts                   # Public API exports
```

## Principles

1.  **File Limits**:
    *   **Components**: Max 400 lines. If larger, split into sub-components or extract hooks.
    *   **CSS Modules**: Max 500 lines. If larger, split into sub-modules.

2.  **Logic Separation**:
    *   UI components should ideally be focused on rendering.
    *   Business logic, state management, and data fetching should be moved to `hooks/`.

3.  **Styling**:
    *   Use CSS Modules (`*.module.css`) for all component styling.
    *   No global CSS classes in components (except utility classes if absolutely necessary).
    *   Compose from primitives where possible.

4.  **Colocation**:
    *   Keep things close to where they are used. If a component is only used by `FeatureName`, keep it in `features/FeatureName/components/`.
    *   Only promote to `src/shared/` if used by multiple features.

## Example

For a "Tournament" feature:

```
src/features/tournament/
├── components/
│   ├── TournamentToolbar/...
│   ├── NameGrid/...
│   └── SwipeMode/...
├── hooks/
│   ├── useTournamentLogic.ts
│   └── useSwipeLogic.ts
├── Tournament.tsx
├── Tournament.module.css
└── index.ts
```
