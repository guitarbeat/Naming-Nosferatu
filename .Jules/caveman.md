<strict_log>
- Momentum: Started caveman UI prune.
- Smash: Grouped TournamentDock controls. Ripped dock footer logic out of massive TournamentSetup.tsx.
- Clean: Moved to `src/components/ui/TournamentDock.tsx`. Fixed linting, kept types clean. Setup file lighter.
- Memory Update: Dock logic decoupled. Setup file smaller. Ready to deploy.
</strict_log>
<strict_log>
- Momentum: Extracted TournamentDock earlier. Continuing UI prune of tournament features.
- Smash: Grouped TournamentHeader and BracketTree from `src/tournament/TournamentComplete.tsx`. Grouped MatchSideCard from `src/tournament/TournamentArena.tsx`. Kept `TournamentStatusWidget` as it is retained for external consumers.
- Clean: Extracted TournamentHeader and BracketTree into `src/components/ui/TournamentHeader.tsx`. Extracted MatchSideCard into `src/components/ui/MatchSideCard.tsx`.
- Memory Update: Tournament components modularized. Front page main files are now much lighter. Ready to pivot to micro-clean.
</strict_log>
