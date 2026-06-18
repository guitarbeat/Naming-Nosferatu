1. **Create MagicToggle component**
   - Use `write_file` to create `src/shared/components/ui/MagicToggle.tsx` with a playful framer-motion toggle for the layout mode.
2. **Update NameSelector to use MagicToggle**
   - Use `replace_with_git_merge_diff` on `src/features/tournament/components/NameSelector.tsx` to add `MagicToggle` for the Swipe vs Grid layout, moving it to a contextual location at the top of the selector.
3. **Prune redundant buttons from HomeRoute**
   - Use `replace_with_git_merge_diff` on `src/app/routes/HomeRoute.tsx` to rip out the dead "Back" and "Compare" buttons at the bottom of the page sections since `FloatingNavbar` handles this better.
4. **Prune layout-mode from FloatingNavbar**
   - Use `replace_with_git_merge_diff` on `src/shared/components/layout/FloatingNavbar.tsx` to remove the hidden `layout-mode` button.
   - Use `replace_with_git_merge_diff` on `src/shared/components/layout/FloatingNavbar.test.tsx` to remove the tests expecting `layout-mode` button.
5. **Lint and Test**
   - Run `pnpm dlx @biomejs/biome check --config-path config/biome.json --write src/` to ensure formatting.
   - Run `pnpm test run` to verify tests pass.
6. **Pre-commit Steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
