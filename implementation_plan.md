# Cleanup Deprecated Code Plan

## Goal
Remove technical debt identified in the "Orphans" and "Echo Chamber" audit sections. This involves deleting unreferenced log files and unused duplicate source files.

## User Review Required
> [!NOTE]
> `date.ts` and `cache.ts` are being deleted because they appear to be unused copies of logic present in `basic.ts`. Checks for imports of these files returned no results.

## Proposed Changes

### Root Directory
#### [DELETE] `*.txt`
- `all_errors.txt`, `api_errors.txt`, etc. (Error dumps)

### Source Code
#### [DELETE] `source/shared/utils/logger.ts`
- Unused utility file. `basic.ts` handles logging or standard `console` is used.

#### [DELETE] `source/shared/utils/date.ts`
- Duplicate of `formatDate` in `basic.ts`. File is not imported.

#### [DELETE] `source/shared/utils/cache.ts`
- Duplicate of cache logic in `basic.ts`. File is not imported.

## Verification Plan
1.  **Automated Tests**: Run `npm run lint` to ensure no broken imports or type errors.
2.  **Manual Verification**: Check if the application builds/runs (via `npm run dev` status check, though dev server is already running, I will check for errors in the terminal).
