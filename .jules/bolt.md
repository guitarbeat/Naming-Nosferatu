## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.

## 2025-06-21 - Optimize Chart Component Performance
**Learning:** Recharts components in the dashboard (`WinLossChart`, `RatingRadarChart`) frequently chain `.filter().slice().map()` on large leaderboard datasets during every re-render. This O(N) operation creates multiple intermediate arrays, degrading main thread performance when charts update in real-time or switch contexts.
**Action:** Replace `.filter().slice(0, limit)` chains with a single `for` loop that evaluates elements, pushes them directly into the final array, and short-circuits (`data.length < limit`) to achieve O(limit) time complexity and eliminate intermediate garbage collection.
