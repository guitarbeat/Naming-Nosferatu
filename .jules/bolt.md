## 2024-08-19 - Elo Match Update Optimization
**Learning:** Replaced chained `.map()` and `.reduce()` calls with single-pass `for` loops in hot path Elo calculations.
**Action:** Always look for opportunities to replace chained array methods with single-pass loops to reduce memory allocation and iteration overhead in performance-critical paths.
