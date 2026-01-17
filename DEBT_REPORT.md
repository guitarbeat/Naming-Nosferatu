# DEBT_REPORT

## 1. The Orphanage (Unlinked Files)
The following files do not appear to be imported by the codebase. They are primarily generated error logs.

**Generated Error Logs:**
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
*   `final_final_check.txt`
*   `final_final_errors.txt`
*   `final_final_final_check.txt`
*   `last_errors.txt`
*   `massive_errors.txt`
*   `massive_errors_2.txt`
*   `really_final_check.txt`
*   `setup_errors.txt`
*   `the_absolute_final_check.txt`
*   `where_is_the_error.txt`

**Unreferenced Source Files:**
*   `source/shared/utils/logger.ts`
*   `source/shared/components/ErrorBoundary/index.ts`
*   `source/features/gallery/GalleryView.tsx`

## 2. The Graveyard (Commented-Out Code)
No files were found containing commented blocks larger than 5 lines. The codebase is remarkably clean of large dead code blocks.

## 3. The Echo Chamber (Duplicate Logic)
The following functions share identical names and high logic similarity across different files.

*   **formatDate**
    *   `source/shared/utils/basic.ts`
    *   `source/shared/utils/date.ts`
*   **clearTournamentCache**
    *   `source/shared/utils/basic.ts`
    *   `source/shared/utils/cache.ts`
*   **clearAllCaches**
    *   `source/shared/utils/basic.ts`
    *   `source/shared/utils/cache.ts`
*   **noop**
    *   `source/shared/utils/basic.ts`
    *   `source/shared/utils/logger.ts`

## 4. The "Mystery Meat" (Ambiguous Naming)
The following variables use non-descriptive naming conventions.

*   `temp` (Variable)
    *   `source/shared/utils/basic.ts`: Line 23
*   `data` (Variable)
    *   `source/features/auth/hooks/authHooks.ts`: Line 35
    *   `source/core/store/slices/settingsSlice.ts`: Line 106
    *   `source/shared/components/Gallery.tsx`: Line 191
*   `obj` (Variable)
    *   `source/features/auth/utils/authUtils.ts`: Line 119
*   `res` (Variable)
    *   `source/shared/components/Gallery.tsx`: Line 56
    *   `source/shared/components/NameSuggestionModal/NameSuggestionModal.tsx`: Line 64
*   `item` (Variable)
    *   `source/core/hooks/useStorage.ts`: Line 24
    *   `source/shared/navigation/transform.ts`: Line 75
