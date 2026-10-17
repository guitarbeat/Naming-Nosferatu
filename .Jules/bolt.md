## 2026-10-01 - React.memo() boundary conditions
**Learning:** Found unnecessary `React.memo()` wrappers around very simple components that re-render frequently (e.g., `DriftWallTile`). Profiling showed the memoization comparison overhead was actually higher than re-rendering the simple DOM nodes.
**Action:** Remove `React.memo()` from pure functional components with < 5 DOM nodes and frequently changing props unless profiling proves it helps.

## 2026-10-05 - Inefficient Array Filtering in useMemo
**Learning:** Found O(N) array filtering running on every render despite being wrapped in `useMemo` because it depended on a frequently changing inline object `{ sort: "asc" }` instead of primitive values.
**Action:** Extract inline configuration objects to constant module-scope variables or use primitive scalar values (e.g., `sortString`) as `useMemo` dependencies.

## 2024-05-19 - Unnecessary Map creations for single lookups
**Learning:** Found useMemo blocks creating Maps (O(N) time and memory overhead) from arrays just to perform a single lookup for a specific item (e.g., finding a winner). When the lookup is infrequent or conditional, standard `find` (O(N) worst-case time with no memory allocation) is significantly faster than building an entire Map.
**Action:** Replace Map-building with direct `Array.prototype.find()` when doing infrequent lookups on arrays.
