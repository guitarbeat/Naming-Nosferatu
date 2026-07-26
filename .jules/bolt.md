## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.
## 2026-07-26 - Target the Formatter Carefully
**Learning:** Running `@biomejs/biome check --write src` can inadvertently format dozens of unrelated files if the repository is large and not well-cached or if the  doesn't cover all intermediate artifacts correctly, leading to massive unintended diffs.
**Action:** Always specify the exact paths of the files modified when running the formatter (e.g., `pnpm dlx @biomejs/biome check --write src/shared/lib/utils.ts`).

## 2025-07-26 - Target the Formatter Carefully
**Learning:** Running `@biomejs/biome check --write src` can inadvertently format dozens of unrelated files, leading to massive unintended diffs.
**Action:** Always specify the exact paths of the files modified when running the formatter.
