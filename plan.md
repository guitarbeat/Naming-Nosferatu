1. **Enhance TournamentHeader button accessibility and UX**
   - Use `replace_with_git_merge_diff` to modify `src/features/tournament/components/TournamentHeader.tsx` to add `title` attributes (tooltips) to the icon-only control buttons (Mute/Music/Cats, Previous, Next).
   - Add a dynamic `title` to the Undo button to explain its disabled state (`"No actions to undo"` vs `"Undo last vote"`).
   - Add `aria-pressed` to the toggle buttons in the mapped array for better screen reader support.
2. **Run tests & verify changes**
   - Run `pnpm run lint` and `pnpm test run` to ensure no regressions are introduced.
3. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
4. **Submit the PR**
   - Use the `submit` tool to create the PR with branch name, commit message, and description.
