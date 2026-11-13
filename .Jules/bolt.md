## 2024-11-01 - Optimizing React list rendering
**Learning:** Found an inline function for `onClick` passed to item structures mapped over within `useMemo`, causing excessive object allocations on every render change of `handleToggleName`. This breaks `React.memo` on the `DriftWallTile` component list.
**Action:** When extracting child components mapped in lists that require event handlers, wrap the list's parent `onClick` callback using `useCallback`, rather than generating closure inline functions to `DriftWallItem` data arrays. Verify `useCallback` passes stable references directly as props to child components.

## 2024-11-01 - Replacing Array.every with Object frequency counter
**Learning:** Checking for equality of two unordered arrays of strings using `Array.prototype.every` combined with `Array.prototype.includes` can cause a massive performance bottleneck because it runs in O(N^2). This is exacerbated when large arrays are evaluated multiple times during rendering.
**Action:** When comparing unordered lists, replace `O(N^2)` patterns (or even O(N log N) `[...a].sort()`) with an O(N) frequency counter map via `Object.create(null)`.
