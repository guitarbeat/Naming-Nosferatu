1. Use `run_in_bash_session` to write `src/components/ui/TournamentAnnouncements.tsx` with exactly the code from `src/tournament/TournamentArena.tsx` lines for `TournamentAnnouncementsProps`, `StreakBurst` and `TournamentAnnouncements`. We'll extract lines 319-561 which represent `StreakBurst`, `TournamentAnnouncementsProps` and `TournamentAnnouncements` and prepend required imports (`AnimatePresence`, `motion` from `framer-motion`, `Trophy` from `lucide-react`, `memo` from `react`, `BracketTree` from `@/components/ui/TournamentHeader`, `MOTION_DURATIONS` from `@/lib/uiUtils`, and `HeatLevel`, `getFlameCount`, `getHeatTextClasses` from `@/tournament/tournamentEngine`).
2. Verify the new file by using `run_in_bash_session` to run `cat src/components/ui/TournamentAnnouncements.tsx` and ensure it's successfully written.
3. Use `run_in_bash_session` with `sed -i '319,561d' src/tournament/TournamentArena.tsx` to remove the extracted component block.
4. Run `cat src/tournament/TournamentArena.tsx | grep TournamentAnnouncements` to verify the removal from the body of the file was successful.
5. Use `replace_with_git_merge_diff` to add `export * from "./ui/TournamentAnnouncements";` to `src/components/index.ts`.
6. Use `replace_with_git_merge_diff` to update `src/tournament/TournamentArena.tsx` to import `TournamentAnnouncements` and `StreakBurst` from `@/components`.
7. Use `run_in_bash_session` to run tests and checks (`pnpm run lint` and `pnpm test`).
8. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
