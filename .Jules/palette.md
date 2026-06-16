## 2024-05-18 - Admin Tab Navigation
**Learning:** Adding the `role="tablist"` to standard horizontal flex containers and `role="tab"` + `aria-selected` to child buttons significantly improves navigation clarity for screen readers without altering the visual presentation in custom components like AdminTabNav.
**Action:** Always verify custom tab navigation implementations have correct ARIA roles when refactoring similar patterns across the application.
