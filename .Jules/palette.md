## 2024-05-14 - Custom Component Focus States
**Learning:** Custom interactive components (like inline toggles or overlaid search inputs) often miss the `focus-visible` ring styles that native elements get, leading to poor keyboard navigation visibility.
**Action:** Always ensure that `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background` is applied to custom focusable elements like the buttons in `MagicToggle` and the clear button in `MagicSearch`.

## 2024-05-15 - Unmounting Focus Loss in Conditional UI
**Learning:** When conditional interactive UI elements (like an 'X' clear button) are unmounted upon interaction, keyboard and screen reader focus is lost in the DOM, creating an inaccessible experience.
**Action:** When creating components with conditional unmounting UI, explicitly manage focus by adding a `useRef` to a nearby relevant element (such as the main input) and calling `.focus()` on interaction.
