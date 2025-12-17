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
- Remaining large targets: `Login.jsx`, `TournamentSetup.jsx`.
- Reports are available in `.jscpd-report/html/index.html` and `.jscpd-report/jscpd-report.json` for full details and locations.
