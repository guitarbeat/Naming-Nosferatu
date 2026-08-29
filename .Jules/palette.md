## 2024-05-18 - Avatar Picker ARIA Enhancements
**Learning:** Screen reader users require explicit `aria-expanded` and `aria-controls` links on toggle buttons to understand the relationship to expandable trays. Standard focus outlines are good, but semantic ARIA properties are essential for non-visual understanding of state changes (like `aria-pressed` for selected avatars).
**Action:** Always pair custom expandable UI elements with their proper ARIA attributes to bridge the gap between visual state and screen reader announcements.
