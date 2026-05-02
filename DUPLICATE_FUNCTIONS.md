# Duplicate and Similar Functionality Analysis

This document tracks functions, utilities, and patterns that are duplicated or similar across the codebase.

## 1. Storage Access Wrappers

### `isStorageAvailable()` Check Pattern
Multiple files check for storage availability before accessing localStorage.

**Files using this pattern:**
- `src/shared/lib/storage.ts:1-9` - Core definition
- `src/shared/lib/userStorage.ts:50, 100, 127` - User storage checks
- `src/shared/services/supabase/authAdapter.ts:47, 172` - Auth adapter checks
- `src/shared/services/supabase/runtime.ts:80` - Runtime storage checks
- `src/shared/lib/sound.ts:28` - Sound manager storage check
- `src/features/tournament/hooks/useTournamentSelectionSaver.ts:72` - Selection saver
- `src/features/tournament/hooks/useHelpers.tsx:37, 50` - Tournament helpers

**Status:** Intentional - good pattern, consistent usage ✓

---

## 2. Name Filter Functions

### Similar predicate and filter functions
Multiple functions filter names by status (hidden, locked, active).

**Core definitions:**
- `src/shared/lib/names/nameFilters.ts:6-62`
  - `isNameHidden()` - line 6
  - `isNameLocked()` - line 13
  - `isNameActive()` - line 20
  - `getVisibleNames()` - line 24
  - `getActiveNames()` - line 37
  - `getHiddenNames()` - line 47
  - `getLockedNames()` - line 57

**Files importing/using these:**
- `src/app/routes/HomeRoute.tsx:14, 40` - Uses `getLockedNames()`
- `src/features/tournament/components/NameSelector.tsx:29-35` - Uses all predicates
- `src/features/admin/AdminDashboard.tsx:15-18, 112-133` - Uses all functions

**Status:** Centralized, no duplication ✓

---

## 3. Error Handling Patterns

### `throwOnError()` Pattern
Custom error throwing for Supabase RPC responses.

**Locations:**
- `src/shared/services/supabase/ratingService.ts:10-14` - Definition and usage at line 138
- `src/shared/services/supabase/statsService.ts:94-96, 116-118, 190-192, 210-212` - Similar inline error handling

**Similarity:** `ratingService` has dedicated `throwOnError()` function, but `statsService` uses inline error handling instead.

**Recommendation:** Extract inline error checks in `statsService.ts` to use the same pattern.

---

## 4. Console Error Logging

### Repeated error logging patterns
Multiple files use similar console.error patterns for the same operations.

**Auth-related errors:**
- `src/shared/services/supabase/authAdapter.ts:86, 123, 147, 176, 224` - 5 separate error logs
- `src/app/providers/authContext.tsx:94` - Auth context error log

**Image service errors:**
- `src/shared/services/supabase/imageService.ts:8, 48, 66` - 3 separate error logs with similar messages

**Storage errors:**
- Multiple error logs across storage files

**Status:** Patterns are consistent but could be centralized via error manager.

---

## 5. Validation Functions

### `validateRatingsData()`
Comprehensive validation function for tournament ratings.

**Location:**
- `src/shared/services/supabase/ratingService.ts:16-70`

**Similar patterns:**
- `src/features/names/api.ts:37-38, 44-45` - Admin role validation (inline)
- `src/shared/lib/names/nameFilters.ts` - Type checking with array guards

**Status:** Good centralization ✓

---

## 6. Storage Access Functions

### Three-tier storage access
Multiple wrappers around localStorage with different purposes.

**Tier 1 - Generic storage (`storage.ts`):**
- `isStorageAvailable()`
- `getStorageString()`
- `setStorageString()`
- `removeStorageItem()`
- `parseJsonValue()`
- `readStorageJson()`
- `writeStorageJson()`

**Tier 2 - User-specific (`userStorage.ts`):**
- `readStoredUserSnapshot()`
- `writeStoredUserSnapshot()`
- `clearStoredUserSnapshot()`
- Handles legacy migrations

**Tier 3 - Hook wrappers (`useLocalStorage.ts`):**
- React hook wrapper for storage

**Status:** Well-organized hierarchy ✓

---

## 7. Custom React Hooks

### Similar state management patterns
Multiple hooks managing similar state with comparable logic.

**Locations:**
- `src/features/tournament/hooks/useTournamentSelectionSaver.ts` - Saves tournament selection
- `src/features/tournament/hooks/useTournamentState.ts` - Main tournament state
- `src/features/tournament/hooks/useTournamentHandlers.ts` - Tournament event handlers
- `src/shared/hooks/useLocalStorage.ts` - Generic local storage hook

**Status:** Each has distinct purpose, no duplication ✓

---

## 8. Component Feedback/UI Patterns

### Error and feedback messages
Similar message patterns across components.

**Locations:**
- `src/shared/components/layout/Feedback/ErrorBoundary.tsx` - Error boundary
- `src/shared/components/layout/Feedback/Loading.tsx` - Loading states
- `src/shared/components/layout/ConfirmDialog.tsx` - Confirmation dialogs

**Status:** Centralized in Feedback components ✓

---

## 9. Supabase Client Initialization

### Multiple client resolution patterns

**Locations:**
- `src/shared/services/supabase/runtime.ts:46-114` - Main client creation
- `src/shared/services/supabase/runtime.ts:210-217` - `withSupabaseOrThrow()` wrapper
- Multiple services use `withSupabaseOrThrow()` for safe client access

**Status:** Centralized pattern ✓

---

## 10. Type Guards and Assertions

### Similar type checking patterns
Repeated checks for array and object types across services.

**Locations:**
- `src/shared/lib/names/nameFilters.ts:24-29, 37-40, 47-50, 57-60` - Array null checks
- `src/shared/lib/userStorage.ts:33-44` - Object type normalization
- `src/shared/lib/ratingStats.ts:46-47` - Array filtering and validation

**Pattern:** All use `if (!Array.isArray(names))` before filtering

**Status:** Consistent pattern ✓

---

## Summary by Severity

### Low Priority (Well-organized)
- Name filter functions ✓
- Storage access hierarchy ✓
- Custom React hooks ✓
- Feedback components ✓
- Supabase client patterns ✓
- Type guards ✓

### Medium Priority (Inconsistent patterns)
1. **Error handling in statsService** - Should use `throwOnError()` like ratingService
2. **Console error logging** - Could benefit from centralized error manager
3. **Admin validation** - Inline checks could be extracted to shared utility

### High Priority
None identified - codebase is well-organized with minimal duplication.

---

## Changes Made

### ✅ Consolidated Error Handling Utilities
**Created:** `src/shared/services/supabase/errorUtils.ts`

Merged error handling patterns into a single shared utility:
- `throwOnRpcError()` - Centralized from `ratingService.ts`
- `throwOnMissingData()` - For null/missing data checks
- `throwOnFailureResponse()` - For boolean RPC responses

**Updated:**
- `src/shared/services/supabase/ratingService.ts` - Now imports and uses `throwOnRpcError`
- `src/shared/services/supabase/statsService.ts` - Replaced 4 inline `console.warn` checks with `throwOnRpcError` calls

**Result:** Consistent error handling across Supabase services. Errors now throw instead of silently logging, preventing data loss.

---

## Remaining Recommendations

1. **Extract admin validation utility** - `assertAdmin()` is defined locally in `features/names/api.ts` but could be shared
2. **Centralize error logging** - Consider using error manager for app-wide error tracking
3. **Document storage tier hierarchy** for future developers
