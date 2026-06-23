## 2024-06-19 - Adding loading states to destructive/logout actions
**Learning:** Adding a spinner to the logout button makes the UI feel more responsive during state transitions, and `aria-busy` is a simple but critical attribute for screen readers to understand an action is pending.
**Action:** When creating form submissions or auth actions, ensure an `aria-busy` state and loading indicator are added.
