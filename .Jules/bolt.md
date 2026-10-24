## 2023-10-24 - Delegated Event Handlers for Memoized Lists
**Learning:** Passing inline functions (like `onItemClick={(item) => handleToggleName(item.id)}`) as props to memoized child list components (e.g. `DriftWall`) breaks `React.memo()` because the function reference changes on every render. This forces unnecessary O(N) re-renders for every item in the list.
**Action:** Always wrap delegated event handler props in `useCallback` before passing them down to memoized components, ensuring the child's own internal accessibility events (like `onKeyDown`) aren't broken by the refactor.
