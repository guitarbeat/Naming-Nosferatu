<thinking>
- Momentum: Continuing continuous UI prune.
- Smash: Replace deprecated `SegmentedControl` with `MagicToggle` across the dashboard analytics views for playful timeframe selection.
- Clean: Delete the dead `SegmentedControl.tsx` component file and replace all references with `MagicToggle`.
- Routing: Front page UI is mostly clean; pivoting to micro-clean phase (clearing dead CSS/files, fixing types, fast rendering).
</thinking>

1. **Replace `SegmentedControl` in `Dashboard.tsx`**
   - Use `replace_with_git_merge_diff` on `src/features/dashboard/components/analytics/Dashboard.tsx` to change the `SegmentedControl` import and usage to `MagicToggle`.
2. **Replace `SegmentedControl` in `RecentActivityPanel.tsx`**
   - Use `replace_with_git_merge_diff` on `src/features/dashboard/components/analytics/components/RecentActivityPanel.tsx` to change the `SegmentedControl` import and usage to `MagicToggle`.
3. **Delete `SegmentedControl.tsx`**
   - Use `delete_file` on `src/shared/components/ui/SegmentedControl.tsx` since it's fully deprecated by `MagicToggle`.
4. **Format and lint**
   - Run `pnpm dlx @biomejs/biome check --write src/features/dashboard/components/analytics/Dashboard.tsx src/features/dashboard/components/analytics/components/RecentActivityPanel.tsx` to ensure code is properly formatted.
5. **Verify changes (Test)**
   - Run `pnpm test run` to ensure tests pass without the removed component.
6. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
