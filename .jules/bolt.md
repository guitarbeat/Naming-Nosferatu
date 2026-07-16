## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.

## 2025-06-25 - Avoid array creations and sorts in hot cache key generators
**Learning:** Chaining `.reduce()`, `.map()`, `.sort()`, and `.join()` on arrays in a hot loop (like cache key generation for tournament bracket states) incurs significant $O(N \log N)$ overhead and garbage collection pauses. Furthermore, using `.sort()` when the array order is functionally significant (like bracket seeding order) can cause subtle state bugs where differently seeded brackets incorrectly share the same cache key.
**Action:** Replace functional array chains with a single-pass `for` loop string concatenation when generating cache keys to drastically improve execution time and maintain referential integrity.
