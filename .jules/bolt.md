## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.

## 2025-06-19 - Avoid Chained Array Methods on Analytics
**Learning:** Chaining array methods like `.filter().slice().map()` on large datasets causes unnecessary O(N) array traversals and allocates intermediate garbage. On charting render paths (e.g. `WinLossChart` and `RatingRadarChart`), this can block the main thread.
**Action:** Replace `.filter().slice(0, limit)` chains with a single `for` loop that implements an early `break` when the `limit` is reached to optimize execution from O(N) to O(K) and prevent garbage collection overhead. Ensure it handles zero or negative limits gracefully.
