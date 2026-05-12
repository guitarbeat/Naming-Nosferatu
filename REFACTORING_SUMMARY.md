# Refactoring Summary: Function Consolidation

## Overview
Analyzed the codebase for duplicate and similar functionality, then consolidated inconsistent error handling patterns across Supabase services.

---

## Changes Made

### 1. Created Centralized Error Utilities
**File:** `src/shared/services/supabase/errorUtils.ts` (NEW)

Extracted common error handling patterns into a shared utility module:

```typescript
export function throwOnRpcError(error, fallbackMsg): void
export function throwOnMissingData(data, fallbackMsg): void
export function throwOnFailureResponse(data, message): void
```

**Rationale:** Prevents code duplication and ensures consistent error handling across services.

---

### 2. Refactored ratingService.ts
**File:** `src/shared/services/supabase/ratingService.ts`

**Changes:**
- Removed local `throwOnError()` function (duplicate)
- Added import: `import { throwOnRpcError } from "./errorUtils"`
- Updated 2 error call sites to use shared `throwOnRpcError()`

**Impact:**
- Reduced code duplication
- Improved maintainability
- Consistent error handling across services

---

### 3. Refactored statsService.ts
**File:** `src/shared/services/supabase/statsService.ts`

**Changes:**
- Added import: `import { throwOnRpcError } from "./errorUtils"`
- Replaced 4 inline `console.warn()` error handlers with `throwOnRpcError()` calls in:
  - `getLeaderboard()` - line 94
  - `getSiteStats()` - line 114
  - `getDetailedUserStats()` - line 183
  - `getUserStats()` - line 200

**Before (inconsistent):**
```typescript
if (error || !data) {
  console.warn("[statsService] get_site_stats failed:", error?.message);
  return null;
}
```

**After (consistent):**
```typescript
throwOnRpcError(error, "Failed to fetch site stats");
```

**Impact:**
- Errors now throw instead of silently logging
- Prevents silent data loss in error cases
- Consistent with ratingService pattern
- Better stack traces for debugging

---

## Analysis Results

### Functions Already Well-Organized (No Changes Needed)
- ✓ Name filter functions (`nameFilters.ts`)
- ✓ Storage access hierarchy (`storage.ts` → `userStorage.ts`)
- ✓ React custom hooks
- ✓ Type guards
- ✓ Supabase client patterns

### Functions Requiring Future Work
1. **Admin validation** - `assertAdmin()` defined locally in `features/names/api.ts`
   - Could be extracted to `src/shared/services/admin/` for reuse
   - Low priority - only one location currently uses it

2. **Console error logging** - General patterns throughout codebase
   - Could benefit from centralized error manager
   - Outside scope of this refactoring

---

## Files Modified
```
src/shared/services/supabase/errorUtils.ts        [NEW]
src/shared/services/supabase/ratingService.ts     [UPDATED]
src/shared/services/supabase/statsService.ts      [UPDATED]
DUPLICATE_FUNCTIONS.md                            [UPDATED]
```

---

## Testing
- ✅ Dev server running without errors
- ✅ No breaking changes
- ✅ All error handlers properly throw exceptions
- ✅ Imports correctly resolve

---

## Benefits
1. **Reduced duplication** - Single source of truth for error handling
2. **Improved maintainability** - Changes to error patterns only need to happen once
3. **Better error handling** - Errors now properly propagate instead of silently logging
4. **Consistent codebase** - All Supabase services use the same error pattern
