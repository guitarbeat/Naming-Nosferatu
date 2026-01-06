# TypeScript Usage Review

## Summary

Your TypeScript configuration is excellent with strict mode enabled. However, there are **21 instances of `any` types** and **30 instances of `as any` assertions** that reduce type safety.

## Critical Issues

### 1. AnalysisWrappers.tsx - Missing Type Definitions

**Location:** `src/features/tournament/components/AnalysisWrappers.tsx`

**Issues:**
- Lines 97-99: `stats: any`, `selectionStats: any`, `highlights?: any`
- Lines 137-138: Function parameters use `any`
- Lines 62, 192, 215, 244-245, 254: Multiple `as any` assertions

**Fix:** Use proper types from `src/features/analytics/types/index.ts`:
- `stats` should be `SummaryStats | null`
- `selectionStats` should use `SelectionStats` from `useProfile.ts`
- `highlights` should be `{ topRated?: HighlightItem[]; mostWins?: HighlightItem[] } | undefined`

### 2. RankingAdjustment.tsx - Missing Type Definitions

**Location:** `src/features/tournament/RankingAdjustment.tsx`

**Issues:**
- Line 15: `haveRankingsChanged` uses `any[]` for both parameters
- Line 24: Component props missing type definitions

**Fix:** 
- Use `Ranking` interface from `PersonalResults.tsx` or create a shared type
- Define proper prop types for the component

### 3. useProfile.ts - Selection Type Issues

**Location:** `src/features/profile/hooks/useProfile.ts`

**Issues:**
- Lines 218, 247, 285: Using `any` for selection items

**Fix:** Define a proper `TournamentSelection` interface based on the database schema:
```typescript
interface TournamentSelection {
  name_id: string | number;
  name?: string;
  tournament_id: string;
  selected_at: string;
  user_name: string;
}
```

### 4. AnalysisDashboard.tsx - Context Type

**Location:** `src/features/analytics/components/AnalysisDashboard.tsx`

**Issues:**
- Line 64: `toolbarContext` cast to `any`
- Line 153: Filter callback uses `any`

**Fix:** Use `UseNameManagementViewResult` type from `nameManagementCore.tsx`

### 5. errorManager/index.ts - Global Scope Types

**Location:** `src/shared/services/errorManager/index.ts`

**Issues:**
- Lines 12, 19, 25, 28, 42: `any` types for global scope and utility functions
- Lines 355, 389, 393, 550, 566: Additional `any` types

**Status:** Some are justified (global scope), but can be improved:
- `GLOBAL_SCOPE` can use `typeof globalThis | typeof window | Record<string, unknown>`
- `deepFreeze` can use generics: `function deepFreeze<T>(object: T): Readonly<T>`
- `createHash` can use `unknown` instead of `any`
- Error handler types can be more specific

## Moderate Issues

### 6. Type Assertions (`as any`)

**Files with excessive `as any` assertions:**
- `AnalysisWrappers.tsx` (7 instances)
- `PersonalResults.tsx` (4 instances)
- `supabase/modules/general.ts` (6 instances)
- `useUserSession.ts` (2 instances)
- `Dashboard.tsx` (4 instances)

**Recommendation:** Replace with proper types or use `unknown` with type guards.

### 7. Missing Return Types

Several functions lack explicit return types. While TypeScript can infer them, explicit types improve code clarity and catch errors earlier.

**Examples:**
- `haveRankingsChanged` in `RankingAdjustment.tsx`
- `generatePath` in `Charts.tsx`
- Various utility functions

## Justified Uses

### @ts-expect-error Comments

These are acceptable:
- `src/shared/services/supabase/client.ts` (lines 159, 162, 165) - Accessing internal Supabase properties
- `src/shared/components/Card/components/CardName.tsx` (line 239) - Card props type mismatch

### Global Scope (`any`)

Some `any` usage in `errorManager/index.ts` is necessary for:
- Global scope detection (`globalThis`, `window`)
- Dynamic error handling where types are truly unknown

## Recommendations

### High Priority

1. **Fix AnalysisWrappers.tsx types** - Replace all `any` with proper interfaces
2. **Fix RankingAdjustment.tsx** - Add proper prop types and ranking interface
3. **Create shared types** - Extract common interfaces to `src/types/` or feature-specific type files
4. **Replace `as any` assertions** - Use proper types or `unknown` with type guards

### Medium Priority

5. **Add return types** - Explicitly type function return values
6. **Improve errorManager types** - Use generics and `unknown` where appropriate
7. **Type context properly** - Use `UseNameManagementViewResult` instead of `any`

### Low Priority

8. **Review PropTypes usage** - Consider removing PropTypes in favor of TypeScript types
9. **Add JSDoc type annotations** - For better IDE support

## Type Safety Score

- **Current:** 6/10 (Good strict config, but many `any` types)
- **Target:** 9/10 (Minimal `any`, proper types throughout)

## Next Steps

1. Start with `AnalysisWrappers.tsx` - highest impact
2. Fix `RankingAdjustment.tsx` - simple interface addition
3. Create shared type definitions
4. Gradually replace `as any` assertions
5. Add explicit return types to key functions
