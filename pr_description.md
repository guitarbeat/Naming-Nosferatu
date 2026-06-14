🎯 **What:** Replaced raw `console.error` calls with `ErrorManager.handleError` in `ProfileInner.tsx`.
💡 **Why:** Using `ErrorManager` centrally handles errors and improves observability/monitoring instead of silently dropping them into the browser console. This improves maintainability and tracking for profile-related actions.
✅ **Verification:** Verified with `git diff`, `pnpm test run`, type-checking, and linting. Only `ProfileInner.tsx` tests were rerun to ensure nothing broke. The changes were strictly imports and replacing `console.error` inside catch-blocks. Code review gave a rating of `#Correct#`.
✨ **Result:** Better error tracking and consistent error handling within the Profile view component.
