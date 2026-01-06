# Bugs and Issues Review

**Last Updated:** 2025-01-07  
**Status:** Active Reference  
**Recent Fixes:** 4 bugs fixed (1 Critical, 1 High, 2 Low)  
**Total Bugs Documented:** 89 (including fixed and verified entries)

## Overview

This document catalogs all known bugs, potential issues, and fixes in the codebase. It consolidates bug reviews and styling-related bug fixes.

---

## Executive Summary

**Critical Bugs:** 2 (1 fixed)  
**High Priority:** 4 (1 fixed)  
**Medium Priority:** 8  
**Low Priority:** 25 (2 fixed)  
**Needs Verification:** 6  
**Fixed:** 4  
**Verified (No Issues):** 10

---

## 🔴 Critical Bugs (Must Fix)

### 1. AnalysisBulkActions Component Missing
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Line:** 264  
**Issue:** Component `<AnalysisBulkActions>` is used but doesn't exist anywhere in the codebase. There's no import statement and no component definition.  
**Impact:** **RUNTIME ERROR** - Component will fail to render, breaking the entire `AnalysisBulkActionsWrapper` functionality.  
**Status:** ✅ **FIXED** - Component created inline in AnalysisWrappers.tsx (lines 172-250). Component renders bulk action buttons for select all, hide/unhide, and export.  
**Fix Required:** Create the component or replace with inline JSX. Based on props, it should render action buttons for:
- Select All / Deselect All
- Bulk Hide / Unhide
- Export
- Show selected count and total count

**Related Issues:** #8, #31, #38, #39 (all refer to the same bug)

---

### 2. NameManagementViewExtensions Type Missing
**File:** `src/shared/components/NameManagementView/nameManagementCore.tsx`  
**Issue:** The type `NameManagementViewExtensions` is imported in multiple files (`ProfileMode.tsx`, `TournamentMode.tsx`, `NameManagementView.tsx`) but never defined or exported.  
**Impact:** **TYPE ERROR** - TypeScript should fail compilation, but if it doesn't, runtime errors are likely.  
**Status:** ✅ **VERIFIED** - Types are already defined in `nameManagementCore.tsx` (lines 31-55). Bug report was outdated.
```typescript
export interface NameManagementViewExtensions {
  header?: React.ReactNode | (() => React.ReactNode);
  dashboard?: React.ReactNode | (() => React.ReactNode) | React.ComponentType;
  bulkActions?: (props: { onExport?: () => void }) => React.ReactNode;
  contextLogic?: React.ReactNode | (() => React.ReactNode);
  nameGrid?: React.ReactNode;
  navbar?: React.ReactNode | (() => React.ReactNode);
}
```

**Related Issues:** #37, #44

---

### 3. NameManagementViewProfileProps Type Missing
**File:** `src/shared/components/NameManagementView/nameManagementCore.tsx`  
**Issue:** The type `NameManagementViewProfileProps` is imported in `ProfileMode.tsx` but never defined or exported.  
**Impact:** **TYPE ERROR** - TypeScript should fail compilation.  
**Status:** ✅ **VERIFIED** - Types are already defined in `nameManagementCore.tsx` (lines 43-55). Bug report was outdated.  
**Fix Required:** ~~Add type definition based on usage in `ProfileMode.tsx` (lines 62-66):~~
```typescript
export interface NameManagementViewProfileProps {
  showUserFilter?: boolean;
  selectionStats?: SelectionStats;
  userOptions?: Array<{ value: string; label: string }>;
  isAdmin?: boolean;
  onToggleVisibility?: (nameId: string) => Promise<void>;
  onDelete?: (name: NameItem) => Promise<void>;
}
```

**Related Issues:** #45

---

## 🟠 High Priority Issues

### 4. exportTournamentResultsToCSV Type Mismatch
**File:** `src/features/tournament/components/AnalysisWrappers.tsx` (line 256), `src/shared/utils/core/export.ts` (line 132)  
**Issue:** Function expects `ExportNameItem[]` but receives `NameItem[]`. Field name mismatch: `is_hidden` (snake_case) vs `isHidden` (camelCase). Also, `ExportNameItem` expects fields like `user_rating`, `user_wins` that may not exist on `NameItem`.  
**Impact:** CSV export may have missing or incorrectly named fields. Function uses fallback logic (`n.avg_rating || n.rating`) but not type-safe.  
**Status:** ✅ **VERIFIED** - Function already accepts `NameItem[] | ExportNameItem[]` and handles conversion internally (lines 131-152). Type signature is correct and safe.

**Related Issues:** #3, #16, #42, #43, #53

---

### 5. AnalysisBulkActionsWrapper - Missing Error Handling for handleBulkUnhide
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 376-382  
**Issue:** `handleBulkUnhide` is called without try-catch block, unlike `handleBulkHide` which has error handling. Async errors won't be caught.  
**Impact:** **ERROR HANDLING ISSUE** - Unhandled promise rejections possible.  
**Status:** ✅ **FIXED** - Added try-catch error handling matching `handleBulkHide` pattern.  
**Fix Required:** Add try-catch block similar to `onBulkHide` (lines 285-291).

**Related Issues:** #56, #60, #61

---

### 6. RankingAdjustment - State Sync Issue
**File:** `src/features/tournament/RankingAdjustment.tsx`  
**Lines:** 42, 47-74  
**Issue:** Component has `useEffect` that re-sorts items whenever `rankings` prop changes, potentially losing user's drag-and-drop changes if they haven't been saved yet.  
**Impact:** **UX ISSUE** - User's manual reordering could be lost if parent component re-renders with new rankings prop before save completes.  
**Status:** ✅ **FIXED** - `hasUnsavedChanges` guard prevents effect from overwriting user changes (lines 46, 49-53, 175).

**Related Issues:** #17

---

### 7. RankingAdjustment - Missing id Field / Using name as React Key
**File:** `src/features/tournament/RankingAdjustment.tsx`  
**Lines:** 15-20, 252  
**Issue:** `RankingItem` interface doesn't include `id` field, but component uses `item.name` as React key. If two items have the same name, this creates duplicate keys.  
**Impact:** **POTENTIAL BUG** - Duplicate keys can cause React rendering issues, especially with drag-and-drop.  
**Status:** ✅ **VERIFIED** - Interface already includes `id: string | number` (line 16), and code uses `item.id ?? item.name` as key (line 250). Fallback to name is safe since id is required.

**Related Issues:** #5, #63, #64

---

### 8. AnalysisHandlersProvider - handlersRef Type Mismatch
**File:** `src/features/tournament/components/AnalysisWrappers.tsx` (line 44), `src/features/tournament/hooks/useTournamentController.ts` (lines 86-89)  
**Issue:** Type mismatch between ref creation and usage. Ref uses `void` instead of `Promise<void>`, `string | number` instead of `string`, and `null` instead of `undefined`.  
**Impact:** **TYPE MISMATCH** - TypeScript may not catch this, but types are incompatible.  
**Status:** **PRE-EXISTING**  
**Fix Required:** Align types between ref creation and interface definition.

**Related Issues:** #55

---

## 🟡 Medium Priority Issues

### 9. AnalysisWrappers.tsx - Removed analysisMode Initialization Logic
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 66-68  
**Issue:** Removed `useEffect` that initialized `analysisMode` from `shouldEnableAnalysisMode` prop.  
**Impact:** If `shouldEnableAnalysisMode` is true but analysis mode isn't set in URL, it may not be initialized properly.  
**Status:** **NEEDS VERIFICATION** - Check if parent component handles this.

---

### 10. errorManager - Global Error Handler Type Narrowing
**File:** `src/shared/services/errorManager/index.ts`  
**Lines:** 560-565  
**Issue:** Type narrowing `"reason" in e ? e.reason : e.error` may not work correctly for `ErrorEvent | PromiseRejectionEvent`.  
**Impact:** May not correctly extract error information from different event types.  
**Status:** **NEEDS VERIFICATION** - Test with both unhandledrejection and error events.

**Related Issues:** #4, #24

---

### 11. useProfile.ts - TournamentSelection Type May Not Match Database Schema
**File:** `src/features/profile/hooks/useProfile.ts`  
**Lines:** 78-88  
**Issue:** Created `TournamentSelection` interface, but Supabase query result types may have additional fields or different field names.  
**Impact:** Type errors if database schema has additional fields or different casing.  
**Status:** **NEEDS VERIFICATION** - Check actual Supabase return type.

**Related Issues:** #6, #19

---

### 12. useProfile.ts - SelectionStats Type Export Issue
**File:** `src/features/profile/hooks/useProfile.ts`  
**Line:** 29 in AnalysisWrappers.tsx  
**Issue:** `AnalysisWrappers.tsx` uses `type SelectionStats = ReturnType<typeof useProfile>["selectionStats"]` which creates a circular dependency risk.  
**Impact:** Type mismatch if the return type doesn't match the interface.  
**Status:** **POTENTIAL BUG** - Should import the interface directly if it's exported.

**Related Issues:** #11

---

### 13. RankingAdjustment - Timer Cleanup Race Condition
**File:** `src/features/tournament/RankingAdjustment.tsx`  
**Lines:** 78-135  
**Issue:** Multiple timers created, but if component unmounts while timer callback is executing, cleanup may run before callback completes.  
**Impact:** **RACE CONDITION** - Potential state updates after unmount if timing is wrong.  
**Status:** **PRE-EXISTING** - `isMountedRef` check helps but race condition window exists.

**Related Issues:** #9, #22

---

### 14. RankingAdjustment - onSave Not Memoized by Parent
**File:** `src/features/tournament/RankingAdjustment.tsx`  
**Line:** 135  
**Issue:** `onSave` is in `useEffect` dependency array. If parent doesn't memoize it, effect runs on every render.  
**Impact:** **PERFORMANCE ISSUE** - Effect may run too frequently.  
**Status:** **PRE-EXISTING** - Should be fixed by parent component memoizing the callback.

**Related Issues:** #23, #70

---

### 15. AnalysisHandlersProvider - Missing Dependency in useEffect
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Line:** 85  
**Issue:** `useEffect` includes `handlersRef` in dependencies, but real issue is that handlers are recreated on every render if not memoized.  
**Impact:** **PERFORMANCE ISSUE** - Effect may run more often than needed.  
**Status:** **PRE-EXISTING** - Dependency array could be optimized.

**Related Issues:** #54

---

### 16. useNameManagementCallbacks - Type Safety with Unknown
**File:** `src/features/tournament/hooks/useTournamentSetupHooks.ts`  
**Lines:** 8-20  
**Issue:** `setHiddenNames` and `setAllNames` use `updater: unknown` type, which is too permissive.  
**Impact:** **TYPE SAFETY ISSUE** - No type checking on updater parameter.  
**Status:** **PRE-EXISTING** - Should be properly typed.

**Related Issues:** #67, #72

---

## 🟢 Low Priority / Code Quality Issues

### 17. AnalysisWrappers.tsx - Unused shouldEnableAnalysisMode Prop
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Line:** 55  
**Issue:** Prop is accepted but never used. Dead code.  
**Status:** **PRE-EXISTING** - Remove prop or implement functionality.

**Related Issues:** #7, #52

---

### 18. AnalysisWrappers.tsx - React.useEffect Instead of useEffect
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Line:** 80  
**Issue:** Uses `React.useEffect` instead of `useEffect` (which is imported). Inconsistent with rest of file.  
**Status:** ✅ **FIXED** - Changed to `useEffect` and added `context` to dependency array.

**Related Issues:** #62

---

### 19. AnalysisBulkActionsWrapper - Redundant Null Check
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Line:** 259  
**Issue:** Checks `!context` but `context` comes from `useNameManagementContextSafe()` which throws if null. Check is redundant.  
**Status:** **PRE-EXISTING** - Dead code.

**Related Issues:** #18, #66

---

### 20. propTypes Import Path - May Be Valid Via Path Alias
**File:** Multiple files  
**Issue:** Many files import from `"../../shared/propTypes"` but actual file is `src/types/components.ts`. TypeScript doesn't show errors, suggesting path alias or re-export.  
**Status:** **NEEDS VERIFICATION** - Verify if path aliases work or if re-export exists.

**Related Issues:** #15

---

### 21. NameGrid - Using Array Index for Skeleton Loader Keys
**File:** `src/shared/components/NameGrid/NameGrid.tsx`  
**Line:** 157  
**Issue:** Uses `key={`skeleton-${i}`}` for skeleton loaders.  
**Status:** **PRE-EXISTING** - Acceptable for loading states but could be improved.

**Related Issues:** #71

---

### 22. AnalysisHandlersProvider - handlersRef.current Initialization
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 83-84  
**Issue:** Accesses optional properties without checking. Ref is initialized as empty object, so safe but type safety could be improved.  
**Status:** **PRE-EXISTING** - Works but could be more type-safe.

**Related Issues:** #51

---

### 23. AnalysisWrappers.tsx - selectedNamesArray Type Assertion
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 286, 298  
**Issue:** Cast to `string[]` when passed to `handleBulkHide`/`handleBulkUnhide`, but API accepts `(string | number)[]`.  
**Status:** **PRE-EXISTING** - Type assertion works but could be more precise.

**Related Issues:** #25, #34, #35

---

### 24. extractNameIds - Type Signature Mismatch
**File:** `src/shared/utils/core/export.ts`  
**Line:** 103  
**Issue:** Function signature accepts `Set<string>` but is called with `NameItem[]`. Function handles it, but type signature is overly broad.  
**Status:** **PRE-EXISTING** - Works but type signature could be more specific.

**Related Issues:** #33

---

### 25. Context.selectedNames Type Ambiguity
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 194, 201  
**Issue:** Code uses defensive utilities (`selectedNamesToSet`, `extractNameIds`) but type is actually always `NameItem[]`.  
**Status:** **PRE-EXISTING** - Utilities are defensive but unnecessary. Type is clear.

**Related Issues:** #13, #26, #28

---

### 26. useNameManagementCallbacks - Optional Chaining on Optional Methods
**File:** `src/features/tournament/hooks/useTournamentSetupHooks.ts`  
**Lines:** 10, 17, 23  
**Issue:** Double optional chaining suggests methods might not exist on context type. If they don't exist, callbacks silently do nothing.  
**Status:** **PRE-EXISTING** - May be intentional.

**Related Issues:** #68, #73

---

### 27. AnalysisHandlersProvider - Hook Called Before Null Check
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 70, 79-80  
**Issue:** `useNameManagementCallbacks(context)` called before null check, but hook accepts `null` so it's designed to handle it.  
**Status:** **PRE-EXISTING** - Code order is confusing but functionally works.

**Related Issues:** #57, #58, #69, #74

---

### 28. errorManager - Global Scope Type Issue
**File:** `src/shared/services/errorManager/index.ts`  
**Lines:** 11-13  
**Issue:** Type definition uses `typeof globalThis | typeof window` which may be technically incorrect but works in practice.  
**Status:** **NEEDS VERIFICATION** - Should test accessing properties.

**Related Issues:** #20

---

### 29. AnalysisDashboard.tsx - rankingHistory.data Type Safety
**File:** `src/features/analytics/components/AnalysisDashboard.tsx`  
**Lines:** 146-155  
**Issue:** Accesses `rankingHistory?.data` but type suggests it could be a Promise. React Query should unwrap it.  
**Status:** **PRE-EXISTING** - React Query unwraps promises, so this is fine.

**Related Issues:** #30

---

### 30. useProfile.ts - handleBulkOperation Missing Error Handling for Empty Arrays
**File:** `src/features/profile/hooks/useProfile.ts`  
**Lines:** 573-623  
**Issue:** Error handling is split between wrapper and hook, which could lead to inconsistent UX.  
**Status:** **PRE-EXISTING** - Architecture issue.

**Related Issues:** #29

---

### 31. AnalysisHandlersProvider - useEffect Runs Even When Component Returns Null
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 79-85, 87-91  
**Issue:** Component has `useEffect` that sets ref values, but always returns `null`. Effect runs even when component returns null (correct React behavior, but unusual pattern).  
**Status:** **PRE-EXISTING** - Valid but unusual component pattern.

**Related Issues:** #77, #78

---

### 32. AnalysisBulkActionsWrapper - handleBulkHide Async Error Not Caught
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 285-291  
**Issue:** `handleBulkHide` is called without `await` inside try-catch. Try-catch only catches synchronous errors, not promise rejections.  
**Status:** **PRE-EXISTING** - Should use `.catch()` or make callback async and await.

**Related Issues:** #56, #79

---

### 33. AnalysisBulkActionsWrapper - handleExport Missing Error Handling
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 255-257  
**Issue:** `handleExport` calls `exportTournamentResultsToCSV` without error handling. If export fails (file system error, browser permission), error won't be caught.  
**Status:** **PRE-EXISTING** - Missing error handling.

**Related Issues:** #90

---

### 34. AnalysisBulkActionsWrapper - Redundant Optional Chaining
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 193-194, 216-217, 246-251  
**Issue:** Uses `context?.` optional chaining even though `context` comes from `useNameManagementContextSafe()` which throws if null. Optional chaining is redundant but doesn't cause errors.  
**Status:** **PRE-EXISTING** - Defensive but redundant code.

**Related Issues:** #82, #83, #85, #88

---

### 35. AnalysisBulkActionsWrapper - Unnecessary Type Assertions
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 227, 229  
**Issue:** Uses `name as NameItem` type assertion when filtering. `contextNames` is already typed as `NameItem[]`, so assertion is unnecessary.  
**Status:** **PRE-EXISTING** - Unnecessary type assertion.

**Related Issues:** #86, #87

---

### 36. AppNavbar.tsx - Unused Import (styles)
**File:** `src/shared/components/AppNavbar/AppNavbar.tsx`  
**Line:** 3  
**Issue:** `styles` is imported from `"./AppNavbar.module.css"` but never used. Component uses `AppNavbar.css` instead.  
**Status:** **PRE-EXISTING** - Unused import that should be removed.

**Note:** `NavbarUI.tsx` uses the module CSS file, so it's needed. Only `AppNavbar.tsx` has the unused import.

---

### 37. AnalysisBulkActionsWrapper - handleSelectAll Missing Null Check for visibleNameIds
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 241-252  
**Issue:** `handleSelectAll` calls `filteredAndSortedNames.map((name) => name.id)` without checking if `filteredAndSortedNames` is an array. However, `filteredAndSortedNames` is a `useMemo` that always returns an array (empty array if no names), so this is safe. The check on line 242 for `visibleNameIds.length === 0` handles the empty case.  
**Impact:** **SAFE** - Always returns array, so `.map()` is safe.  
**Status:** **PRE-EXISTING** - Code is safe, but could add explicit array check for clarity.

---

### 38. AnalysisBulkActionsWrapper - handleSelectAll Fallback Logic
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 246-252  
**Issue:** Uses `context?.toggleNamesByIds` first, then falls back to `context?.toggleNameById` in a loop. The fallback is less efficient (multiple function calls instead of one), but it's a reasonable fallback. However, if both methods exist, the first one will be used, which is correct.  
**Impact:** **MINOR** - Fallback is less efficient but works correctly.  
**Status:** **PRE-EXISTING** - Fallback logic is correct but could be optimized.

---

### 39. AnalysisBulkActionsWrapper - handleSelectAll String Conversion
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Line:** 251  
**Issue:** In the fallback, calls `context?.toggleNameById?.(String(id), shouldSelect)`. The `String(id)` conversion is necessary because `id` comes from `name.id` which could be `string | number`, but `toggleNameById` expects `string`. However, `visibleNameIds` is created from `filteredAndSortedNames.map((name) => name.id)`, so the IDs are already in their original type. The conversion is safe but could be done earlier.  
**Impact:** **MINOR** - String conversion is safe but could be done earlier for consistency.  
**Status:** **PRE-EXISTING** - Type conversion is correct but could be optimized.

---

### 40. AnalysisBulkActionsWrapper - selectedNamesArray Type Assertion to string[]
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 286, 298  
**Issue:** `selectedNamesArray` is cast to `string[]` when passed to `handleBulkHide` and `handleBulkUnhide`. The `extractNameIds` function returns `NameId[]` where `NameId = string | number`. The API functions accept `(string | number)[]`, so the cast is unnecessary and could hide type issues.  
**Impact:** **MINOR** - Cast is unnecessary but doesn't cause errors.  
**Status:** **PRE-EXISTING** - Unnecessary type assertion.

**Related Issues:** #23, #25

---

### 41. AnalysisBulkActionsWrapper - onBulkHide Error Message Extraction
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 288-290  
**Issue:** Error message extraction uses `error instanceof Error ? error.message : "Unknown error"`. This is correct, but if the error is a promise rejection with a non-Error value, it will show "Unknown error" which might not be helpful.  
**Impact:** **MINOR** - Error handling could be more informative for non-Error rejections.  
**Status:** **PRE-EXISTING** - Error handling is basic but functional.

---

### 42. AnalysisBulkActionsWrapper - devLog and devWarn Usage
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 269, 277-280  
**Issue:** Uses `devLog` and `devWarn` for debugging. These should be removed or gated behind `NODE_ENV === 'development'` for production builds.  
**Impact:** **MINOR** - Debug logs should not appear in production.  
**Status:** **PRE-EXISTING** - Debug logging should be conditional.

---

### 43. AnalysisHandlersProvider - useContext vs useNameManagementContextSafe
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 62-64  
**Issue:** Comment says "Use useContext directly instead of useNameManagementContextSafe to avoid throwing if context is not available yet". However, `useNameManagementContextSafe` is designed to throw if context is null, which is a fail-fast pattern. Using `useContext` directly means the component silently handles null context, which might hide bugs.  
**Impact:** **DESIGN DECISION** - Fail-fast vs graceful degradation. Current approach is more defensive but might hide bugs.  
**Status:** **PRE-EXISTING** - Design choice, but could be reconsidered.

**Related Issues:** #27

---

### 44. AnalysisBulkActionsWrapper - filteredAndSortedNames useMemo Dependency
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 302-317  
**Issue:** `filteredAndSortedNames` useMemo depends on `contextNames` and `contextFilterStatus`. These are derived from `context?.names` and `context?.filterStatus`. If `context` changes but these specific properties don't, the memoization won't update. However, this is correct behavior - the memoization should only update when the actual filtering inputs change.  
**Impact:** **CORRECT** - Memoization is working as intended.  
**Status:** **PRE-EXISTING** - No issue, just noting the dependency chain.

---

### 45. AnalysisBulkActionsWrapper - selectedNamesSet useMemo Dependency
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 279-282  
**Issue:** `selectedNamesSet` useMemo depends on `selectedNamesValue` which comes from `context?.selectedNames`. If `context` changes but `selectedNames` doesn't, the memoization won't update. However, this is correct behavior - the memoization should only update when `selectedNames` changes.  
**Impact:** **CORRECT** - Memoization is working as intended.  
**Status:** **PRE-EXISTING** - No issue, just noting the dependency chain.

---

### 46. AnalysisBulkActionsWrapper - allVisibleSelected Calculation
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 319-321  
**Issue:** `allVisibleSelected` is calculated inline (not memoized) and depends on `filteredAndSortedNames` and `selectedNamesSet`. Both are memoized, so this is correct. However, if `filteredAndSortedNames` or `selectedNamesSet` are recreated unnecessarily, this will also recalculate.  
**Impact:** **MINOR** - Could be memoized for better performance, but current approach is acceptable.  
**Status:** **PRE-EXISTING** - Could be optimized with useMemo.

---

### 47. AnalysisBulkActionsWrapper - handleSelectAll useCallback Dependency
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 323-336  
**Issue:** `handleSelectAll` useCallback depends on `allVisibleSelected`, `filteredAndSortedNames`, and `context`. The dependency on `context` is used to call `context?.toggleNamesByIds` and `context?.toggleNameById`. However, if `context` changes but these specific methods don't, the callback will be recreated unnecessarily. Since `context` is an object, it will change on every render if not memoized by the provider.  
**Impact:** **PERFORMANCE ISSUE** - Callback may be recreated on every render if context isn't memoized.  
**Status:** **PRE-EXISTING** - Should depend on specific methods instead of entire context if possible.

---

### 48. AnalysisBulkActionsWrapper - handleExport useCallback Dependency
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 338-340  
**Issue:** `handleExport` useCallback depends on `filteredAndSortedNames`. This is correct, but if `filteredAndSortedNames` is recreated unnecessarily, this will also recalculate.  
**Impact:** **CORRECT** - Memoization is working as intended.  
**Status:** **PRE-EXISTING** - No issue, just noting the dependency chain.

---

### 49. AnalysisBulkActionsWrapper - onBulkHide and onBulkUnhide Inline Arrow Functions
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 351-387  
**Issue:** `onBulkHide` and `onBulkUnhide` are defined as inline arrow functions that are recreated on every render. They should be memoized with `useCallback` to prevent unnecessary re-renders of child components.  
**Impact:** **PERFORMANCE ISSUE** - Functions recreated on every render, causing child components to re-render unnecessarily.  
**Status:** **PRE-EXISTING** - Should be memoized with `useCallback`.

---

### 50. AnalysisBulkActionsWrapper - Missing Error Handling for handleExport
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 338-340  
**Issue:** `handleExport` calls `exportTournamentResultsToCSV` without error handling. If the export fails, the error won't be caught or displayed to the user.  
**Impact:** **ERROR HANDLING ISSUE** - Export errors won't be caught or displayed.  
**Status:** **PRE-EXISTING** - Should add try-catch error handling.

---

### 51. PersonalResults.tsx - React.useEffect Instead of useEffect
**File:** `src/features/tournament/components/PersonalResults.tsx`  
**Line:** 183  
**Issue:** Uses `React.useEffect` instead of `useEffect` (which should be imported). Inconsistent with modern React patterns and rest of codebase.  
**Impact:** **CODE STYLE ISSUE** - Inconsistent import usage.  
**Status:** **PRE-EXISTING** - Should use direct import instead of React.useEffect.

**Related Issues:** #18

---

### 52. PersonalResults.tsx - Type Assertion to any
**File:** `src/features/tournament/components/PersonalResults.tsx`  
**Line:** 221  
**Issue:** Uses `const votes = voteHistory as any[];` which bypasses type checking. This could hide type errors and make the code less maintainable.  
**Impact:** **TYPE SAFETY ISSUE** - Bypasses TypeScript type checking.  
**Status:** **PRE-EXISTING** - Should properly type voteHistory instead of using `any`.

---

### 53. AnalysisWrappers.tsx - Missing Import for React
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Line:** 7  
**Issue:** Imports `useCallback`, `useContext`, `useEffect`, `useMemo` from React but doesn't import `React` itself. However, the file doesn't use `React.` prefix, so this is fine. But if `React.useEffect` or similar is used elsewhere, React should be imported.  
**Impact:** **NONE** - File correctly uses direct imports.  
**Status:** **VERIFIED** - No issue, file uses direct imports correctly.

---

### 54. AnalysisBulkActions - Inline Style Objects Recreated on Every Render
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 204-211  
**Issue:** Component uses inline style objects (`style={{ display: "flex", gap: "var(--space-2)", ... }}`) that are recreated on every render. These should be extracted to constants or CSS classes for better performance.  
**Impact:** **PERFORMANCE ISSUE** - Style objects recreated on every render, causing unnecessary re-renders.  
**Status:** **PRE-EXISTING** - Should extract to constants or use CSS classes.

---

### 55. PhotoComponents.tsx - console.warn Without Development Guard
**File:** `src/features/tournament/components/TournamentSidebar/PhotoComponents.tsx`  
**Line:** 88  
**Issue:** Uses `console.warn("PhotoThumbnail: Invalid image provided:", image);` without checking if in development mode. This will log warnings in production.  
**Impact:** **MINOR** - Console warnings should not appear in production.  
**Status:** **PRE-EXISTING** - Should gate behind `NODE_ENV === 'development'` or use logging utility.

**Related Issues:** #42

---

### 56. AnalysisBulkActions - Multiple Inline Style Objects
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 204-211, 213  
**Issue:** Component uses multiple inline style objects that are recreated on every render. The outer div has a style object (lines 205-211) and the span has another (line 213). These should be extracted to constants or CSS classes.  
**Impact:** **PERFORMANCE ISSUE** - Multiple style objects recreated on every render.  
**Status:** **PRE-EXISTING** - Should extract to constants or use CSS classes.

**Related Issues:** #54

---

### 57. Lightbox.tsx - window.addEventListener Cleanup Verified
**File:** `src/features/tournament/components/Lightbox.tsx`  
**Lines:** 126-128  
**Issue:** Uses `window.addEventListener("keydown", onKey)` with proper cleanup in useEffect return function. This is correct.  
**Impact:** **NONE** - Event listener properly cleaned up.  
**Status:** **VERIFIED** - No issue, cleanup is correct.

---

### 58. tournamentComponentHooks.ts - window.addEventListener Cleanup Verified
**File:** `src/features/tournament/hooks/tournamentComponentHooks.ts`  
**Lines:** 351-354  
**Issue:** Uses `window.addEventListener("keydown", handleKeyDown)` and adds to `globalEventListenersRef` for cleanup. The cleanup is handled in `Tournament.tsx` (lines 84-94) which removes all listeners from the set. This is correct.  
**Impact:** **NONE** - Event listener properly cleaned up via global listeners ref.  
**Status:** **VERIFIED** - No issue, cleanup is correct.

---

### 59. AnalysisBulkActions - Conditional Rendering with selectedCount
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 223-242  
**Issue:** Uses `{isAdmin && (...)}` for conditional rendering. This is safe because `isAdmin` is a boolean. However, uses `{onExport && (...)}` which is also safe because `onExport` is a function or undefined. The conditional rendering is correct.  
**Impact:** **SAFE** - Conditional rendering is correct for boolean and function props.  
**Status:** **VERIFIED** - No issue, conditional rendering is safe.

---

### 60. AnalysisBulkActionsWrapper - Excessive Optional Chaining
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 276-300  
**Issue:** Uses `context?.selectedCount ?? 0`, `context?.selectedNames`, `context?.names`, `context?.filterStatus` throughout. Since `context` comes from `useNameManagementContextSafe()` which throws if null, the optional chaining is redundant. However, it's defensive programming and doesn't cause errors.  
**Impact:** **MINOR** - Redundant optional chaining, but doesn't cause errors.  
**Status:** **PRE-EXISTING** - Defensive programming, but could be simplified.

**Related Issues:** #19, #50

---

### 61. AnalysisBulkActionsWrapper - selectedNamesArray Type Assertion
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 369, 382  
**Issue:** Casts `selectedNamesArray` to `string[]` when passing to `handleBulkHide` and `handleBulkUnhide`. The `extractNameIds` function returns `NameId[]` where `NameId = string | number`. The API functions accept `(string | number)[]`, so the cast is unnecessary.  
**Impact:** **MINOR** - Unnecessary type assertion, but doesn't cause errors.  
**Status:** **PRE-EXISTING** - Type assertion is unnecessary.

**Related Issues:** #40

---

### 62. AnalysisHandlersProvider - useEffect Dependency Array Includes handlersRef
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Line:** 86  
**Issue:** `useEffect` includes `handlersRef` in the dependency array. Refs are stable and don't need to be in dependencies. Including it doesn't cause issues, but it's unnecessary. The real issue is that `handleToggleVisibility` and `handleDelete` are recreated on every render if `useProfile` doesn't memoize them, causing the effect to run unnecessarily.  
**Impact:** **PERFORMANCE ISSUE** - Effect may run more often than needed if handlers aren't memoized.  
**Status:** **PRE-EXISTING** - Dependency array includes unnecessary ref, and handlers may not be memoized.

**Related Issues:** #15, #54

---

### 63. AnalysisBulkActionsWrapper - allVisibleSelected Not Memoized
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 319-321  
**Issue:** `allVisibleSelected` is calculated inline (not memoized) and depends on `filteredAndSortedNames` and `selectedNamesSet`. Both are memoized, but `allVisibleSelected` recalculates on every render. This could be memoized with `useMemo` for better performance.  
**Impact:** **PERFORMANCE ISSUE** - Recalculates on every render, even when dependencies haven't changed.  
**Status:** **PRE-EXISTING** - Could be optimized with useMemo.

**Related Issues:** #46

---

### 64. AnalysisBulkActionsWrapper - handleSelectAll Depends on Entire context Object
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 323-336  
**Issue:** `handleSelectAll` useCallback depends on `context` (entire object). If `context` changes but `toggleNamesByIds` or `toggleNameById` don't, the callback will be recreated unnecessarily. Should depend on specific methods instead of entire context.  
**Impact:** **PERFORMANCE ISSUE** - Callback may be recreated unnecessarily if context object reference changes.  
**Status:** **PRE-EXISTING** - Should depend on specific methods instead of entire context.

**Related Issues:** #47

---

### 65. PhotoComponents.tsx - useState with Object Literal
**File:** `src/features/tournament/components/TournamentSidebar/PhotoComponents.tsx`  
**Line:** 28  
**Issue:** Uses `useState({})` for `tiltStyle`. The empty object literal is recreated on every render, but since it's only used as the initial value, this is fine. However, if the component re-renders frequently, this could be optimized.  
**Impact:** **MINOR** - Empty object literal is fine for initial state, but could be extracted to constant.  
**Status:** **PRE-EXISTING** - Acceptable but could be optimized.

---

### 66. SwipeableNameCards.tsx - useState with Object Literals
**File:** `src/features/tournament/components/SwipeMode/SwipeableNameCards.tsx`  
**Lines:** 32-33  
**Issue:** Uses `useState({ x: 0, y: 0 })` for `dragStart` and `dragOffset`. The object literals are recreated on every render, but since they're only used as initial values, this is fine. However, if the component re-renders frequently, these could be extracted to constants.  
**Impact:** **MINOR** - Object literals are fine for initial state, but could be extracted to constants.  
**Status:** **PRE-EXISTING** - Acceptable but could be optimized.

---

### 67. AnalysisBulkActionsWrapper - Unnecessary Array Spread
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Line:** 306  
**Issue:** Uses `let filtered = [...contextNames];` to create a copy of the array. This is necessary if the array will be mutated, but if it's only used for filtering, the spread is unnecessary. However, since `filtered` is reassigned with filtered results, the spread is actually necessary to avoid mutating the original array.  
**Impact:** **CORRECT** - Array spread is necessary to avoid mutating the original array.  
**Status:** **VERIFIED** - No issue, spread is necessary.

---

### 68. tournamentComponentHooks.ts - useRef with Object Literal
**File:** `src/features/tournament/hooks/tournamentComponentHooks.ts`  
**Line:** 43  
**Issue:** Uses `useRef({ isActive: false })` for `tournamentStateRef`. The object literal is recreated on every render, but since it's only used as the initial value, this is fine. However, if the component re-renders frequently, this could be extracted to a constant.  
**Impact:** **MINOR** - Object literal is fine for initial ref value, but could be extracted to constant.  
**Status:** **PRE-EXISTING** - Acceptable but could be optimized.

---

### 69. AnalysisBulkActions - Default Props Usage
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 187-198  
**Issue:** Component uses destructured props with default values in the function signature. All props are required in the interface (`AnalysisBulkActionsProps`), so defaults won't be used unless props are explicitly passed as `undefined`. This is fine, but the interface could make some props optional if defaults are intended.  
**Impact:** **MINOR** - Default values in destructuring won't be used if props are required in interface.  
**Status:** **PRE-EXISTING** - Interface and defaults are consistent, but could be clearer.

---

### 70. AnalysisBulkActions - showActions Early Return
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Lines:** 199-201  
**Issue:** Component returns `null` early if `!showActions`. This is correct React pattern, but the component still processes all props even when it won't render. This is fine for performance, but could be optimized if props processing is expensive.  
**Impact:** **MINOR** - Early return is correct, but props are still destructured.  
**Status:** **PRE-EXISTING** - Acceptable pattern, but could optimize prop destructuring.

---

### 71. Lightbox.tsx - useRef with Object Literals
**File:** `src/features/tournament/components/Lightbox.tsx`  
**Lines:** 31-32  
**Issue:** Uses `useRef({ x: 0, y: 0 })` for `touchStartRef` and `touchEndRef`. The object literals are recreated on every render, but since they're only used as initial values, this is fine. However, if the component re-renders frequently, these could be extracted to constants.  
**Impact:** **MINOR** - Object literals are fine for initial ref values, but could be extracted to constants.  
**Status:** **PRE-EXISTING** - Acceptable but could be optimized.

---

### 72. Tournament.tsx - useRef with new Set
**File:** `src/features/tournament/Tournament.tsx`  
**Line:** 53  
**Issue:** Uses `useRef(new Set<EventListener>())` for `globalEventListeners`. The `new Set()` is created on every render, but since it's only used as the initial value, this is fine. However, if the component re-renders frequently, this could be extracted to a constant.  
**Impact:** **MINOR** - `new Set()` is fine for initial ref value, but could be extracted to constant.  
**Status:** **PRE-EXISTING** - Acceptable but could be optimized.

---

### 73. AnalysisBulkActionsWrapper - Early Return After Processing
**File:** `src/features/tournament/components/AnalysisWrappers.tsx`  
**Line:** 342  
**Issue:** Component processes `filteredAndSortedNames`, `selectedNamesSet`, `allVisibleSelected`, and creates callbacks before checking if it should return null. The early return check happens after all processing. This is fine for performance since the processing is memoized, but the order could be optimized.  
**Impact:** **MINOR** - Processing happens before early return check, but it's memoized so impact is minimal.  
**Status:** **PRE-EXISTING** - Could optimize order, but impact is minimal due to memoization.

---

### 74. useMasonryLayout - ResizeObserver Cleanup Verified
**File:** `src/shared/hooks/useMasonryLayout.ts`  
**Lines:** 90-113  
**Issue:** Uses `ResizeObserver` and properly cleans it up in the `useEffect` return function with `resizeObserver.disconnect()`. Also cleans up timeouts. This is correct.  
**Impact:** **NONE** - ResizeObserver properly cleaned up.  
**Status:** **VERIFIED** - No issue, cleanup is correct.

---

### 75. useMasonryLayout - setTimeout Cleanup Verified
**File:** `src/shared/hooks/useMasonryLayout.ts`  
**Lines:** 85, 93, 123  
**Issue:** Uses `setTimeout` in multiple places and properly cleans them up with `clearTimeout` in the `useEffect` return function and in the debounce handler. This is correct.  
**Impact:** **NONE** - Timeouts properly cleaned up.  
**Status:** **VERIFIED** - No issue, cleanup is correct.

---

### 76. useMasonryLayout - setItemRef setTimeout May Not Be Cleaned Up
**File:** `src/shared/hooks/useMasonryLayout.ts`  
**Lines:** 123-125  
**Issue:** `setItemRef` callback uses `setTimeout(() => { calculateLayout(); }, 0);` but this timeout is not stored in a ref or cleaned up. If the component unmounts or the ref changes before the timeout fires, the timeout will still execute. However, since it only calls `calculateLayout()` which updates state, and React will ignore state updates after unmount, this is safe but not ideal.  
**Impact:** **MINOR** - Timeout may execute after unmount, but React will ignore state updates.  
**Status:** **PRE-EXISTING** - Could store timeout in ref and clean it up, but current behavior is safe.

---

### 77. SwipeableNameCards.tsx - setTimeout Without Cleanup
**File:** `src/features/tournament/components/SwipeMode/SwipeableNameCards.tsx`  
**Lines:** 64, 153, 175  
**Issue:** Uses `setTimeout` in multiple places without storing the timeout ID or cleaning it up. Line 64: `setTimeout(() => setIsLongPressing(false), TIMING.LONG_PRESS_TIMEOUT_MS);` - timeout not stored or cleaned up. Line 153: `setTimeout(() => { setCurrentIndex(...); }, ...);` - timeout not stored or cleaned up. Line 175: `setTimeout(() => { ... }, ...);` - timeout not stored or cleaned up. If the component unmounts before these timeouts fire, they will still execute and try to update state. React will ignore state updates after unmount, so this is safe but not ideal.  
**Impact:** **MINOR** - Timeouts may execute after unmount, but React will ignore state updates.  
**Status:** **PRE-EXISTING** - Could store timeouts in refs and clean them up, but current behavior is safe.

---

### 78. useOfflineSupport - setTimeout Without Cleanup
**File:** `src/shared/hooks/useOfflineSupport.ts`  
**Line:** 58  
**Issue:** Uses `setTimeout(() => processQueue(), 0);` in the `handleOnline` callback. The timeout is not stored or cleaned up. However, since `processQueue` is called when the component is online and processes queued operations, and the timeout is only 0ms (next tick), this is likely safe. But if the component unmounts before the timeout fires, it will still execute.  
**Impact:** **MINOR** - Timeout may execute after unmount, but impact is minimal since it's 0ms.  
**Status:** **PRE-EXISTING** - Could store timeout in ref and clean it up, but current behavior is likely safe.

---

### 79. useOfflineSupport - window.addEventListener Cleanup Verified
**File:** `src/shared/hooks/useOfflineSupport.ts`  
**Lines:** 65-77  
**Issue:** Uses `window.addEventListener("online", handleOnline)` and `window.addEventListener("offline", handleOffline)` with proper cleanup in the `useEffect` return function. This is correct.  
**Impact:** **NONE** - Event listeners properly cleaned up.  
**Status:** **VERIFIED** - No issue, cleanup is correct.

---

### 80. useBrowserState - window.addEventListener Cleanup Verified
**File:** `src/shared/hooks/useBrowserState.ts`  
**Lines:** 56-63  
**Issue:** Uses `window.addEventListener("resize", updateBrowserState)`, `window.addEventListener("online", updateBrowserState)`, `window.addEventListener("offline", updateBrowserState)`, and `motionQuery.addEventListener("change", updateBrowserState)` with proper cleanup in the `useEffect` return function. Also cleans up `connection.addEventListener("change", updateBrowserState)` if connection exists. This is correct.  
**Impact:** **NONE** - Event listeners properly cleaned up.  
**Status:** **VERIFIED** - No issue, cleanup is correct.

---

### 81. useScreenSize - window.addEventListener Cleanup Verified
**File:** `src/shared/hooks/useScreenSize.ts`  
**Lines:** 34-38  
**Issue:** Uses `window.addEventListener("resize", updateScreenSize)` and `window.addEventListener("orientationchange", updateScreenSize)` with proper cleanup in the `useEffect` return function. This is correct.  
**Impact:** **NONE** - Event listeners properly cleaned up.  
**Status:** **VERIFIED** - No issue, cleanup is correct.

---

### 82. useMagneticPull - requestAnimationFrame Cleanup Verified
**File:** `src/features/tournament/hooks/tournamentComponentHooks.ts`  
**Lines:** 446, 483  
**Issue:** Uses `requestAnimationFrame` and properly cleans it up with `cancelAnimationFrame(animationFrameId)` in the `useEffect` return function. This is correct.  
**Impact:** **NONE** - Animation frame properly cleaned up.  
**Status:** **VERIFIED** - No issue, cleanup is correct.

---

### 83. useMagneticPull - addEventListener Cleanup Verified
**File:** `src/features/tournament/hooks/tournamentComponentHooks.ts`  
**Lines:** 467, 476-479, 484-489  
**Issue:** Uses `document.addEventListener("mousemove", handleMouseMove)` and element `addEventListener` for mouse events with proper cleanup in the `useEffect` return function. This is correct.  
**Impact:** **NONE** - Event listeners properly cleaned up.  
**Status:** **VERIFIED** - No issue, cleanup is correct.

---

### 88. useLocalStorage - storedValue in useCallback Dependencies
**File:** `src/core/hooks/useStorage.ts`  
**Lines:** 42-58  
**Issue:** `setValue` useCallback includes `storedValue` in its dependency array (line 57). This means the callback is recreated every time `storedValue` changes. However, since `setValue` uses `storedValue` in its implementation (line 46), this is necessary. The pattern is correct but could potentially cause unnecessary re-renders of components that depend on `setValue`.  
**Impact:** **MINOR** - Callback is recreated on every state change, but this is necessary for correct behavior.  
**Status:** **PRE-EXISTING** - Pattern is correct, but could be optimized by using functional updates exclusively.

---

### 89. useOfflineSupport - processQueue useCallback Dependency on queuedOperations
**File:** `src/shared/hooks/useOfflineSupport.ts`  
**Lines:** 16-51  
**Issue:** `processQueue` useCallback depends on `queuedOperations` (line 51). This means the callback is recreated every time `queuedOperations` changes. However, since `processQueue` reads from `queuedOperations` and updates it, this dependency is necessary. The effect that calls `processQueue` (line 58) intentionally excludes it from dependencies to avoid infinite loops (line 78 comment).  
**Impact:** **MINOR** - Callback is recreated frequently, but the pattern is intentional to avoid infinite loops.  
**Status:** **PRE-EXISTING** - Pattern is correct but could be optimized with refs.

---

## ✅ Fixed Issues

### 1. Box-shadow Indentation Bug
**File:** `SetupSwipe.module.css:365-368`  
**Issue:** Incorrect indentation in multi-line box-shadow property  
**Status:** ✅ **FIXED**

---

## ⚠️ Non-Critical / UX Issues

### 1. Scrollbar Width Change
**File:** `SetupSwipe.module.css:201`  
**Issue:** Changed from `6px` to `4px` (using `var(--space-1)`). Scrollbar might be too thin.  
**Recommendation:** Consider using `var(--space-2)` (8px) or custom token `--scrollbar-width: 6px`  
**Status:** ⚠️ Review recommended

---

## 📋 Needs Verification

1. **analysisMode initialization** - Check if parent component handles it (#9)
2. **errorManager type narrowing** - Test with both event types (#10)
3. **TournamentSelection type** - Check actual Supabase return type (#11)
4. **propTypes import paths** - Verify path aliases or re-exports (#20)
5. **GlobalScope type** - Test accessing properties (#28)
6. **createAnalysisDashboardWrapper types** - Check what types `stats` and `selectionStats` actually are (#2 in AI-Introduced section)

---

## File Size Violations

### ✅ FIXED: analysis-mode.css - Exceeds CSS Limit
**File:** `src/shared/styles/analysis-mode.css`  
**Original Lines:** 1287  
**Limit:** 750 lines (per DEVELOPMENT.md)  
**Issue:** File exceeded CSS file size limit by 537 lines (72% over limit).  
**Impact:** **MAINTAINABILITY ISSUE** - Large file is harder to maintain and navigate.  
**Status:** ✅ **FIXED** - Split into 5 files (all under 750-line limit):
- `analysis-mode-tokens.css` - 76 lines ✅
- `analysis-mode-global.css` - 46 lines ✅
- `analysis-mode-panels.css` - 235 lines ✅
- `analysis-mode-buttons.css` - 430 lines ✅
- `analysis-mode-misc.css` - 527 lines ✅
- Original `analysis-mode.css` - **REMOVED** ✅ (split complete, no longer needed)

### ✅ FIXED: ModernTournamentSetup.tsx - Exceeds TSX Limit
**File:** `src/features/tournament/ModernTournamentSetup.tsx`  
**Original Lines:** 407  
**Limit:** 400 lines (per DEVELOPMENT.md)  
**Issue:** File exceeded TSX file size limit by 7 lines (1.8% over limit).  
**Impact:** **MINOR** - Slightly over limit, but should be refactored for consistency.  
**Status:** ✅ **FIXED** - Extracted `OperatorBar`, `SystemFeed`, and `NameCard` components. File now 247 lines (under limit).

### ✅ FIXED: TournamentUI.tsx - Exceeds TSX Limit
**File:** `src/features/tournament/components/TournamentUI.tsx`  
**Original Lines:** 445  
**Limit:** 400 lines (per DEVELOPMENT.md)  
**Issue:** File exceeded TSX file size limit by 45 lines (11.3% over limit).  
**Impact:** **MAINTAINABILITY ISSUE** - File is 11% over limit and should be refactored.  
**Status:** ✅ **FIXED** - Extracted `KeyboardHelp` component. File now 376 lines (under limit).

---

## Recommendations (Prioritized)

1. **🔴 CRITICAL: Fix AnalysisBulkActions component** - ✅ **FIXED** - Component created inline in AnalysisWrappers.tsx
2. **🔴 CRITICAL: Add missing type definitions** - `NameManagementViewExtensions` and `NameManagementViewProfileProps`
3. **🟠 HIGH: Fix exportTournamentResultsToCSV type mismatch** - Update function signature or create proper conversion
4. **🟠 HIGH: Add error handling for handleBulkUnhide** - ✅ **FIXED** - Added try-catch error handling matching handleBulkHide
5. **🟡 MEDIUM: Split analysis-mode.css** - ✅ **FIXED** - Split into 5 files (all under 750-line limit): tokens (76), global (46), panels (235), buttons (430), misc (527).
5. **🟠 HIGH: Fix RankingAdjustment state sync** - Prevent effect from overwriting user changes
6. **🟠 HIGH: Fix RankingAdjustment React keys** - Add id field or ensure unique names
7. **🟡 MEDIUM: Verify analysisMode initialization** - Check if parent handles it
8. **🟡 MEDIUM: Test error handlers** - Verify both ErrorEvent and PromiseRejectionEvent work
9. **🟡 MEDIUM: Export SelectionStats interface** - Make it directly importable
10. **🟢 LOW: Remove unused shouldEnableAnalysisMode prop** - Clean up dead code

---

## Notes

- Many "FALSE ALARM" entries have been removed from this document
- Duplicate entries have been consolidated
- Issues are now grouped by priority and category
- Related issues are cross-referenced
- Status clearly indicates if issue is PRE-EXISTING, AI-INTRODUCED, or NEEDS VERIFICATION

---

**Last Updated:** 2025-01-07  
**Scan Complete:** All known bugs documented and categorized (89 total bugs including fixed and verified entries)
