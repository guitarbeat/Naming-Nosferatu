## 2024-10-30 - Added Search Keyboard Shortcut
**Learning:** Added global keyboard shortcut (/) to quickly jump to search input in MagicControls for keyboard navigation a11y. Ensures to check for inputs/textareas to not intercept actual typing.
**Action:** Always add keyboard shortcuts where possible for quick focus to important actions, with kbd hints for discoverability.
## 2024-11-20 - Global Keyboard Shortcuts Rejected
**Learning:** A PR to add a global '/' search shortcut was closed as a duplicate of an earlier PR. The maintainers explicitly removed global keyboard shortcuts in a previous commit (97c429d2).
**Action:** Do not attempt to re-introduce global keyboard shortcuts (like '/') unless explicitly requested or the design direction changes, as this is a known design constraint.
