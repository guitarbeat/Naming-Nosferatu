# Unused Files Analysis

This document lists files that are not currently being imported or used anywhere in the codebase.

## Summary

- **Total unused files:** 4
- **Total unused TypeScript/TSX files:** 3
- **Total unused store files:** 1

## Unused Files

### 1. `src/features/auth/Login.tsx`

**Status:** ❌ UNUSED

**Reason:** This component has been replaced by `CombinedLoginTournamentSetup.tsx`, which includes the login functionality directly.

**Details:**
- Not imported anywhere in the codebase
- The login UI is now embedded in `CombinedLoginTournamentSetup.tsx`
- The CSS file `Login.module.css` is still being used by `CombinedLoginTournamentSetup.tsx` (keep this)

**Replacement:** `src/features/tournament/CombinedLoginTournamentSetup.tsx`

---

### 2. `src/features/tournament/ModernTournamentSetup.tsx`

**Status:** ❌ UNUSED

**Reason:** This component has been replaced by `CombinedLoginTournamentSetup.tsx`.

**Details:**
- Not imported anywhere in the codebase
- Uses `tournamentStore.ts` which is also unused
- Contains an alternative implementation of the tournament setup UI

**Replacement:** `src/features/tournament/CombinedLoginTournamentSetup.tsx`

---

### 3. `src/features/tournament/TournamentSetup.tsx`

**Status:** ❌ UNUSED

**Reason:** This component has been replaced by `CombinedLoginTournamentSetup.tsx`.

**Details:**
- Not imported anywhere in the codebase
- The CSS file `TournamentSetup.module.css` is still being used by `CombinedLoginTournamentSetup.tsx` (keep this)
- Contains the original tournament setup implementation

**Replacement:** `src/features/tournament/CombinedLoginTournamentSetup.tsx`

---

### 4. `src/features/tournament/stores/tournamentStore.ts`

**Status:** ❌ UNUSED

**Reason:** This Zustand store is only used by `ModernTournamentSetup.tsx`, which is itself unused.

**Details:**
- Only imported in `ModernTournamentSetup.tsx`
- Uses Zustand with devtools middleware
- Contains state for `availableNames`, `selectedNames`, `operatorIdentity`, etc.
- The application now uses `useAppStore` from `src/core/store/useAppStore.ts` instead

**Replacement:** `src/core/store/useAppStore.ts`

---

## Files That Are Still Used (Keep These)

### CSS Files

- ✅ `src/features/auth/Login.module.css` - Used by `CombinedLoginTournamentSetup.tsx`
- ✅ `src/features/tournament/TournamentSetup.module.css` - Used by `CombinedLoginTournamentSetup.tsx` and various components
- ✅ `src/features/tournament/TournamentSetupIdentity.module.css` - Used by `CombinedLoginTournamentSetup.tsx`

### Active Components

- ✅ `src/features/tournament/CombinedLoginTournamentSetup.tsx` - Main component used in `ViewRouter.tsx`
- ✅ All files in `src/features/tournament/components/` - All actively used
- ✅ All files in `src/features/tournament/hooks/` - All actively used

---

## Recommendations

### Safe to Remove

These files can be safely deleted:

1. `src/features/auth/Login.tsx`
2. `src/features/tournament/ModernTournamentSetup.tsx`
3. `src/features/tournament/TournamentSetup.tsx`
4. `src/features/tournament/stores/tournamentStore.ts`

### Keep These

- `src/features/auth/Login.module.css` - Still used
- `src/features/tournament/TournamentSetup.module.css` - Still used
- `src/features/tournament/TournamentSetupIdentity.module.css` - Still used

---

## Verification

To verify these files are unused, run:

```bash
# Check for imports of Login.tsx
grep -r "import.*Login" src/ --exclude-dir=node_modules

# Check for imports of ModernTournamentSetup
grep -r "import.*ModernTournamentSetup" src/ --exclude-dir=node_modules

# Check for imports of TournamentSetup (excluding CombinedLoginTournamentSetup)
grep -r "import.*TournamentSetup[^I]" src/ --exclude-dir=node_modules

# Check for imports of tournamentStore
grep -r "import.*tournamentStore" src/ --exclude-dir=node_modules
```

---

## Last Updated

Generated: 2026-01-05

---

## Notes

- All unused files were replaced during the refactoring to combine login and tournament setup into a single component
- The build process will not fail if these files are removed (they're not in the dependency graph)
- Consider keeping them temporarily for reference, but they can be safely deleted
