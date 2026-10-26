## 2024-05-24 - Initial setup
**Learning:** Initial setup.
**Action:** Initial setup.

## 2025-02-23 - Memoize delegate event handler for DriftWall
**Learning:** In React, passing an inline function as a prop to a memoized component (like `DriftWall = memo(...)`) defeats the purpose of `memo`. The inline function creates a new reference on every render of the parent component (`TournamentSetup`), causing the child component to unnecessarily re-render. Since `DriftWall` manages complex physical layouts and animations with lots of items, these unnecessary re-renders can be quite expensive.
**Action:** Always wrap delegated event handlers in `useCallback` when passing them to memoized child components, especially those that render long lists or handle complex physics/animations like `DriftWall`.
