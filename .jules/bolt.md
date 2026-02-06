## 2026-02-06 - [React Hook Stale Refs]
**Learning:** React refs (useRef) persist across renders and can hold stale references to detached DOM nodes if not manually cleaned up, especially when managing lists where items are removed (e.g. filtering). This causes memory leaks and performance issues if observers (ResizeObserver) are attached to these stale refs.
**Action:** When using refs to track a list of elements, explicitly truncate the ref array to the current item count in a useEffect or cleanup function to release detached nodes.
