🎯 **What:** The testing gap addressed
The `shouldEnableAnalytics` function in `src/app/analytics.ts` contained a few missing edge cases for testing. The existing test only covered `localhost` and `127.0.0.1`.

📊 **Coverage:** What scenarios are now tested
Added coverage for the remaining local analytics hosts that block analytics on preview deployments: `0.0.0.0` and `::1`.

✨ **Result:** The improvement in test coverage
The `src/app/analytics.ts` file now has 100% test coverage for all of the hardcoded non-production hosts within `LOCAL_ANALYTICS_HOSTS`.
