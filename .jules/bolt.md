## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.
## 2025-07-18 - Prevent Tournament Cache Collisions and Reduce Array Overhead
**Learning:** Using `.reduce().sort().join()` to generate a cache key from an array of identifiers both incurs an O(N log N) performance penalty and can inadvertently cause logical bugs. In the tournament generator, sorting the bracket entrants caused different initial bracket seedings (which yield completely different matches) to map to the exact same cache key.
**Action:** When creating cache keys from ordered inputs where the order fundamentally alters behavior, never apply `.sort()`. Use a single-pass `for` loop with direct string concatenation to assemble the key—this prevents the cache collision bug while also avoiding the performance overhead of intermediate array allocations and chained functional methods.
