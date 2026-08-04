## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.
## 2025-06-25 - Avoid chained .filter().map() in React render cycles
**Learning:** Chaining `.filter().map()` inside React render cycles (even when memoized) creates unnecessary intermediate arrays and causes an extra iteration over the data. This contributes to garbage collection pressure and CPU overhead, which can be noticeable on slower devices or when the data set grows.
**Action:** Replace `.filter().map()` chains with a single-pass `for` loop that concurrently filters and projects the data when processing lists or arrays in React components.
## 2025-06-25 - Avoid replacing array map/reduce on cold paths
**Learning:** Replacing declarative array/object iteration methods (like `Object.entries().map()`, `Object.fromEntries()`, or `.reduce()`) with imperative `for` loops on cold paths (e.g., user click handlers) is considered a micro-optimization. It sacrifices readability and idiomatic patterns for unmeasurable gains.
**Action:** Do not use `for` loop rewrites for data transformations unless there is a genuine algorithmic improvement (e.g. from O(N) to O(k)) or the code is on a highly sensitive hot path, such as an active render loop or handling thousands of items continuously.

## 2025-06-25 - Optimize large leaderboard filters by short-circuiting
**Learning:** Chaining `.filter(condition).slice(0, limit).map(...)` on large arrays iterates through the entire array for the filter step, even if the limit is small.
**Action:** Replace `.filter().slice(0, limit)` chains with a single `for` loop that checks the condition, pushes to a results array, and immediately `break`s when `results.length >= limit`. This transforms an O(N) operation into an O(limit) operation for large datasets.
