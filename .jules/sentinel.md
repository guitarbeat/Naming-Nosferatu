# Sentinel's Security Journal 🛡️

## 2025-02-23 - CSV Formula Injection
**Vulnerability:** User input (names) starting with `=`, `+`, `-`, or `@` was exported directly to CSV, allowing Formula Injection when opened in Excel/LibreOffice.
**Learning:** Manual CSV generation often misses formula injection vectors, focusing only on delimiter escaping.
**Prevention:** Always sanitize CSV fields by prepending `'` to values starting with formula triggers, or use a library that handles this automatically.
