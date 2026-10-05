## 2026-10-01 - Lazy Load Heavy Tournament Component
**Learning:** TournamentSetup and its children (like DriftWall) pull in heavy WebGL and Framer Motion dependencies. Synchronous import in HomeView bundles them in the main chunk, inflating initial load time.
**Action:** Use React.lazy for large route/home components to leverage code splitting and improve initial time-to-interactive.

## 2026-10-05 - Cache Column Map and Sorted Columns in Keyboard Navigation
**Learning:** In high-frequency keydown handlers (e.g. `ArrowRight`/`ArrowLeft` navigation across grid items), grouping elements by column and sorting column numbers on every keypress causes unnecessary O(N) object allocations and O(C log C) sorting on every keystroke (~300x higher CPU overhead in 500-element benchmarks).
**Action:** Store the pre-grouped column map (`colMap`) and pre-sorted column list (`allCols`) inside the existing DOM tiles cache ref (`tilesCacheRef`), ensuring it is invalidated whenever DOM structure changes via `MutationObserver`.
