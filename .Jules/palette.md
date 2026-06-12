## 2024-06-12 - Added ARIA attributes to navigation tabs
**Learning:** `AdminTabNav` uses generic string labels, but as a navigation element, buttons functioning as tabs should explicitly declare their `role="tab"` and indicate selection state via `aria-selected` rather than relying purely on visual highlighting. This is a crucial semantic UX enhancement for screen reader users navigating tablists.
**Action:** Always verify components mapped from arrays that represent tabs or selectable lists use appropriate ARIA roles (`role="tab"`) and states (`aria-selected`).
