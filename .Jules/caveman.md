
<strict_log>
- Momentum: Extracted MagicSearch, MagicToggle, and MagicToolbar from `src/components/MagicControls.tsx`.
- Smash: Created individual files `src/components/ui/MagicSearch.tsx`, `src/components/ui/MagicToggle.tsx`, `src/components/ui/MagicToolbar.tsx`.
- Clean: Removed extracted components from `src/components/MagicControls.tsx`, keeping `HomeView`. Updated imports in `src/tournament/TournamentBracket.tsx`.
- Memory Update: Remember MagicControls UI sub-components are now cleanly extracted into `components/ui/`. Strike next: check `TournamentSetup.tsx` for similar sub-components.
</strict_log>
