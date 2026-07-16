## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.
## 2025-07-16 - Optimize Bracket Entrants Cache Key Generation
**Learning:** In `src/features/tournament/utils/tournamentLogic.ts`, `getCacheKey` previously used a chained `reduce().sort().join(",")` to generate a string key from bracket entrants. However, the order of `bracketEntrants` dictates the seeding of the tournament. Sorting the entrants array not only incurred an unnecessary O(N log N) overhead, but it fundamentally breaks cache uniqueness across different seedings of the same names. The `reduce().sort().join()` and `map().join()` chains were also allocating multiple intermediate arrays.
**Action:** Replace `reduce().sort().join(",")` with single-pass `for` loops using direct string concatenation on hot paths, and omit `.sort()` on arrays where element order determines functionality (like bracket seeding).
