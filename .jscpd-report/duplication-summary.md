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
- Remaining large targets: `Login.jsx` (main component still has significant duplication).

Next steps to reduce duplication:
- `Login.jsx`: extract shared form/validation handlers and cat-fact fetch into a hook/util reused across login flows.
- Current jscpd (src): 23 clones, 689 duplicated lines (1.99%).
- After refactors, rerun `npx jscpd --silent --reporters console --format javascript,typescript,jsx,tsx src` to confirm duplicate count drops.
- Reports are available in `.jscpd-report/html/index.html` and `.jscpd-report/jscpd-report.json` for full details and locations.

## Knip findings (latest run):
- **Unused files (1)**: `src/shared/services/supabase/legacy/catNamesAPI.js` (may be imported via re-exports, verify before removal)
- **Duplicate exports (17)**: Mostly false positives from shared components (already in ignoreIssues config)
- **Configuration hints**: Various suggestions to remove items from ignore lists (intentionally ignored for now)
