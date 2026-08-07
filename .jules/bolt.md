## 2024-05-24 - Reference Equality Short-circuit
**Learning:** Checking for object reference equality (`newItems === oldRankings`) before iterating through arrays in React state comparisons can provide massive performance benefits (over 99% faster) when the component re-renders with the same array reference.
**Action:** Always add a fast-path reference equality check at the top of array comparison functions, especially those used in React effects or `memo` comparisons.
