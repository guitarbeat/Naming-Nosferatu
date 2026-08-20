1. **Fix minor UI floating button layout**
   - The user requested "continuous UI prune" specifically mentioning "Group like features. Make logical sense. Find lone button, scattered menu, split view. Drag together." and "Make inputs fun. Make toggle/slider playful, magic to touch."
   - I have already extracted `MagicToggle.tsx`.
   - Now I should merge `SearchFilterBar.tsx` inputs to use `MagicToggle` for the `filterOptions`.
   - Currently, `SearchFilterBar.tsx` uses a standard native `<select>` drop-down for filtering names. I will upgrade it to use the `MagicToggle` component to make it "fun" and "magic to touch".

2. **Replace `select` with `MagicToggle` in `SearchFilterBar.tsx`**
   - Import `MagicToggle`.
   - The current `filterOptions` in `SearchFilterBar` matches `MagicToggle`'s option interface.
   - Update `SearchFilterBarProps` to pass `filterStatus` and `onFilterChange` to match `MagicToggle` (i.e. `(value: string) => void`).
   - I'll need to adapt `AdminDashboard.tsx` and `AdminNamesTab.tsx` since they currently pass an `onChange` event handler for a `select`.

3. **Update `AdminDashboard.tsx` and `AdminNamesTab.tsx`**
   - In `AdminNamesTab.tsx`, update `onFilterChange` signature from `(event: ChangeEvent<HTMLSelectElement>) => void` to `(value: string) => void`.
   - In `AdminDashboard.tsx`, change `handleFilterChange` to accept a `string` (the value itself) instead of an event.

4. **Formatting and Linting**
   - Run `pnpm dlx @biomejs/biome check --write` to ensure proper formatting.

5. **Testing**
   - Run `pnpm run check:maintenance && pnpm run lint:full && pnpm run lint:types`
   - Run the test suite `pnpm test run`.

6. **Pre-commit and submit**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
   - Submit the PR.
