## 2026-10-01 - Lazy Load Heavy Tournament Component
**Learning:** TournamentSetup and its children (like DriftWall) pull in heavy WebGL and Framer Motion dependencies. Synchronous import in HomeView bundles them in the main chunk, inflating initial load time.
**Action:** Use React.lazy for large route/home components to leverage code splitting and improve initial time-to-interactive.

## 2026-10-03 - Prevent O(N) allocations in memoized array loops
**Learning:** In NameSelector.tsx, mapping an inline `onClick` function inside the `driftWallItems` useMemo array caused new function allocations for every item whenever the dependencies (`selectedIds`) changed, degrading performance.
**Action:** When passing an array of items to a list component (like DriftWall), remove inline handlers and pass a single delegated event handler (e.g., `onItemClick`) to the parent component instead, and ensure it is wrapped in `useCallback`.
