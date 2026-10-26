
## 2023-10-26 - Accessible Keyboard Shortcuts
**Learning:** When implementing global keyboard shortcuts (like '/' to focus search), they need visual hints (`<kbd>`) so users can discover them, and ARIA attributes (`aria-keyshortcuts="/"`) so screen readers know they exist. Also, the event listener must explicitly ignore triggers if the user is already typing in an `INPUT` or `TEXTAREA` to prevent annoying typing conflicts.
**Action:** Always add visual indicators and `aria-keyshortcuts` when implementing shortcuts, and ensure the event listener checks `document.activeElement?.tagName`.
