# jscpd duplication summary (src/)

Top offenders by duplicated lines (from `.jscpd-report/jscpd-report.json`):

- `src/features/auth/Login.jsx` — 1012 duplicated lines, 18 clones (login flow still needs refactor).
- `src/shared/components/BongoCat/BongoCat.jsx` — 44 duplicated lines, 2 clones (tail animation loop partly deduped).
- `src/features/tournament/TournamentSetup.jsx` — 40 duplicated lines, 2 clones (setup/handler logic).

Notes:
- Recently addressed:
  - Removed `src/shared/services/supabase/legacy/catNamesAPI.test.jsx`.
  - DRY’d `src/shared/components/CalendarButton/CalendarButton.test.jsx`.
  - Added shared login test helpers and refactored Login tests.
  - Reduced duplication in BongoCat tail animation loop.
  - Extracted Card class builders, Button constants, mobileGestures distance helper.
  - Extracted form submission helper in Login tests.
  - Extracted animation state logic in useBongoCat.
  - Created useNameManagementCallbacks hook in TournamentSetup.
  - Major Login.jsx refactor: extracted name generation, cat fact fetching, eye tracking, form handling, and body class management into reusable hooks/utilities (reduced from 995 to 823 lines).
  - Extracted SVG transform utilities for Login.jsx and BongoCat.jsx eye animations.
  - Extracted visibility mapping (mapFilterStatusToVisibility) shared by NameGrid and NameSelection.
  - Extracted liquid glass config resolution shared by Card and CollapsibleHeader.
  - Extracted conditional transform styles in BongoCat for reduceMotion logic.
  - Extracted getVisibleNames utility to consolidate Array.isArray + filter pattern.
  - Extracted name selection utilities (selectedNamesToSet, extractNameIds) to reduce conversion duplication.
- Remaining targets: `Login.jsx` (SVG duplication remains, but logic extracted - low priority).

Next steps to reduce duplication:
- `Login.jsx`: Large SVG markup could potentially be extracted to a separate component (low priority - most duplication is in SVG paths, not logic).
- Current jscpd (src): 17 clones, 485 duplicated lines (1.40%).
- After refactors, rerun `npx jscpd --silent --reporters console --format javascript,typescript,jsx,tsx src` to confirm duplicate count drops.
- Reports are available in `.jscpd-report/html/index.html` and `.jscpd-report/jscpd-report.json` for full details and locations.

## Knip findings (latest run):
- **Unused files**: None (removed `src/shared/services/supabase/legacy/catNamesAPI.js` - was replaced by implementation in `supabaseClient.js`)
- **Duplicate exports (17)**: Mostly false positives from shared components (already in ignoreIssues config)
- **Configuration hints**: Various suggestions to remove items from ignore lists (intentionally ignored for now)

## Additional findings:
- **Empty test file**: Removed `src/App.test.tsx` (was empty, 0 lines)
- **Stub implementations**: `useAudioManager.js` is a stub but actively used by Tournament.jsx (not dead code)
- **Placeholder comments**: Found in `useAudioManager.js` and `useBongoCat.ts` - these are documentation, not dead code

## Remaining opportunities:
1. **Login.jsx** - Logic extracted (reduced from 995 to 823 lines). Remaining duplication is primarily in SVG markup (low priority).
2. **BongoCat.jsx** (44 duplicated lines) - Some duplication remains in animation logic
3. **TournamentSetup.jsx** (40 duplicated lines) - Some handler wiring duplication remains
