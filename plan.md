1. **Add `aria-label` to the Refresh button in `AdminNamesTab.tsx`**
   - The `<Button onClick={onRefresh} variant="ghost" size="small">` only contains a `<Loader2 />` icon and is missing an `aria-label`.
   - I will use `replace_with_git_merge_diff` to add `aria-label="Refresh list"` to this button.

2. **Add `iconOnly` prop to the icon buttons in `AdminNamesTab.tsx`**
   - The hide/unhide, lock/unlock, and delete buttons in the table rows are icon-only but they don't have the `iconOnly={true}` prop passed to the `<Button>`.
   - The refresh button is also icon-only.
   - I will use `replace_with_git_merge_diff` to add `iconOnly` to these buttons.

3. **Verify Frontend UI**
   - Use `frontend_verification_instructions` and create a Playwright script to verify the admin page renders correctly and the tooltips/aria-labels are correctly applied.

4. **Complete Pre-commit Steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

5. **Submit the PR**
   - Submit the PR as Palette with the correct persona structure.
