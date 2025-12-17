# jscpd duplication summary (src/)

Top offenders by duplicated lines (from `.jscpd-report/jscpd-report.json`):

- `src/features/auth/Login.jsx` — 1012 duplicated lines, 18 clones (large overlap within the login flow/components/tests).
- `src/shared/components/CalendarButton/CalendarButton.test.jsx` — 64 duplicated lines, 6 clones.
- `src/shared/components/BongoCat/BongoCat.jsx` — 44 duplicated lines, 2 clones.
- `src/features/tournament/TournamentSetup.jsx` — 40 duplicated lines, 2 clones.
- `src/shared/services/supabase/legacy/catNamesAPI.test.jsx` — 28 duplicated lines, 4 clones.

Notes:
- jscpd counted additional smaller duplicates (≤26 lines) across other files; the above are the highest by duplicatedLines in `src/`.
- Reports are available in `.jscpd-report/html/index.html` and `.jscpd-report/jscpd-report.json` for full details and locations.
