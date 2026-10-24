## 2025-02-28 - Global Search Keyboard Shortcut
**Learning:** When implementing global keyboard shortcuts (like '/' for search), event listeners must explicitly ignore triggers if `document.activeElement?.tagName` is 'INPUT' or 'TEXTAREA' to prevent intercepting normal user typing.
**Action:** Always check activeElement before handling global keyboard shortcuts and include a visual <kbd> hint with `aria-keyshortcuts` for accessibility.
