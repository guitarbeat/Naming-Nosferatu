## 2024-10-27 - Global Search Keyboard Shortcuts
**Learning:** When implementing global keyboard shortcuts (like `/` for search), event listeners must explicitly ignore triggers if `document.activeElement?.tagName` is 'INPUT' or 'TEXTAREA' to prevent blocking normal typing. Visual `<kbd>` hints and `aria-keyshortcuts` attributes are essential for both discoverability and accessibility.
**Action:** Always wrap global shortcut listeners with active element checks and pair them with visual/ARIA hints in the associated input field.
