## 2023-10-24 - Focus Management in Disappearing UI
**Learning:** When interactive elements (like an "X" clear button) are removed from the DOM (because they only show conditionally based on state), focus is completely lost for keyboard and screen reader users. This leaves users stranded in the body element.
**Action:** When creating components with conditional UI that removes itself upon interaction, explicitly manage focus by adding a `useRef` to a relevant nearby input or element, and call `.focus()` right before or alongside the state update that causes the unmount.

## 2026-10-01 - Added ARIA attributes to Loading/Skeleton blocks
**Learning:** Found multiple loading states (spinner, skeletons, cat-gif) using `div` elements visually representing a status, but lacking semantic ARIA roles for screen readers. Added `role="status"`, `aria-label="Loading"`, `aria-busy="true"`, and `aria-live="polite"`.
**Action:** Always ensure that visual loading indicators are semantically exposed to assistive technologies so users know the system is working and not frozen.

## 2024-10-31 - Keyboard Shortcuts for Inputs
**Learning:** Adding a global keyboard shortcut to focus search inputs improves keyboard accessibility and productivity, but we must ignore shortcuts if the user is already typing in an input or textarea to prevent hijacking normal text entry. Also, providing an `aria-keyshortcuts` property and a visible `<kbd>` element improves discoverability.
**Action:** When adding global keyboard shortcuts for inputs, attach `aria-keyshortcuts` to the input element, ensure event listeners check `document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA"`, and provide a visible UI cue (like a `<kbd>` tag) that can be hidden when the input has a value or is focused.
