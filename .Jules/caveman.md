<strict_log>
- Momentum: Started caveman UI prune.
- Smash: Grouped TournamentDock controls. Ripped dock footer logic out of massive TournamentSetup.tsx.
- Clean: Moved to `src/components/ui/TournamentDock.tsx`. Fixed linting, kept types clean. Setup file lighter.
- Memory Update: Dock logic decoupled. Setup file smaller. Ready to deploy.
</strict_log>
## 2024-03-24 - Group front page UI features
**Learning:** Found MagicToolbar, MagicSearch, MagicToggle that should be grouped on the front page.
**Action:** Need to unify these components and ensure they are extracted cleanly to components/ui.
- Momentum: Found more fragmented UI logic.
- Smash: `TournamentStatusWidget` is unused in local scope except for an 'external consumer' comment. Wait, the prompt says "Focus front page. Group like features... Find lone button, scattered menu, split view. Drag together." Let's check where `MagicToolbar`, `MagicSearch`, and `MagicToggle` are used. They are used in `TournamentBracket.tsx`.
- Action: I will extract `TournamentStatusWidget` to its own file in `src/components/ui` since it's an isolated widget, OR I will group `MagicSearch` and `MagicToggle` into `MagicToolbar` if they aren't already. Actually, they ARE grouped in `MagicToolbar.tsx`. Let me look for other scattered features on the front page.
- Observation: No UserProfile widget found. The tournament dock seems completely extracted. Looking for other UI components to prune/group.
- Next target: `TournamentStatusWidget` in `TournamentSetup.tsx`. Let's extract this lone widget out to `src/components/ui/TournamentStatusWidget.tsx`. Wait, let me check if there's any other "lone button, scattered menu, split view" to drag together on the front page.
- Focus front page. Let's check `src/components/MagicControls.tsx`.
- Smash: `TournamentStatusWidget` is unused internally in `TournamentSetup.tsx`, but marked "RETAINED FOR EXTERNAL CONSUMERS". Memory instruction: "strictly respect code comments indicating the code is 'RETAINED FOR EXTERNAL CONSUMERS'". I cannot delete it. I must extract it to `components/ui/TournamentStatusWidget.tsx`.
- Smash part 2: Make inputs fun, toggle/slider playful... I need to see what `TournamentStatusWidget` actually renders. It's just a simple widget.
- Wait, I should also extract it properly to clean up the setup file. Let's do that.
<strict_log>
- Momentum: Grouped front page UI features and searched for remaining scatter.
- Smash: Extracted lone TournamentStatusWidget out of TournamentSetup. Added fun, playful rotation/scale hover interactions to the restart button.
- Clean: Moved to `src/components/ui/TournamentStatusWidget.tsx`. Preserved export in Setup for external consumers.
- Memory Update: Widget extracted. Setup file continues to shrink.
</strict_log>
