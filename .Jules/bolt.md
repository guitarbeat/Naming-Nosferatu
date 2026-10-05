## 2026-10-01 - Lazy Load Heavy Tournament Component
**Learning:** TournamentSetup and its children (like DriftWall) pull in heavy WebGL and Framer Motion dependencies. Synchronous import in HomeView bundles them in the main chunk, inflating initial load time.
**Action:** Use React.lazy for large route/home components to leverage code splitting and improve initial time-to-interactive.

## 2026-10-24 - Map Index for Active Tile Search in DriftWall Keyboard Navigation
**Learning:** Performing `allTiles.includes(active)` and `allTiles.find((t) => t.dataset.tileId === activeIdRef.current)` on every keydown event causes O(N) array scans and repeated DOM `.dataset` property reads across hundreds of tile instances in the wall.
**Action:** Maintain an O(1) `tilesMapRef` (a `Map<string, HTMLElement>`) alongside `tilesCacheRef` to retrieve active tiles instantaneously during keyboard navigation.
