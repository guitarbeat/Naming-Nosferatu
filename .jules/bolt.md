## 2026-02-05 - Unstable Object Identity in Hooks
**Learning:** `useTournamentState` was recreating the `names` array on every render via `.map()`, causing downstream hooks (`useTournament`) to re-compute expensive memoized values (like `tournamentId`) and bypass optimization checks (`lastInitKeyRef`).
**Action:** When passing derived arrays/objects to custom hooks, always ensure they are stable (memoized) if the hook relies on reference equality or uses them in dependency arrays.
