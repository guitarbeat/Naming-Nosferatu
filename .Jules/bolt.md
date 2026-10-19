## 2026-10-01 - Lazy Load Heavy Tournament Component
**Learning:** TournamentSetup and its children (like DriftWall) pull in heavy WebGL and Framer Motion dependencies. Synchronous import in HomeView bundles them in the main chunk, inflating initial load time.
**Action:** Use React.lazy for large route/home components to leverage code splitting and improve initial time-to-interactive.

## 2026-10-05 - Pre-compute Search Index for Bracket Contender Highlighting
**Learning:** Searching across Maps of contenders on every search query re-evaluates `.toLowerCase()` on all entrant strings and instantiates Map iterators, incurring substantial CPU overhead and memory allocations.
**Action:** Pre-compute a flattened, lowercased search index in a `useMemo` hook when names or teams change, enabling ~2.5x faster linear search performance with simple index loops.

## 2024-05-18 - Avoid redundant sorted array generation when computing derived keys
**Learning:** The `createTournamentId` was unnecessarily recreating an $O(N \log N)$ mapped and sorted string of `names` IDs to compute a hash, when the exact identical deterministic string (`namesKey`) was already being pre-computed in `useMemo` using `createSortedKey`.
**Action:** When a deterministic identifier string is generated from an array of objects, check if the sorted key equivalent is already available in the parent scope to reuse it instead of performing redundant string allocations and sorts.
