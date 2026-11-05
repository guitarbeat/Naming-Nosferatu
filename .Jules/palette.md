## 2024-11-05 - Add tooltips to disabled Undo buttons
**Learning:** Found that the "Undo" buttons in both `src/components/ui/TournamentDock.tsx` and `src/tournament/TournamentComplete.tsx` are disabled when undo is not possible, but they lack a `title` attribute to explain *why* they are disabled or what they do when disabled.
**Action:** Adding a `title` attribute (e.g. `title={!ts.canUndo ? "Nothing to undo" : "Undo last vote"}`) provides helpful context, especially when a button is in a disabled state, improving accessibility and user experience.
