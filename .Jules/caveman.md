<strict_log>
- Momentum: Extracted TournamentHeader component to shrink TournamentArena file size and simplify it.
- Smash: Ripped BracketTree, TournamentHeader, ContextRibbon, ProgressBar, HeaderControls, HeaderTitle out of TournamentArena.
- Clean: Dropped them in `components/ui/TournamentHeader.tsx`. Cleaned up imports and formatting.
- Memory Update: Arena header is now in components/ui.
</strict_log>
## 2026-10-12 - Extracted AppLayout and HomeView
**Learning:** App.tsx was too heavy with layout code, violating the persona's mandate to keep main files light. Unused MagicZoom export in index.ts broke TS build when checking index file.
**Action:** Replaced inline `AppLayout` and `HomeRoute` definitions with imports from `@/components` after ensuring the components actually exist in `src/components/ui/`. Removed unused `MagicZoom` export.
<strict_log>
- Momentum: Extracted TournamentStatusWidget component from HomeView to keep it light. Cleaned unused files and type definitions.
- Smash: Dropped public/sw.js and unused VisualBracketTree type export.
- Clean: Formatted TournamentStatusWidget.tsx. Checked typescript and knip.
- Memory Update: Codebase is leaner and type-checked cleanly.
</strict_log>
## 2026-10-14 - Cleaned unused sw.js and unused export
**Learning:** `sw.js` and `VisualBracketTree` export were unused and failing Knip.
**Action:** Deleted `public/sw.js`, removed `export` from `VisualBracketTree`, and ran linters.
