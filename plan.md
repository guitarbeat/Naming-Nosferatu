1. **Optimize `createTournamentId` using `createSortedKey`**
   - The `createTournamentId` function in `src/tournament/hooks.ts` currently sorts `names` IDs by manually using `.map((n) => String(n.id)).sort().join(",")`.
   - This duplicates the logic already found in `createSortedKey` inside `src/lib/utils.ts`.
   - Furthermore, `createNamesKey` already uses `createSortedKey` and returns the exactly same sorted key output.
   - We can optimize `createTournamentId` to accept the `namesKey` (which is already `useMemo`d) instead of `names` array, thereby avoiding O(N log N) sorting array operations and object allocations.
   - I will use `replace_with_git_merge_diff` to modify `createTournamentId` to accept `namesKey: string` and remove the internal sort mapping.
   - I will use `replace_with_git_merge_diff` to modify `useMemo(() => createTournamentId(names, userName), [names, userName])` to `useMemo(() => createTournamentId(namesKey, userName, names.length), [namesKey, userName, names.length])`.

2. **Complete Pre-commit Steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

3. **Submit the PR**
   - I will use the `submit` tool to create a pull request with the title `⚡ Bolt: Optimize createTournamentId sorting by reusing namesKey`.
