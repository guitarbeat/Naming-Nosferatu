## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.

## 2024-07-10 - O(N log N) Sorting Overhead in State Equality Checks
**Learning:** In React state machines (like `useTournamentState`), equality checkers (e.g. `haveSameIds`) are called frequently during renders. Relying on `[...a].sort()` chains to verify unordered array equality introduces severe garbage collection overhead and O(N log N) time complexity.
**Action:** When comparing dynamically sized arrays for unordered equality, prioritize an O(N) sequential fast-path check first (as arrays often maintain order). If the fast path fails, fallback to an O(N) frequency `Map` to count occurrences rather than sorting.
