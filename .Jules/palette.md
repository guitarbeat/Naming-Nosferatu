## 2026-06-18 - Added Proper ARIA roles to custom Tab Navigation
**Learning:** When building custom tab components from mapped arrays of button elements, using `role="tablist"`, `role="tab"`, and `aria-selected={condition}` is essential for proper screen reader communication and accessibility standards.
**Action:** Always ensure mapped button lists acting as tabs in custom navigation components include these explicit ARIA roles.
## 2026-06-23 - Accessibility of dynamically rendered icon-only buttons
**Learning:** When using components like `<X>` (from `lucide-react`) within an interactive container (like `<motion.button>`) specifically conditionally rendered via state (e.g., clearing a search input), it's easy to overlook `aria-label` because the element is dynamically injected.
**Action:** Always manually verify any temporary or conditionally rendered interactive elements for standard accessibility traits like `aria-label`, especially those handling contextual inputs like "Clear search".
## 2026-06-28 - Unified Iconography in Error Boundaries
**Learning:** Dismiss buttons in global components like `ErrorBoundary` often use plain text `x` characters for simplicity, but this breaks the visual consistency of the design system that relies on `lucide-react` for iconography.
**Action:** Always ensure that structural or global feedback components utilize the same standard icon library (`lucide-react` `<X />`) as the rest of the UI to maintain a cohesive look and feel.
## 2026-07-18 - Missing keyboard focus on custom generic buttons
**Learning:** When styling custom `<button>` elements across generic full-page flows (like tournament completion or results screens), it's easy to omit standard keyboard focus indicators (like `focus-visible:ring`), making them inaccessible for keyboard users despite functioning perfectly for pointer devices.
**Action:** Always verify tab navigation and explicitly add focus states (`focus-visible:outline-none focus-visible:ring-2 ...`) to any custom-styled interactive element, especially on custom landing/completion screens.
