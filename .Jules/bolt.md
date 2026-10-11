## 2026-10-01 - Lazy Load Heavy Tournament Component
**Learning:** TournamentSetup and its children (like DriftWall) pull in heavy WebGL and Framer Motion dependencies. Synchronous import in HomeView bundles them in the main chunk, inflating initial load time.
**Action:** Use React.lazy for large route/home components to leverage code splitting and improve initial time-to-interactive.

## 2026-10-05 - Pre-compute Search Index for Bracket Contender Highlighting
**Learning:** Searching across Maps of contenders on every search query re-evaluates `.toLowerCase()` on all entrant strings and instantiates Map iterators, incurring substantial CPU overhead and memory allocations.
**Action:** Pre-compute a flattened, lowercased search index in a `useMemo` hook when names or teams change, enabling ~2.5x faster linear search performance with simple index loops.

## 2026-10-11 - Replace O(N log N) sorting with O(N) Map lookup in haveSameIds
**Learning:** Comparing unordered arrays by copying and sorting them (`[...a].sort()`) triggers unnecessary memory allocations and runs in O(N log N) time, slowing down high-frequency equality checks.
**Action:** Use an O(N) `Map`-based frequency counter strategy when verifying if two ID arrays contain the exact same elements (including handling duplicate elements) to avoid array allocation overhead and improve execution time while preserving logical correctness.
