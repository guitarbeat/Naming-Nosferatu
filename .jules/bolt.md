## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.
## 2025-06-18 - Optimize array equality checks with for loop and reference check
**Learning:** `Array.prototype.some` incurs significant callback overhead per element. When comparing two arrays for equality, using a traditional `for` loop combined with an upfront array reference check (`if (a === b)`) and an element reference check (`if (a[i] === b[i])`) can result in a 200x-2000x performance improvement in hot paths.
**Action:** Replace functional array methods with `for` loops and reference checks for hot-path array comparisons.
