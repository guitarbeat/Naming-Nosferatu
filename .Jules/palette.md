## 2026-06-18 - Added Proper ARIA roles to custom Tab Navigation
**Learning:** When building custom tab components from mapped arrays of button elements, using `role="tablist"`, `role="tab"`, and `aria-selected={condition}` is essential for proper screen reader communication and accessibility standards.
**Action:** Always ensure mapped button lists acting as tabs in custom navigation components include these explicit ARIA roles.
## 2026-06-25 - Added missing ARIA label to Combobox Clear Search button
**Learning:** When using icon-only buttons for clearing search inputs within interactive components (like Comboboxes), an `aria-label` is critical. Otherwise, screen reader users traversing the UI receive no context for what the clear button does.
**Action:** Always ensure that icon-only `<button>` or `<motion.button>` elements (like the `X` button used to clear text) include an explicit `aria-label="Clear search"`.
