## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2024-06-23 - Tournament Render Profiling
**Learning:** React.memo is highly effective in game-loop style React components where parent state (like the Tournament match state, or countdowns) changes rapidly but child structural props (like `MatchSideCard` details) remain constant. Due to deep Framer Motion and layout trees inside `MatchSideCard` and `TournamentAnnouncements`, preventing reconciliation saved hundreds of milliseconds in simulated tests.
**Action:** Always investigate wrapping heavy, leaf-node interactive components with `React.memo` if their parent components house active interval loops, timers, or frequent state updates. Ensure props are simple primitives or referentially stable callbacks to maximize effectiveness.

## 2025-06-21 - Optimize object iteration and functional array checks
**Learning:** `Object.entries().map()` chaining creates significant garbage due to tuple allocation and intermediate arrays. Additionally, functional array methods like `.some()` add callback overhead, and lack early short-circuits like `if (a === b)` that standard `for` loops allow when comparing references.
**Action:** For performance-sensitive components, especially during dragging or reordering lists, replace `Object.entries().map()` with a single-pass `Object.keys()` pre-allocated loop. Replace `.some()` and `.every()` with standard `for` loops incorporating an initial reference equality check to skip deep comparisons.

## 2025-06-21 - PR Title Formatting for CI
**Learning:** The GitHub Actions CI check `title-lint` uses `amannn/action-semantic-pull-request`, which requires standard conventional commit prefixes (e.g., `perf:`, `fix:`) that strictly follow a lowercase format and cannot contain emojis within the type. When a persona instructs to use a specific title like `⚡ Bolt: [description]`, it fails this strict regex (`^([a-z]+)(?:\([^)]+\))?!?: (.+)$`).
**Action:** When a persona constraint requires a specific prefix (like `⚡ Bolt: `), place it in the *subject* (or scope), keeping the type strictly conventional lowercase: `perf: ⚡ Bolt: [description]`.
