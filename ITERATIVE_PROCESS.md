# Iterative Workflow Guide

1. **After each change, run lint:**
   - Command: `npm run lint`.
   - Address all errors and warnings, with priority on resolving TypeScript errors before anything else.

2. **Fix TypeScript issues first:**
   - Treat `tsc` failures as blocking.
   - Do not proceed to UI/browser checks until TypeScript errors are cleared.

3. **Usability tests (on request):**
   - Only after lint (including TypeScript) is clean.
   - Use the in-tab browser actions to: select two names, start a tournament, play through to completion, view the results page, and verify the reordering feature.

4. **If lint fails:**
   - Stop and report the failing files and diagnostics.
   - Apply minimal fixes needed to get back to a clean lint run before continuing.

5. **If a usability test is requested while lint/TypeScript fails:**
   - Report the blocking issues and resolve them first, then run the browser test flow.
