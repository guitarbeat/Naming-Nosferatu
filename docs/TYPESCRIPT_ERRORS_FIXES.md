# TypeScript Errors Fix Plan

## Overview
This document outlines the 96 remaining TypeScript compilation errors that need to be fixed for the `pnpm run lint` command to pass. All biome linting issues have been resolved.

## Error Summary by File

| File | Errors | Category |
|------|--------|----------|
| src/features/tournament/services/tournamentService.ts | 5 | Result type system |
| src/features/tournament/Tournament.tsx | 4 | Callback types |
| src/shared/services/errorManager/index.ts | 13 | Global scope typing |
| src/shared/utils/mobileGestures.ts | 10 | Mobile API typing |
| src/shared/components/Error/Error.tsx | 7 | Component typing |
| src/shared/components/Charts/Charts.tsx | 5 | Type assertions |
| src/shared/providers/AuthProvider.tsx | 5 | Supabase client |
| src/shared/components/NameManagementView/nameManagementCore.tsx | 6 | Circular references |
| src/features/tournament/components/PersonalResults.tsx | 1 | Property naming |
| src/features/tournament/components/TournamentMatch/TournamentMatch.tsx | 1 | Import path |
| src/features/tournament/ModernTournamentSetup.tsx | 1 | Import path |
| src/features/tournament/tournamentUtils.ts | 2 | String parameters |
| src/shared/components/Bracket/Bracket.tsx | 2 | Undefined objects |
| src/shared/components/Card/components/CardName.tsx | 3 | Unused variables |
| src/shared/components/ErrorBoundary/ErrorBoundary.tsx | 2 | Override modifiers |
| src/shared/components/LiquidGlass/LiquidGlass.tsx | 1 | Children typing |
| src/shared/components/NameManagementView/modes/ProfileMode.tsx | 3 | Component props |
| src/shared/components/NameManagementView/modes/TournamentMode.tsx | 3 | Component props |
| src/shared/components/NameManagementView/NameManagementView.tsx | 2 | Props interface |
| src/shared/components/TournamentToolbar/TournamentToolbar.tsx | 3 | CSS classes |
| src/shared/components/ViewRouter/ViewRouter.tsx | 2 | Undefined objects |
| src/shared/services/supabase/modules/cat-names-consolidated.ts | 4 | String parameters |
| src/shared/services/supabase/modules/general.ts | 1 | Optional chaining |
| src/shared/utils/core/export.ts | 2 | Type assertions |
| src/shared/utils/core/index.ts | 4 | Array typing |
| src/shared/utils/core/name.ts | 3 | Type assertions |
| src/shared/components/NameGrid/NameGrid.tsx | 1 | Import path |
| src/shared/components/NameManagementView/shared/useNameData.ts | 1 | Import path |
| src/shared/components/NameManagementView/shared/useNameSelection.ts | 1 | Import path |

## Detailed Fix Instructions

### 1. Result Type System Issues (tournamentService.ts - 5 errors)

**Problem**: `ErrResult<{ message: string }>` not assignable to `Result<CatName[], { message: string }>`

**Root Cause**: The `Result` type system has incompatible `isOk` method signatures.

**Solution**:
```typescript
// Fix the Result type definitions or update the error handling
// Option 1: Update the err/ok functions to return compatible types
// Option 2: Change the return types to use a consistent Result interface
```

**Files to modify**:
- `src/features/tournament/services/tournamentService.ts` (lines 71, 84, 99, 101, 104)

### 2. Callback Type Mismatches (Tournament.tsx - 4 errors)

**Problem**: Function signatures don't match expected callback types.

**Solutions**:

#### Error 148: handleVote callback type mismatch
```typescript
// Current: ((winner: string, voteType?: string) => { [x: string]: { rating: number; wins?: number; losses?: number } } | undefined)
// Expected: (option: "left" | "right" | "both" | "neither") => Promise<unknown>

// Fix: Update handleVote function signature or change caller expectations
```

#### Error 149: onVote callback type mismatch
```typescript
// Current: (voteData: VoteData) => void | Promise<void>
// Expected: (voteData: unknown) => void | Promise<void>

// Fix: Update VoteData interface or change callback signature
```

#### Errors 198, 208, 317: Rating callback type mismatch
```typescript
// Current: (ratings: Record<string, number>) => void
// Expected: (ratings: Record<string, { rating: number; wins?: number; losses?: number }>) => void

// Fix: Update callback signature to match expectations
```

### 3. Global Scope Typing (errorManager/index.ts - 13 errors)

**Problem**: Global scope and DOM API typing issues.

**Solutions**:

#### GLOBAL_SCOPE.crypto.randomUUID
```typescript
// Add type declarations for global scope
declare global {
  const GLOBAL_SCOPE: {
    crypto?: {
      randomUUID?: () => string;
    };
    navigator?: Navigator;
    location?: Location;
    addEventListener?: (type: string, listener: EventListener) => void;
    removeEventListener?: (type: string, listener: EventListener) => void;
  };
}
```

#### Navigator and Location typing
```typescript
// Cast to any or add proper type guards
const userAgent = (navigator as any)?.userAgent || '';
const language = (navigator as any)?.language || '';
const online = (navigator as any)?.onLine ?? true;
const platform = (navigator as any)?.platform || '';
const href = (location as any)?.href || '';
```

### 4. Mobile API Typing (mobileGestures.ts - 10 errors)

**Problem**: Touch event and vibration API typing issues.

**Solutions**:

#### Touch array access
```typescript
// Add null checks for touch arrays
const touch1 = touches[0];
const touch2 = touches[1];
if (!touch1 || !touch2) return;

// Or use optional chaining
this.handleSingleTouchStart(touches[0]!, event);
```

#### Vibration API
```typescript
// Add type guard for vibration support
if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
  const pattern = patterns[type] || patterns.light;
  navigator.vibrate(pattern);
}
```

### 5. Component Typing Issues (Error.tsx - 7 errors)

**Problems**:
- Unused variables (lines 35, 36, 37, 49, 81)
- Override modifiers missing (lines 280, 292)

**Solutions**:
```typescript
// Remove unused variables or prefix with underscore
const _announcementRef = useRef<HTMLDivElement | null>(null);
const _textAreaRef = useRef<HTMLTextAreaElement | null>(null);
const _copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Add override modifiers
override state: { error: Error | null } = { error: null };
override render() {
  // component body
}
```

### 6. Type Assertions (Charts.tsx - 5 errors)

**Problems**: `unknown` types need proper casting.

**Solutions**:
```typescript
// Add proper type guards or casting
const labelKey = 'name'; // or get from props
const valueKey = 'value'; // or get from props

// Use proper typing
<div key={item.id || index}>
  {item[labelKey as keyof typeof item] as React.ReactNode}
  {item[valueKey as keyof typeof item] as React.ReactNode}
</div>
```

### 7. Supabase Client Typing (AuthProvider.tsx - 5 errors)

**Problem**: Supabase client methods not properly typed.

**Solution**:
```typescript
// Import proper Supabase types
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Type the client properly
const supabase: SupabaseClient<Database> = createClient(/* config */);

// Use typed methods
const { data, error } = await supabase.auth.getUser();
const { error: signInError } = await supabase.auth.signInWithPassword(/* params */);
```

### 8. Circular Type References (nameManagementCore.tsx - 6 errors)

**Problems**:
- `UseNameManagementViewResult` circularly references itself
- `userName` parameter type issues

**Solutions**:
```typescript
// Fix circular reference by using ReturnType properly
export type UseNameManagementViewResult = ReturnType<typeof useNameManagementView>;

// Or define explicitly
export interface UseNameManagementViewResult {
  // define properties explicitly
}

// Fix userName typing
userName: string | null | undefined,
// Or handle in function
const { names, isLoading, error: dataError, refetch } = useNameData({
  userName: userName ?? null,
  mode
});
```

### 9. Import Path Issues (Multiple files)

**Problem**: TypeScript can't resolve imports without file extensions.

**Solution**: Add `.ts` extensions to type imports:
```typescript
import type { NameItem } from "../../types/components.ts";
```

### 10. String Parameter Issues (tournamentUtils.ts, cat-names-consolidated.ts)

**Problem**: `string | undefined` passed where `string` expected.

**Solutions**:
```typescript
// Add null checks or default values
merged.push(this.items[i++] || '');

// Or use optional chaining with defaults
dateGroups.set(date ?? 'unknown', new Map());
```

### 11. Undefined Object Access (Bracket.tsx, ViewRouter.tsx)

**Problem**: Array/object access without null checks.

**Solutions**:
```typescript
// Add null checks
if (grouped[idx]) {
  grouped[idx].push(m);
}

// Or initialize arrays
const grouped: Match[][] = Array.from({ length: maxRound + 1 }, () => []);
```

### 12. Component Props Issues (ProfileMode.tsx, TournamentMode.tsx)

**Problem**: Props don't match expected interfaces.

**Solutions**:
```typescript
// Update interface definitions to match usage
interface TournamentFilters {
  sortOrder?: string; // Allow string instead of literal union
}

// Or cast at usage
filters={filterConfig as ExpectedFilterType}
```

### 13. CSS Class Issues (TournamentToolbar.tsx)

**Problem**: CSS class properties don't exist on style object.

**Solutions**:
```typescript
// Check if CSS classes exist before using
const className = styles.startButtonWrapper || 'default-class';

// Or update CSS module definitions
```

### 14. Array Typing Issues (core/index.ts)

**Problem**: Array destructuring with potentially undefined values.

**Solutions**:
```typescript
// Add length checks before destructuring
if (newArray.length > j) {
  [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
}

// Or use safer array methods
const temp = newArray[i];
newArray[i] = newArray[j] ?? temp;
newArray[j] = temp;
```

## Implementation Priority

### High Priority (Core functionality)
1. Result type system fixes (tournamentService.ts)
2. Callback type fixes (Tournament.tsx)
3. Import path fixes (all files)

### Medium Priority (Type safety)
4. Global scope typing (errorManager/index.ts)
5. Component props fixes (NameManagementView)
6. Array typing fixes (core/index.ts)

### Low Priority (Code quality)
7. Unused variable cleanup
8. Override modifier additions
9. Optional chaining improvements

## Testing Strategy

After implementing fixes:

1. Run `pnpm run lint` to verify all errors are resolved
2. Run `pnpm run build` to ensure production build works
3. Run `pnpm run test` to verify functionality isn't broken
4. Manual testing of affected components

## Notes

- Some errors may be interdependent - fixing one may resolve others
- Consider adding `// @ts-ignore` comments for complex issues that can't be easily resolved
- The application should still function despite these TypeScript errors
- Focus on critical path errors first (Result types, callbacks, imports)