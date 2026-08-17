## 2024-05-19 - Home Sections Refactor
**Learning:** Extracting large inline components from a route file into a dedicated component file improves maintainability without impacting UX, and fixing mocks requires mapping named exports correctly instead of overriding entire modules.
**Action:** When extracting components used in mocked tests, use `importOriginal()` to spread the original module and only override the parts needed.
