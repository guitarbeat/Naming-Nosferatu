## 2025-05-23 - File Input Accessibility
**Learning:** `input[type="file"]` hidden with `display: none` removes it from the accessibility tree, making it impossible for keyboard users to upload files.
**Action:** Use `className="sr-only"` on the input and add `focus-within` styles (e.g., ring) to the parent label to maintain accessibility and visual focus feedback.
