## 2024-10-25 - Search Keyboard Discoverability
**Learning:** Global search shortcuts (like `/`) are a common pattern, but their discoverability suffers if users aren't told they exist. The focus must also correctly ignore existing active text inputs to prevent conflict.
**Action:** Always add an `aria-keyshortcuts` attribute for screen readers and a visual `<kbd>` hint inside the input element that fades out gracefully when focused, ensuring both visual and structural discoverability.
