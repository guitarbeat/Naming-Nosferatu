# Task: Cleanup Deprecated Code

- [ ] Run `npm run lint` <!-- id: 0 -->
- [x] Remove orphaned error log files (`*.txt`) <!-- id: 1 -->
- [x] Verify and remove unreferenced source files <!-- id: 2 -->
    - [x] `source/shared/utils/logger.ts`
    - [x] `source/features/gallery/GalleryView.tsx`
    - [x] `source/shared/components/ErrorBoundary/index.ts`
- [x] Consolidate duplicate logic <!-- id: 3 -->
    - [x] Consolidate `formatDate` (keep in `date.ts`, remove from `basic.ts`)
    - [x] Consolidate cache utils (keep in `cache.ts`, remove from `basic.ts`)
    - [x] Handle `noop` (likely keep in `basic.ts` or move to `utils/index.ts`)
- [x] Verification <!-- id: 4 -->
    - [x] Run `npm run lint` again
    - [x] Ensure build/dev server is healthy
