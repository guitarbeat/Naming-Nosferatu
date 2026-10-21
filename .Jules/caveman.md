<strict_log>
- Momentum: Extracted TournamentHeader component to shrink TournamentArena file size and simplify it.
- Smash: Ripped BracketTree, TournamentHeader, ContextRibbon, ProgressBar, HeaderControls, HeaderTitle out of TournamentArena.
- Clean: Dropped them in `components/ui/TournamentHeader.tsx`. Cleaned up imports and formatting.
- Memory Update: Arena header is now in components/ui.
</strict_log>
## 2026-10-12 - Extracted AppLayout and HomeView
**Learning:** App.tsx was too heavy with layout code, violating the persona's mandate to keep main files light. Unused MagicZoom export in index.ts broke TS build when checking index file.
**Action:** Replaced inline `AppLayout` and `HomeRoute` definitions with imports from `@/components` after ensuring the components actually exist in `src/components/ui/`. Removed unused `MagicZoom` export.
## 2023-10-19 - Group MagicSearch and MagicToggle in TournamentBracket
**Learning:** Found scattered UI components (`MagicSearch` and `MagicToggle`) in `TournamentBracket`.
**Action:** Grouped them together into a new `MagicToolbar` component in `src/components/ui/MagicToolbar.tsx` to clean up the front page and make logical sense.
## 2023-10-20 - Extracted TournamentComplete from TournamentArena
**Learning:** `TournamentArena.tsx` was getting very heavy due to having the `TournamentComplete` component in it.
**Action:** Created `src/components/ui/TournamentComplete.tsx` containing `TournamentComplete` component and extracted it from `TournamentArena.tsx` to lighten up the main file.
