<strict_log>
- Momentum: Trigger continuous UI prune. Caveman Smash UI.
- Smash: Ripped front page components (AppLayout, AppShell, HomeView, HomeRoute) out of App.tsx into separate files in `src/components/ui/`. App.tsx is lighter now.
- Clean: Fixed import/export indexing in components/index.ts to maintain backwards compatibility. Linters pass.
- Memory Update: Remember App.tsx split into AppShell, AppLayout, and HomeView. Caveman happy. Next strike: check other sub-components to extract or clean up dead code.
</strict_log>
