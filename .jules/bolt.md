## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.
## 2025-06-25 - Avoid chained .filter().map() in React render cycles
**Learning:** Chaining `.filter().map()` inside React render cycles (even when memoized) creates unnecessary intermediate arrays and causes an extra iteration over the data. This contributes to garbage collection pressure and CPU overhead, which can be noticeable on slower devices or when the data set grows.
**Action:** Replace `.filter().map()` chains with a single-pass `for` loop that concurrently filters and projects the data when processing lists or arrays in React components.
## 2025-06-25 - Avoid chained .filter().slice().map() on large arrays
**Learning:** Chaining `.filter().slice(0, limit).map()` requires iterating over the entire array to evaluate the filter condition before slicing and mapping. For large arrays (like a leaderboard) with a small limit, this is highly inefficient and creates unnecessary intermediate arrays.
**Action:** Replace such chains with a single-pass `for` loop that evaluates the condition, maps the element, and short-circuits (`break`) as soon as the limit is reached.
