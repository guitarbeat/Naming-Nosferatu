## 2026-06-15 - Added proper ARIA roles to custom tab navigation component
**Learning:** Found a custom tab navigation component (`AdminTabNav`) using standard `div` and `button` tags without appropriate `role` attributes or state indicators. This pattern makes it difficult for screen reader users to identify the interface as a tabbed structure or understand which tab is currently active.
**Action:** Always add `role="tablist"` to the container and `role="tab"` with `aria-selected` to the individual buttons when creating custom tab navigation elements.
