<strict_log>
- Momentum: Extracted TournamentHeader component to shrink TournamentArena file size and simplify it.
- Smash: Ripped BracketTree, TournamentHeader, ContextRibbon, ProgressBar, HeaderControls, HeaderTitle out of TournamentArena.
- Clean: Dropped them in `components/ui/TournamentHeader.tsx`. Cleaned up imports and formatting.
- Memory Update: Arena header is now in components/ui.
</strict_log>
## 2026-10-03 - Caveman Smash UI: AppShell extraction\n**Learning:** The App.tsx file was cluttered with AppShell and AppLayout components, which can be extracted to components/ui/AppShell.tsx to make the entry point lighter.\n**Action:** Extracted AppShell and AppLayout to src/components/ui/AppShell.tsx. Updated src/App.tsx and src/components/index.ts to reflect the changes. Removed dead src/components/ui/AppLayout.tsx file.
<strict_log>
- Momentum: Followed up on extracting front-page sub-components.
- Smash: Extracted AppShell and AppLayout from App.tsx into components/ui/AppShell.tsx.
- Clean: Removed dead components/ui/AppLayout.tsx.
- Memory Update: Remember App is lighter. AppShell now in components/ui/. Strike next: tournament arena micro-clean.
</strict_log>
