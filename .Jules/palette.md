## 2024-05-23 - Accessibility in Lightbox components
**Learning:** Icon-only buttons in overlay components like Lightbox often miss `aria-label` because they are visually obvious but invisible to screen readers.
**Action:** Always check `Lightbox`, `Modal`, and `Dialog` components for icon-only close/navigation buttons and ensure they have `aria-label`.
