1. **Optimize `names.find` in `NameSelector.tsx`**:
   - In `NameSelector.tsx`, `names.find` is used multiple times (e.g., `handleToggleName`, `confirmActionName`, `handleOpenLightbox`).
   - `names.find` runs in O(N) time.
   - We can create an `idToNameItem` map using `useMemo` alongside `catImageById` map, or replace `find` with O(1) map lookups since we already have `names` and we frequently look up by `nameId`.
   - Wait, `idToNameMap` might already exist somewhere else, let's create a map `nameById` in `NameSelector.tsx`.
   - Actually, a map of `id -> NameItem` in `NameSelector.tsx` is an excellent O(1) optimization.

Let's see if we can consolidate map creation inside `useMemo` for `catImageById` in `NameSelector.tsx`.
