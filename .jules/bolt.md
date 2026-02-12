## 2026-02-05 - Unstable Object Identity in Hooks
**Learning:** `useTournamentState` was recreating the `names` array on every render via `.map()`, causing downstream hooks (`useTournament`) to re-compute expensive memoized values (like `tournamentId`) and bypass optimization checks (`lastInitKeyRef`).
**Action:** When passing derived arrays/objects to custom hooks, always ensure they are stable (memoized) if the hook relies on reference equality or uses them in dependency arrays.
## 2026-02-05 - CI Script Mismatch
**Learning:** The CI workflow referenced a script `check:limits` that was missing from `package.json`, causing build failures.
**Action:** When adding or renaming scripts in `package.json`, always verify and update corresponding CI workflow steps to match.
