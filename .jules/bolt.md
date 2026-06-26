## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.

## 2025-06-21 - Frequency Map vs Set for Array Equality
**Learning:** When optimizing array equality checks by replacing O(N log N) `.sort()` chains, a `Set` is insufficient if the arrays might contain duplicate values (e.g., comparing `['1', '2']` vs `['1', '1']`). A frequency `Map` correctly handles duplicates in O(N) time. Additionally, checking for sequential equality with a simple `for` loop *before* allocating the Map provides a massive ~20x performance boost for the common case where arrays are already identically ordered.
**Action:** When replacing `.sort()` for equality checks, use an O(N) frequency Map instead of a Set to guarantee correctness with duplicates, and always precede it with an O(N) sequential fast-path loop to avoid object allocation overhead in the happy path.
