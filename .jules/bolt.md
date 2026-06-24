## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2025-10-24 - Avoid for..of iterator overhead when building Maps
**Learning:** Using `for..of` on arrays creates an iterator protocol overhead. A standard `for` loop (`for (let i = 0, len = arr.length; i < len; i++)`) is measurably faster and avoids iterator allocations when building a Map.
**Action:** Replace `for..of` loops with standard indexed `for` loops when iterating arrays in performance-sensitive mapping code.
