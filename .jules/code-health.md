## 2026-08-20 - Suppressing type errors in testing
**Learning:** For test files, using `@ts-expect-error` is the correct convention to verify passing deliberately invalid input. Changing it to `as any` silences the type-checking error completely and should not be used in code health cleanup.
**Action:** Always maintain `@ts-expect-error` inside unit tests dealing with invalid edge-cases. Do not convert them to `as any`.
