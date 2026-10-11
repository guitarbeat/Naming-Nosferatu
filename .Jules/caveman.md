## 2024-10-11 - Caveman UI Pruner Smash
**Learning:** Main App.tsx file was cluttered with routing, loading overlays, global errors, and other top-level layout responsibilities.
**Action:** Extracted AppLayout to src/components/ui/AppLayout.tsx and HomeRoute to src/components/ui/HomeView.tsx. Kept App.tsx light and focused on shell setup, error handling, and routing structure. Fixed test regressions from storage security logic changes.
