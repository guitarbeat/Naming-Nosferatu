<strict_log>
- Momentum: Just landed. Found `MagicControls.tsx` has `MagicSearch`, `MagicToggle`, `MagicToolbar`.
- Smash: Extract these three pieces from `src/components/MagicControls.tsx` to `src/components/ui/MagicToolbar.tsx`.
- Clean: Keep `HomeView` in `MagicControls.tsx` (maybe rename it later, but let's keep it simple for now). Actually, let's just make `MagicToolbar.tsx` handle `MagicSearch`, `MagicToggle`, and `MagicToolbar`.
- Memory Update: Strike next: fix imports in `TournamentBracket.tsx` and `MagicControls.tsx`.
</strict_log>
