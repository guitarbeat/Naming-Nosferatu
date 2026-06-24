## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.
## 2024-05-18 - [Optimize rating validation loop using Object.entries]
**Learning:** For iteration over large, dynamically-sized data objects where size constraints exist, `Object.entries()` enables retrieving the length upfront, creating an O(1) fail-fast path. Although micro-benchmarks might show `for...in` slightly faster for very small objects due to lower allocation overhead, `Object.entries()` performs cleanly, reads better, and is highly effective at avoiding full iteration against massive object blobs that exceed limits.
**Action:** Default to `Object.entries()` when validating payload objects if knowing the precise item count upfront allows early returns, but always balance against the allocation overhead if dealing with tiny, highly frequent objects.
