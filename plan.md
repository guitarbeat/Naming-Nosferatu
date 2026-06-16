1. **Analyze AdminTabNav Component**
   - Review `src/features/dashboard/components/admin/components/AdminTabNav.tsx`.
   - The `AdminTabNav` component maps over tabs array and generates `<button>` elements for navigation.
   - It is missing accessibility attributes: `role="tablist"` on the container and `role="tab"` and `aria-selected` on the buttons.

2. **Implement Accessibility Enhancements**
   - Add `role="tablist"` to the container `<div>`.
   - Add `role="tab"` to each `<button>`.
   - Add `aria-selected={activeTab === tab.id}` to each `<button>`.

3. **Complete pre commit steps**
   - Complete pre commit steps to ensure proper testing, verification, review, and reflection are done.

4. **Verify the Changes**
   - Use `git diff` to confirm the changes.
   - Run tests `pnpm run test` to make sure there's no regression.
