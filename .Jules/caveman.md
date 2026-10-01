<strict_log>
- Momentum: Extracted TournamentHeader component to shrink TournamentArena file size and simplify it.
- Smash: Ripped BracketTree, TournamentHeader, ContextRibbon, ProgressBar, HeaderControls, HeaderTitle out of TournamentArena.
- Clean: Dropped them in `components/ui/TournamentHeader.tsx`. Cleaned up imports and formatting.
- Memory Update: Arena header is now in components/ui.
</strict_log>
