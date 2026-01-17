# Cat Name Tournament - Project TODO

## Completed Cleanup ✅

### SPA Conversion (Latest)

- [x] Removed React Router - now pure state-based view switching
- [x] Created ViewRenderer with Framer Motion transitions
- [x] Updated navigation to use Zustand store actions
- [x] Deleted routeConfig.ts, useRouting.ts, ViewRouter.tsx
- [x] Simplified navigation config (removed route paths)

### CSS Consolidation

## Completed Cleanup ✅

### CSS Consolidation

- [x] Merged tournament CSS modules into `tournament.module.css`
- [x] Merged analytics CSS modules into `analytics.module.css`
- [x] Merged explore CSS modules into `explore.module.css`

### Hook Consolidation

- [x] Removed deprecated `useTournamentController` hook
- [x] Consolidated navigation into single `AdaptiveNav.tsx`

### Security

- [x] Marked all security findings as intentionally ignored (prototype app)

### Structure Cleanup

- [x] Moved `nameService.ts` to `src/shared/services/supabase/modules/`
- [x] Moved profile hooks to `src/core/hooks/`
- [x] Deleted empty `src/features/names/` folder
- [x] Deleted empty `src/features/profile/` folder
- [x] Simplified route configuration (removed 5 redundant sub-routes)
- [x] Deleted empty `src/features/tournament/styles/` directory

### Type Safety & Linting
- [x] Resolved all 22+ TypeScript errors across 10+ files
- [x] Standardized tournament logic and hook return types
- [x] Refined component prop types for better strictness
- [x] Achieved clean `pnpm run lint:types` output
- [x] Ran Biome check and auto-fixed 8+ files for consistency

---

## Current Project Structure

```
src/
├── core/               # App-wide state, hooks, config
│   ├── config/         # Route configuration
│   ├── constants/      # App constants
│   ├── hooks/          # Core hooks (useProfile, useProfileNotifications, etc.)
│   └── store/          # Zustand store slices
├── features/           # Feature modules
│   ├── analytics/      # Analysis dashboard & charts
│   ├── auth/           # Authentication services
│   ├── explore/        # Name discovery & categories
│   ├── gallery/        # Photo gallery
│   └── tournament/     # Tournament logic & UI
├── shared/             # Shared utilities
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Shared hooks
│   ├── layouts/        # App layouts
│   ├── navigation/     # Navigation config
│   ├── providers/      # React context providers
│   ├── services/       # Supabase client & modules
│   ├── styles/         # Global CSS
│   └── utils/          # Utility functions
└── types/              # TypeScript types
```

---

## Optional Future Improvements

### CSS (Low Priority)

- [ ] Merge `analysis-mode-*.css` files into single `analysis-mode.css`
- [ ] Merge `form-controls.css` + `components-primitives.css` into `components.css`

### Code Quality (Low Priority)

- [ ] Add more comprehensive error boundaries
- [ ] Add loading skeletons for better UX
- [ ] Consider lazy loading for route components

### Features (Nice to Have)

- [ ] Add name suggestion favorites
- [ ] Add tournament history view
- [ ] Add export results feature
