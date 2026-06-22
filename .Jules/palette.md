## 2026-06-18 - Added Proper ARIA roles to custom Tab Navigation
**Learning:** When building custom tab components from mapped arrays of button elements, using `role="tablist"`, `role="tab"`, and `aria-selected={condition}` is essential for proper screen reader communication and accessibility standards.
**Action:** Always ensure mapped button lists acting as tabs in custom navigation components include these explicit ARIA roles.
## 2026-06-21 - Adding aria-labels to Input components
**Learning:** The custom `Input` component does not enforce accessible labels out-of-the-box, meaning consumers like `ProfileInner.tsx` which render inputs with only placeholder text are invisible to screen readers without an explicit `label` or `aria-label` prop.
**Action:** Always explicitly verify that custom form fields, especially those lacking visual labels (relying only on icons and placeholders), include an `aria-label` or `aria-labelledby` prop to satisfy WCAG criteria and provide context to assistive technologies.
