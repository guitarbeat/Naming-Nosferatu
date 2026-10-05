## 2026-10-01 - Lazy Load Heavy Tournament Component
**Learning:** TournamentSetup and its children (like DriftWall) pull in heavy WebGL and Framer Motion dependencies. Synchronous import in HomeView bundles them in the main chunk, inflating initial load time.
**Action:** Use React.lazy for large route/home components to leverage code splitting and improve initial time-to-interactive.

## 2026-10-05 - O(1) Map Lookups in TournamentComplete
**Learning:** `TournamentComplete` performed linear array `.find()` lookups on `teams` and `names` to look up the winning team or name item.
**Action:** Use `useMemo` to index teams and names by ID in O(1) `Map` instances, eliminating O(N) linear scans on every render.
