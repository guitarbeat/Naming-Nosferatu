## 2026-02-07 - Stable Identity for Shuffled Lists in Hooks
**Learning:** In `useTournamentState`, comparing shuffled lists of names directly (or via `JSON.stringify`) causes unstable dependency identity if the shuffle order changes, leading to unnecessary hook re-runs and component re-renders.
**Action:** Always sort lists by a stable identifier (like `id`) before comparison or hashing when verifying if the underlying data set has changed, especially in hooks dealing with randomized data. Use `useCallback` with stable dependencies to prevent function re-creation.
