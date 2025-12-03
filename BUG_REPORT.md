# Bug Report - Codebase Review

## Critical Issues

### 1. **useAsyncOperation.js - Incorrect isMounted Return Value**
**Location:** `src/shared/hooks/useAsyncOperation.js:109`

**Issue:** The hook returns `isMounted: isMountedRef.current` which will always return the initial value (true) because refs don't trigger re-renders. This means the returned `isMounted` value will be stale.

**Current Code:**
```javascript
return {
  data,
  isLoading,
  error,
  execute,
  reset,
  isMounted: isMountedRef.current,  // ❌ Always returns initial value
};
```

**Fix:**
```javascript
return {
  data,
  isLoading,
  error,
  execute,
  reset,
  isMounted: () => isMountedRef.current,  // ✅ Return a function
};
```

**Impact:** Medium - Components using this hook may incorrectly think the component is mounted when it's not.

**Status:** ✅ **FIXED**

---

## Medium Priority Issues

### 2. **App.jsx - Unnecessary Dependencies in useEffect**
**Location:** `src/App.jsx:115`

**Issue:** The `useEffect` dependency array includes `uiActions` and `isAdmin` which are not used in the effect handler. This can cause unnecessary re-renders and event listener re-registrations.

**Current Code:**
```javascript
useEffect(() => {
  const handleKeyDown = (event) => {
    // ... handler code that doesn't use uiActions or isAdmin
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [uiActions, isAdmin, navigateTo]);  // ❌ uiActions and isAdmin not used
```

**Fix:**
```javascript
}, [navigateTo]);  // ✅ Only include dependencies actually used
```

**Impact:** Low-Medium - Unnecessary re-renders and event listener cleanup/re-registration.

**Status:** ✅ **FIXED**

---

### 3. **useProfileStats.js - Potential Unnecessary Re-fetches**
**Location:** `src/features/profile/hooks/useProfileStats.js:97`

**Issue:** The `fetchSelectionStats` callback is in the dependency array of a `useEffect`, but since `fetchSelectionStats` depends on `activeUser`, and the effect also depends on `activeUser`, this could cause double fetches or unnecessary re-fetches.

**Current Code:**
```javascript
useEffect(() => {
  if (activeUser) {
    fetchSelectionStats(activeUser);
  }
}, [activeUser, fetchSelectionStats]);  // ⚠️ fetchSelectionStats already depends on activeUser
```

**Fix:**
```javascript
useEffect(() => {
  if (activeUser) {
    fetchSelectionStats(activeUser);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeUser]);  // ✅ fetchSelectionStats is stable when activeUser is stable
```

**Impact:** Low - Minor performance issue, may cause unnecessary API calls.

**Status:** ✅ **FIXED**

---

## Low Priority Issues / Code Quality

### 4. **useNameData.js - Timeout Cleanup Logic**
**Location:** `src/core/hooks/useNameData.js:48-51`

**Issue:** The `clearAllTimeouts` function is correctly implemented, but the timeout tracking could be improved. Currently, timeouts are added to an array but there's a potential race condition if `clearAllTimeouts` is called while a timeout is being added.

**Current Code:**
```javascript
const clearAllTimeouts = useCallback(() => {
  timeoutIdsRef.current.forEach((id) => clearTimeout(id));
  timeoutIdsRef.current = [];
}, []);
```

**Note:** This is actually fine, but consider using a Set for O(1) lookups if the number of timeouts grows.

**Impact:** Very Low - Current implementation is functional, but could be optimized.

---

### 5. **PreferenceSorter.jsx - Array Bounds Check Redundancy**
**Location:** `src/features/tournament/PreferenceSorter.jsx:144`

**Issue:** There's a bounds check `if (i >= this.items.length || j >= this.items.length)` inside the merge loop, but `i` and `j` are already constrained by the while condition `i <= mid && j <= right`, and `mid` and `right` are validated at the start of the function. This check is defensive but may be unnecessary.

**Current Code:**
```javascript
while (i <= mid && j <= right) {
  try {
    // Bounds check before accessing
    if (i >= this.items.length || j >= this.items.length) {  // ⚠️ Redundant?
      console.error("Array index out of bounds during merge:", {
        i,
        j,
        itemsLength: this.items.length,
      });
      break;
    }
    // ...
  }
}
```

**Impact:** Very Low - Defensive programming, but could be removed if bounds validation is guaranteed.

---

## Potential Issues (Require Testing)

### 6. **Race Condition in User Login**
**Location:** `src/core/hooks/useUserSession.js:166-207`

**Issue:** There's a race condition handling for user creation, but the error handling could be more robust. If two users try to create the same username simultaneously, one will succeed and the other will get an error, but the error handling tries to verify if the user was created.

**Current Code:**
```javascript
if (rpcError) {
  // * Handle errors - if user was created in a race condition, continue
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "RPC create_user_account error (may be race condition):",
      rpcError,
    );
  }

  // * Try to verify if user was actually created (race condition)
  const { data: verifyUser } = await activeSupabase
    .from("cat_app_users")
    .select("user_name")
    .eq("user_name", trimmedName)
    .maybeSingle();

  if (!verifyUser) {
    // * User was not created, throw error
    throw rpcError;
  } else {
    // * User was created (race condition), continue
  }
}
```

**Note:** This is actually good defensive programming, but consider checking the specific error code to determine if it's a duplicate key error vs. other errors.

**Impact:** Low - Current handling is reasonable, but could be more specific.

---

### 7. **Missing Error Handling in Tournament Voting**
**Location:** `src/core/hooks/tournament/useTournamentVoting.js:103-359`

**Issue:** The `handleVote` function has error handling, but if `sorter.addPreference` throws an error, it might not be caught properly. The function uses try-catch in some places but not around all operations.

**Impact:** Low - Most operations are wrapped, but could be more comprehensive.

---

### 8. **useAsyncOperation.js - Timeout Not Cleared on Success**
**Location:** `src/shared/hooks/useAsyncOperation.js:56-67`

**Issue:** When an async operation completes successfully, the timeout is never cleared. The timeout is only cleared if the abort signal is triggered, but if the operation completes before the timeout, the timeout will still fire unnecessarily, causing a memory leak and potential issues.

**Current Code:**
```javascript
const timeoutPromise = new Promise((_, reject) => {
  const id = setTimeout(() => {
    reject(new Error(`Operation timed out after ${timeout}ms`));
  }, timeout);
  signal.addEventListener("abort", () => clearTimeout(id));
});

const result = await Promise.race([
  operation(...args, { signal }),
  timeoutPromise,
]);
// ❌ Timeout is never cleared if operation completes successfully
```

**Fix:**
```javascript
let timeoutId;
const timeoutPromise = new Promise((_, reject) => {
  timeoutId = setTimeout(() => {
    reject(new Error(`Operation timed out after ${timeout}ms`));
  }, timeout);
  signal.addEventListener("abort", () => clearTimeout(timeoutId));
});

const result = await Promise.race([
  operation(...args, { signal }),
  timeoutPromise,
]);

// ✅ Clear timeout if operation completed successfully
if (timeoutId) {
  clearTimeout(timeoutId);
}
```

**Impact:** Medium - Memory leak and unnecessary timeout execution.

**Status:** ✅ **FIXED**

---

## Summary

- **Critical:** 1 issue ✅ **FIXED** (isMounted return value)
- **Medium:** 3 issues ✅ **FIXED** (unnecessary dependencies, potential re-fetches, timeout cleanup)
- **Low:** 3 issues (code quality improvements)
- **Potential:** 2 issues (require testing to confirm)

## Fix Status

✅ **Fixed Issues:**
1. Issue #1 - `useAsyncOperation.js` isMounted return value - **FIXED**
2. Issue #2 - `App.jsx` unnecessary dependencies - **FIXED**
3. Issue #3 - `useProfileStats.js` potential re-fetches - **FIXED**
4. Issue #8 - `useAsyncOperation.js` timeout not cleared on success - **FIXED**

## Recommendations

1. ✅ **Fixed:** Issue #1 (isMounted return value)
2. ✅ **Fixed:** Issues #2 and #3 (dependency arrays)
3. **Consider:** Issues #4-7 (code quality and robustness improvements)

## Testing Recommendations

- Test concurrent user creation scenarios
- Test tournament voting with rapid clicks
- Test component unmounting during async operations
- Test timeout cleanup in various scenarios

