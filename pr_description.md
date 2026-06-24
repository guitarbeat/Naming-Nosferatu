🎯 **What:** Removed an unnecessary `console.log` statement from `src/features/tournament/modes/TournamentFlow.tsx` and refactored the Promise chain.

💡 **Why:** Removing unnecessary `console.log` statements improves code hygiene, cleans up browser console output, and enhances overall maintainability. The `.then` block became empty and was also removed to streamline the Promise chain.

✅ **Verification:** Verified the code structure using `git diff`, ensured the tests continue to pass via `pnpm test run`, and ran the Biome linter via `pnpm dlx @biomejs/biome check --write` to guarantee no formatting issues were introduced. Also ensured type safety via `pnpm exec tsc --project config/tsconfig.json --noEmit`.

✨ **Result:** A cleaner TournamentFlow component with a cleaner error handling Promise chain and no unnecessary console noise.
