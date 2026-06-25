## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2025-06-19 - Avoid Math.max/min with spread operator on large arrays
**Learning:** Using the spread operator with `Math.max(...array)` or `Math.min(...array)` on dynamically sized arrays can throw a "Maximum call stack size exceeded" error when the array is large. It also creates unnecessary memory allocations when combined with `.map()`.
**Action:** Always replace spread operators over unbounded arrays inside `Math.max()` or `Math.min()` with a standard `for` loop to track min/max values.
