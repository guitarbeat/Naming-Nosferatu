## 2024-05-14 - Custom Component Focus States
**Learning:** Custom interactive components (like inline toggles or overlaid search inputs) often miss the `focus-visible` ring styles that native elements get, leading to poor keyboard navigation visibility.
**Action:** Always ensure that `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background` is applied to custom focusable elements like the buttons in `MagicToggle` and the clear button in `MagicSearch`.

## 2024-05-18 - Input Focus Lost on Clear Button Unmount
**Learning:** In the `MagicSearch` component, the conditionally rendered clear button (`<X />`) causes a focus loss accessibility issue. When a user navigates to the clear button via keyboard and interacts with it, the button unmounts because the `searchQuery` becomes empty. This causes the browser's focus to revert to the document body, breaking the keyboard navigation flow.
**Action:** When creating conditionally rendered interactive elements like an 'X' clear button inside or near an input, always capture a `useRef` of the adjacent input and explicitly call `.focus()` on it during the clear action to maintain continuous keyboard/screen reader focus.
