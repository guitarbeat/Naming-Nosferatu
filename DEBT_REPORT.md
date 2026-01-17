# DEBT_REPORT

## 1. The Orphanage (Unlinked Files)
The following files appear to be unreferenced or are generated error logs that are not part of the active codebase.

*   `all_errors.txt`
*   `all_errors_3.txt`
*   `api_errors.txt`
*   `biome_errors.txt`
*   `current_errors.txt`
*   `errors_10.txt`
*   `errors_4.txt`
*   `errors_8.txt`
*   `errors_9.txt`
*   `errors_final_final.txt`
*   `final_biome_errors.txt`
*   `final_check_wait.txt`
*   `final_errors.txt`
*   `final_final_errors.txt`
*   `final_final_final_check.txt`
*   `last_errors.txt`
*   `massive_errors.txt`
*   `massive_errors_2.txt`
*   `really_final_check.txt`
*   `setup_errors.txt`
*   `the_absolute_final_check.txt`
*   `where_is_the_error.txt`

## 2. The Graveyard (Commented-Out Code)
Files containing blocks of commented-out code.

*   `source/features/tournament/TournamentHooks.ts` (Lines 636-638)
    *   Percentage: < 1% (Small block of unused variable declarations)

_Note: No matching blocks larger than 5 lines were found in the scanned feature directories._

## 3. The Echo Chamber (Duplicate Logic)
Functions or logic blocks with high similarity.

*   **formatDate** (Identical Implementation)
    *   `source/shared/utils/basic.ts`
    *   `source/shared/utils/date.ts`

## 4. The "Mystery Meat" (Ambiguous Naming)
Variables or filenames that are non-descriptive.

*   `temp` (Variable)
    *   `source/shared/utils/basic.ts` (Line 23)
*   `data` (Variable)
    *   `source/features/auth/hooks/authHooks.ts` (Line 35)
*   `item` (Variable)
    *   `source/features/tournament/TournamentLogic.ts` (Multiple occurrences in loops)
