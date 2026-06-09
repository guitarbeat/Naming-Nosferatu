## 2024-05-18 - Admin Dashboard Toolbar A11y
**Learning:** Admin screens often rely on icons (like the refresh button) or native inputs (like select filters and checkboxes inside grids) that lack visible text labels due to space constraints, leading to poor screen reader experiences.
**Action:** Consistently apply aria-label to these interactive elements (search inputs without labels, filter dropdowns, icon-only buttons, and row selection checkboxes) in data-heavy screens like the Admin Dashboard.
