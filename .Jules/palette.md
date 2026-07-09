## 2026-06-18 - Added Proper ARIA roles to custom Tab Navigation
**Learning:** When building custom tab components from mapped arrays of button elements, using `role="tablist"`, `role="tab"`, and `aria-selected={condition}` is essential for proper screen reader communication and accessibility standards.
**Action:** Always ensure mapped button lists acting as tabs in custom navigation components include these explicit ARIA roles.
## 2026-06-23 - Accessibility of dynamically rendered icon-only buttons
**Learning:** When using components like `<X>` (from `lucide-react`) within an interactive container (like `<motion.button>`) specifically conditionally rendered via state (e.g., clearing a search input), it's easy to overlook `aria-label` because the element is dynamically injected.
**Action:** Always manually verify any temporary or conditionally rendered interactive elements for standard accessibility traits like `aria-label`, especially those handling contextual inputs like "Clear search".
## 2026-06-28 - Unified Iconography in Error Boundaries
**Learning:** Dismiss buttons in global components like `ErrorBoundary` often use plain text `x` characters for simplicity, but this breaks the visual consistency of the design system that relies on `lucide-react` for iconography.
**Action:** Always ensure that structural or global feedback components utilize the same standard icon library (`lucide-react` `<X />`) as the rest of the UI to maintain a cohesive look and feel.
## 2024-07-09 - Icon-only Button Tooltips & Semantic Containers
**Learning:** Adding ARIA labels to icon-only buttons is crucial for screen readers, but sighted users still lack context for these ambiguous icons. Using the native HTML `title` attribute elegantly provides tooltips on hover without the overhead of heavy UI libraries. Additionally, when providing an accessible name (`aria-label`) to structural containers like notifications, utilizing a semantic `<section>` is vastly preferred over `<div role="region">` to satisfy modern a11y linter rules (like Biome's).
**Action:** When adding or verifying icon-only buttons (like `lucide-react` icons inside raw buttons or shared `Button` components), always ensure both `aria-label` (for screen readers) and `title` (for sighted tooltips) are present. Prefer semantic tags (`<nav>`, `<section>`, `<main>`) for accessible landmark areas.
