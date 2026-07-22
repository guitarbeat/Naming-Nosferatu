## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.

## 2025-06-19 - Safe Array Optimizations
**Learning:** Replacing `.reduce().map().join()` chains with simple `for` loops and string concatenation is a reliable optimization for hot paths (like cache key generation) that avoids intermediate array allocation. However, you must be extremely careful to retain structural requirements like `.sort()` when order independence is required (e.g., tournament brackets where player A vs B is the same as B vs A), otherwise it causes a functional regression (cache misses).
**Action:** When unrolling array chains into loops for performance, explicitly verify if the order of elements dictates logical correctness. Do not blindly strip `.sort()` when replacing chain methods.
