## 2024-05-14 - Custom Component Focus States
**Learning:** Custom interactive components (like inline toggles or overlaid search inputs) often miss the `focus-visible` ring styles that native elements get, leading to poor keyboard navigation visibility.
**Action:** Always ensure that `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background` is applied to custom focusable elements like the buttons in `MagicToggle` and the clear button in `MagicSearch`.
