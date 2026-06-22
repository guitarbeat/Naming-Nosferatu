1. **Add `aria-label` to Search Input in SelectCombobox**
   - The `<input>` element at `src/shared/components/ui/SelectCombobox.tsx:91` is used as a search box within the combobox dropdown but lacks an `aria-label` or explicit label, which is bad for accessibility (screen readers).
   - I'll add `aria-label="Search options"` to this input.
   - This fits perfectly with the `Palette` persona's goal of fixing small UX/a11y issues, and is safe and isolated.
   - This single micro-UX improvement is well within the 50 lines constraint and significantly helps keyboard and screen reader accessibility for this custom component.

2. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - I will use the `pre_commit_instructions` tool to run tests and verification.
3. **Submit the change.**
   - Commit and submit.
