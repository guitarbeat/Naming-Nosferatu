## 2024-11-01 - Avoid inline functions breaking React.memo

**Learning:** When passing handlers down to complex memoized lists (like `<DriftWall>`), an inline function like `onItemClick={(item) => handleToggleName(item.id)}` defeats the component's `React.memo`, causing expensive O(N) recalculations on every render dependency change.
**Action:** Wrap inline delegates in `useCallback` (e.g. `const handleItemClick = useCallback((item) => handler(item.id), [handler])`) before passing them down as props to maintain child `memo` safety.
