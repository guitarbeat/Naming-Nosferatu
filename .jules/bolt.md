## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.
## 2025-07-04 - Array transform GC overhead in React renders
**Learning:** Chaining functional array methods like `.filter().map()` inside hot execution paths (like frequently re-evaluated `useMemo` blocks) creates intermediate arrays, causing unnecessary garbage collection overhead and slower iteration times. This is especially impactful for data visualization components (like charts) that process large leaderboards.
**Action:** Replace `.filter().map()` chains with single-pass `for` loops to filter and project data concurrently, avoiding intermediate array allocation.
