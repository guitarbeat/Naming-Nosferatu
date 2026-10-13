## 2026-10-01 - Remove Unused useShallow Re-export
**Learning:** Removing unused re-exports (such as ) from store entry points cleans up dead exports flagged by static analysis tools like Knip.
**Action:** Re-exported components in barrel files (like ) must be aligned with unused file checks to prevent linting failures.
## 2026-10-01 - Remove Unused useShallow Re-export
**Learning:** Removing unused re-exports from store modules keeps the export surface minimal and cleans up dead export warnings from Knip.
**Action:** Always verify barrel files and exports after refactoring store modules to maintain clean static analysis results.
