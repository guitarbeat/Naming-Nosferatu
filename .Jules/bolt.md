## 2025-05-22 - Unstable Utility Returns
**Learning:** Utility functions like `getVisibleNames` return new array references on every call. Using them directly in component bodies (e.g., `const visible = getVisibleNames(props.names)`) breaks referential stability, causing downstream hooks (like `useTournamentState`) to re-run expensive effects unnecessarily.
**Action:** Always wrap array-returning utility calls in `useMemo` when the result is passed to hooks or children relying on reference stability.
