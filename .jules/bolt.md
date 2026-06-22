## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2023-10-24 - Avoid Math.max(...array) and Math.min(...array) on dynamically sized arrays
**Learning:** Using the spread operator with `Math.max(...array)` or `Math.min(...array)` has two critical flaws: 1) It can throw a "Maximum call stack size exceeded" error if the array is large (typically > 100k elements), and 2) Even for small arrays, it's measurably slower (5-10x) than a simple `.reduce()` or `for` loop because spreading allocates memory for arguments on the call stack.
**Action:** Replace `Math.max(...array)` with `array.reduce((max, val) => val > max ? val : max, array[0])` or a manual `for` loop, especially when the array size is unbounded or comes from database queries (like leaderboard stats).
