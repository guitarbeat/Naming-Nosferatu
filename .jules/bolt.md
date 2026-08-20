## 2024-05-24 - Reference Equality Short-circuit
**Learning:** Checking for object reference equality (`newItems === oldRankings`) before iterating through arrays in React state comparisons can provide massive performance benefits (over 99% faster) when the component re-renders with the same array reference.
**Action:** Always add a fast-path reference equality check at the top of array comparison functions, especially those used in React effects or `memo` comparisons.

## 2025-02-23 - Avoid .reduce() mapping in hot paths
**Learning:** Chained array methods or using `.reduce()` (especially with `.push()`) inside React render functions (or hooks called during render) creates significant garbage collection overhead and reallocation pressure for large arrays. In this codebase's V8 testing environment, a basic loop iterating a 10,000 item array and pre-allocating an output array was ~4.5x faster than `.reduce()` pushing to intermediate arrays.
**Action:** When mapping over large datasets in charting or visualization components (like Recharts integrations), prefer single-pass `for` loops and `new Array(length)` pre-allocation over `.reduce()` or chained `.filter().map()`.
