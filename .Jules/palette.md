## 2023-10-24 - Focus Management in Disappearing UI
**Learning:** When interactive elements (like an "X" clear button) are removed from the DOM (because they only show conditionally based on state), focus is completely lost for keyboard and screen reader users. This leaves users stranded in the body element.
**Action:** When creating components with conditional UI that removes itself upon interaction, explicitly manage focus by adding a `useRef` to a relevant nearby input or element, and call `.focus()` right before or alongside the state update that causes the unmount.

## 2026-10-01 - Added ARIA attributes to Loading/Skeleton blocks
**Learning:** Found multiple loading states (spinner, skeletons, cat-gif) using `div` elements visually representing a status, but lacking semantic ARIA roles for screen readers. Added `role="status"`, `aria-label="Loading"`, `aria-busy="true"`, and `aria-live="polite"`.
**Action:** Always ensure that visual loading indicators are semantically exposed to assistive technologies so users know the system is working and not frozen.

## 2023-10-24 - Keyboard Shortcuts for Text Inputs
**Learning:** Adding global keyboard shortcuts (like `/` for search) is extremely helpful for power users and keyboard navigators, but it can cause frustrating UX if the shortcut triggers while the user is already typing in another text field. Moreover, keyboard shortcuts aren't discoverable unless visually indicated.
**Action:** When implementing global keyboard shortcuts for inputs, strictly ensure the event listener ignores triggers if `document.activeElement?.tagName` is 'INPUT' or 'TEXTAREA'. Always accompany these shortcuts with an `aria-keyshortcuts` attribute on the element and a visual `<kbd>` hint for accessibility and discoverability.
