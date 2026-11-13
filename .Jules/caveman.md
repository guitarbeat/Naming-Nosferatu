<strict_log>
- Momentum: Started caveman UI prune.
- Smash: Grouped TournamentDock controls. Ripped dock footer logic out of massive TournamentSetup.tsx.
- Clean: Moved to `src/components/ui/TournamentDock.tsx`. Fixed linting, kept types clean. Setup file lighter.
- Memory Update: Dock logic decoupled. Setup file smaller. Ready to deploy.
</strict_log>

<strict_log>
- Momentum: Found lone zoom buttons next to grouped MagicToolbar.
- Smash: Grouped 2 scattered zoom buttons into single playful MagicZoom component. Added to MagicToolbar.
- Clean: Extracted MagicZoom to `components/ui/MagicZoom.tsx`. Kept main bracket file light.
- Memory Update: Remember bracket toolbar is now fully unified with zoom. Forget old scattered buttons. Strike next: lone restart button in TournamentStatusWidget.
</strict_log>
