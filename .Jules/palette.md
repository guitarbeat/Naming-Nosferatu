## 2024-10-24 - Keyboard Accessible File Inputs
**Learning:** Using `display: none` on file inputs removes them from the accessibility tree, preventing keyboard users from uploading files.
**Action:** Use `sr-only` (visually hidden) on the input and apply `focus-within` styles to the parent label to show a focus ring when the input is focused.
