## 2024-05-24 - Reference Equality Short-circuit
**Learning:** Checking for object reference equality (`newItems === oldRankings`) before iterating through arrays in React state comparisons can provide massive performance benefits (over 99% faster) when the component re-renders with the same array reference.
**Action:** Always add a fast-path reference equality check at the top of array comparison functions, especially those used in React effects or `memo` comparisons.

## 2024-08-19 - Elo Match Update Optimization
**Learning:** Replaced chained `.map()` and `.reduce()` calls with single-pass `for` loops in hot path Elo calculations.
**Action:** Always look for opportunities to replace chained array methods with single-pass loops to reduce memory allocation and iteration overhead in performance-critical paths.
