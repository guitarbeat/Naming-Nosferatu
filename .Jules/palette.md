## 2026-06-18 - Added Proper ARIA roles to custom Tab Navigation
**Learning:** When building custom tab components from mapped arrays of button elements, using `role="tablist"`, `role="tab"`, and `aria-selected={condition}` is essential for proper screen reader communication and accessibility standards.
**Action:** Always ensure mapped button lists acting as tabs in custom navigation components include these explicit ARIA roles.

## 2026-06-18 - Added explicit aria-label to Admin Image Upload Input
**Learning:** Inputs without explicit `<label>` elements or visible labels attached to them via `id` or `htmlFor` attributes must have an `aria-label` attribute to remain accessible.
**Action:** When a raw `<input type="file" />` is used without an associated `<label>` tag, explicitly provide an `aria-label` describing the action, e.g., "Upload image file".
