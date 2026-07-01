## 2026-06-18 - Added Proper ARIA roles to custom Tab Navigation
**Learning:** When building custom tab components from mapped arrays of button elements, using `role="tablist"`, `role="tab"`, and `aria-selected={condition}` is essential for proper screen reader communication and accessibility standards.
**Action:** Always ensure mapped button lists acting as tabs in custom navigation components include these explicit ARIA roles.
## 2026-06-23 - Accessibility of dynamically rendered icon-only buttons
**Learning:** When using components like `<X>` (from `lucide-react`) within an interactive container (like `<motion.button>`) specifically conditionally rendered via state (e.g., clearing a search input), it's easy to overlook `aria-label` because the element is dynamically injected.
**Action:** Always manually verify any temporary or conditionally rendered interactive elements for standard accessibility traits like `aria-label`, especially those handling contextual inputs like "Clear search".
## 2026-06-28 - Unified Iconography in Error Boundaries
**Learning:** Dismiss buttons in global components like `ErrorBoundary` often use plain text `x` characters for simplicity, but this breaks the visual consistency of the design system that relies on `lucide-react` for iconography.
**Action:** Always ensure that structural or global feedback components utilize the same standard icon library (`lucide-react` `<X />`) as the rest of the UI to maintain a cohesive look and feel.
## 2026-07-01 - Dynamic Search Input Accessibility
**Learning:** When adding inline dynamic search/filtering features like the "Search hidden names" input, it's easy to rely just on the `placeholder` for context. This makes it difficult for screen readers to announce the purpose of the input properly when focused.
**Action:** Always verify that contextual search `<input>` fields specifically have an explicit `aria-label` attribute if they do not have a dedicated `<label>` element linked via `id`.
## 2026-07-01 - Toggle Button State Communication
**Learning:** Custom UI buttons acting as toggles (like "Selected only" filters) typically rely on conditional CSS classes for visual active states, but this information is lost to assistive technology.
**Action:** Always accompany visual toggle states on buttons with `aria-pressed={booleanState}` to clearly communicate the active status of the filter or option to screen readers.
