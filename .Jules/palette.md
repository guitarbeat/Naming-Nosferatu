## 2024-05-14 - Custom Component Focus States
**Learning:** Custom interactive components (like inline toggles or overlaid search inputs) often miss the `focus-visible` ring styles that native elements get, leading to poor keyboard navigation visibility.
**Action:** Always ensure that `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background` is applied to custom focusable elements like the buttons in `MagicToggle` and the clear button in `MagicSearch`.

## 2024-06-15 - Conditional Component Unmount Focus Loss
**Learning:** When conditional interactive UI elements (like a clear button) unmount immediately upon interaction, keyboard and screen reader focus is lost and resets to the body tag, creating a jarring experience.
**Action:** Always explicitly manage focus by attaching a `useRef` to a nearby relevant element (like the parent input) and calling `.focus()` in the interaction handler before the element unmounts.
