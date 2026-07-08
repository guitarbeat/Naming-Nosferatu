## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.
## 2025-06-18 - Fast paths for array order comparison
**Learning:** Comparing unordered arrays for identical contents historically used `[...a].sort()`. Replacing it with a frequency `Map` provides `O(N)` checking. However, adding a fast-path `O(N)` sequential loop first (`if (a[i] !== b[i])`) avoids the `Map` allocation entirely in the vast majority of cases where arrays are commonly identical in order, dramatically improving UI rendering performance.
**Action:** When refactoring `[...arr].sort()` equality checks, always use a frequency `Map` (not a Set, to handle duplicates) and include a sequential loop fast-path.
