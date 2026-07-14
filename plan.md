1. **Optimize `getCacheKey` in `tournamentLogic.ts`**
   - Use a `for` loop and string concatenation instead of `.reduce()`, `.map()`, and `.join()`.
   - This avoids creating temporary arrays and functions for each element.

2. **Optimize `RatingDistributionChart` filtering**
   - Replace the chained `.filter().map()` array operations with a single `for` loop that filters and maps data at once.
   - This avoids intermediate array creations that trigger garbage collections.

3. **Optimize `WinLossChart` data preparation**
   - Replace the `.filter().slice().map()` sequence with a `for` loop and an early exit condition.
   - This ensures we iterate just enough to fulfill the required item limit, significantly reducing iterations for larger inputs.

4. **Verify tests and format**
   - Ensure the modified code passes all local test suites.
   - Format using `@biomejs/biome`.

5. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run the full suite of linting and checking tools to ensure no regressions were introduced.

6. **Submit PR**
   - Branch: `perf/optimize-loops`
   - Title: `perf: ⚡ Bolt: Optimize large array operations and cache keys`
   - Description matching Bolt's template.
