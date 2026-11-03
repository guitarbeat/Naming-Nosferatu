# Palette's UX Journal

## 2024-11-03 - [DriftWall Keyboard Accessibility]
**Learning:** Event delegation for custom clickable items in React (like the DriftWall tiles) often misses keyboard events if we only implement onClick/onPointerDown. Keyboard users rely on Enter/Space on tab-indexed elements.
**Action:** Always implement onKeyDown event delegation alongside onClick when building large lists of custom interactive items without native button tags.
