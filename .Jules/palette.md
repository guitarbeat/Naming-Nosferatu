## 2024-05-22 - [Accessing Context in Event Handlers]
**Learning:** When adding accessibility labels dependent on dynamic state (like current card name) in a component that memoizes its list but not the current item reference, defining the current item as a variable in the render scope allows both `aria-label` and event handlers to access it cleanly without redundant lookups.
**Action:** Always check if the derived state (like `currentCard`) is available in the render scope before duplicating logic in event handlers or JSX attributes.
