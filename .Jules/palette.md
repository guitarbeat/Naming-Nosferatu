## 2024-05-24 - NameCard Tooltip Accessibility
**Learning:** Tooltips that rely solely on `mousemove` events exclude keyboard users and screen readers. Even if a card isn't strictly "interactive" (clickable for action), if it holds metadata, it should be focusable to reveal that data.
**Action:** When implementing tooltips, always bind visibility to both hover/mouse events AND focus/blur events. Ensure the trigger element is focusable (tabindex="0") if it's not natively interactive.

## 2025-12-16 - [Accessibility] Mouse-only Tooltips
**Learning:** `NameCard` relied solely on `mousemove` for tooltips, making rich metadata inaccessible to keyboard users.
**Action:** When implementing hover overlays, always pair `mousemove`/`mouseenter` with `focus` and `mouseleave` with `blur`, ensuring the element is focusable or attached to the interactive container.
