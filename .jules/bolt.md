## 2025-06-18 - Avoid O(N log N) sorts for percentile calculation
**Learning:** Calculating percentiles using `.sort()` is O(N log N) and creates a new array (`[...arr]`). For `getPercentileRank`, we only need to count elements below the target value, which is O(N) and creates no garbage.
**Action:** Replace `[...arr].sort().filter()` chains with a single-pass `for` loop when calculating percentile ranks.

## 2025-02-18 - Optimize array mapping and allocation overhead
**Learning:** Chaining `.map()` calls and object spread (`...row`) creates intermediate arrays and unnecessary object copies, increasing memory allocation overhead and garbage collection time. A single or batched classical `for` loop with pre-allocated arrays (`new Array(len)`) and object mutation avoids these overheads and is roughly ~33% faster.
**Action:** When extracting fields and modifying newly mapped objects in sequence, avoid `.map()` chains. Pre-allocate the arrays and use classical `for` loops to process the data with object mutation, particularly when modifying local object instances sequentially.
