# Tournament Data JSONB Usage Audit

**Date:** 2025-11-29  
**Task:** 1.1 - Run query to find all tournament_data JSONB usage  
**Status:** Complete

## Summary

The `tournament_data` JSONB column in `cat_app_users` table is currently used to store tournament history and selections. This audit identifies all locations where this column is referenced in the codebase and database.

### Key Findings

✅ **Found:** 4 application code files using `tournament_data`  
✅ **Found:** 2 database indexes on `tournament_data`  
✅ **Found:** 1 check constraint validating `tournament_data`  
⚠️ **CRITICAL:** RPC function `update_user_tournament_data` is called but NOT DEFINED  
📊 **Impact:** 4-6 hours estimated to migrate away from JSONB column

### Critical Issue

The application code calls `supabase.rpc("update_user_tournament_data", ...)` in 3 locations, but this function **does not exist** in any migration file. This means:
- Tournament saves using this RPC are likely failing silently
- Data may only be persisting to `tournament_selections` table (which is good for migration)
- Need to verify current tournament functionality before proceeding

## Database Schema

### Table: `cat_app_users`
- **Column:** `tournament_data JSONB DEFAULT '[]'::jsonb`
- **Purpose:** Stores user tournament history as a JSONB array
- **Added in:** Migration `20250827013700_add_preferences_columns.sql`

### Indexes
1. **idx_cat_app_users_tournament_data** (GIN index)
   - Created in: `20250827013700_add_preferences_columns.sql`
   - Purpose: Improve query performance on JSONB column
   - **Action Required:** Remove when column is dropped

2. **idx_cat_app_users_tournament_recent** (Partial index)
   - Created in: `20250115030000_modernize_backend_simple.sql`
   - Condition: `WHERE tournament_data IS NOT NULL`
   - **Action Required:** Remove when column is dropped

### Constraints
1. **check_tournament_data_json**
   - Created in: `20250115030000_modernize_backend_simple.sql`
   - Validates: `tournament_data IS NULL OR jsonb_typeof(tournament_data) = 'array'`
   - **Action Required:** Remove when column is dropped

## Application Code References

### 1. TypeScript Types (`src/shared/services/supabase/types.ts`)
**Lines:** 51, 59, 67

```typescript
export type CatAppUser = {
  tournament_data: Json | null;
  // ... other fields
}
```

**Action Required:** Regenerate types after schema migration

### 2. Legacy Supabase Client (`src/shared/services/supabase/legacy/supabaseClient.js`)

#### Function: `saveTournamentData()` (Lines 1195-1252)
- **Purpose:** Saves tournament data to JSONB column
- **Usage:** 
  - Reads existing `tournament_data` from `cat_app_users`
  - Appends new tournament to array
  - Calls RPC `update_user_tournament_data` to update
- **Action Required:** Migrate to use `tournament_selections` table

#### Function: `updateTournamentStatus()` (Lines 1277-1330)
- **Purpose:** Updates tournament status in JSONB array
- **Usage:**
  - Fetches all users' `tournament_data`
  - Searches through arrays to find tournament by ID
  - Updates status in JSONB array
  - Writes back to `cat_app_users.tournament_data`
- **Action Required:** Migrate to use `tournament_selections` table

#### Function: `getUserTournaments()` (Lines 1366-1390)
- **Purpose:** Retrieves user's tournament history
- **Usage:**
  - Queries `cat_app_users.tournament_data` for specific user
  - Returns JSONB array
  - Filters by status if specified
- **Action Required:** Migrate to query `tournament_selections` table

#### Function: `saveTournamentSelections()` (Lines 1471-1502)
- **Purpose:** Saves tournament selections to both table and JSONB
- **Usage:**
  - Saves to `tournament_selections` table (primary)
  - Also updates `cat_app_users.tournament_data` JSONB (redundant)
  - Calls RPC `update_user_tournament_data`
- **Action Required:** Remove JSONB update, keep only table insert

### 3. Profile Stats Utility (`src/features/profile/utils/profileStats.js`)

#### Function: `calculateSelectionAnalytics()` (Lines 139-156)
- **Purpose:** Calculate selection statistics from tournament data
- **Usage:**
  - Calls `tournamentsAPI.getUserTournaments()` which reads JSONB
  - Flattens selections from `tournament_data`
  - Aggregates statistics
- **Action Required:** Update to query `tournament_selections` table directly

## Database Functions (RPC)

### Function: `update_user_tournament_data`
- **Status:** ⚠️ MISSING - Function is called but NOT DEFINED in any migration
- **Called from:** 
  - `supabaseClient.js` lines 1221, 1247, 1495
- **Purpose:** Updates `cat_app_users.tournament_data` JSONB column
- **Impact:** These RPC calls are likely FAILING in production
- **Action Required:** 
  - **CRITICAL:** Either create this function OR remove all calls to it
  - Recommended: Remove calls and use direct table operations
  - This is a blocking issue for current tournament functionality

## Migration Comments

### Migration: `20251128000000_add_increment_selection_rpc.sql`
- Contains comment: "Selection tracking is now handled via tournament_data in cat_app_users"
- **Note:** This is outdated - should use `tournament_selections` table

## Data Flow Analysis

### Current Flow (Redundant):
1. User completes tournament
2. Data saved to `tournament_selections` table ✓
3. Data ALSO saved to `cat_app_users.tournament_data` JSONB ✗ (redundant)
4. Queries read from JSONB instead of table ✗ (slow)

### Proposed Flow (Optimized):
1. User completes tournament
2. Data saved to `tournament_selections` table only ✓
3. Queries read from `tournament_selections` table ✓ (fast, indexed)

## Impact Assessment

### Files to Modify: 4
1. `src/shared/services/supabase/types.ts` - Regenerate types
2. `src/shared/services/supabase/legacy/supabaseClient.js` - Update 4 functions
3. `src/features/profile/utils/profileStats.js` - Update 1 function
4. Migration files - Create new migration to drop column

### Database Objects to Remove: 5
1. Column: `cat_app_users.tournament_data`
2. Index: `idx_cat_app_users_tournament_data`
3. Index: `idx_cat_app_users_tournament_recent`
4. Constraint: `check_tournament_data_json`
5. Function: `update_user_tournament_data` (if exists)

### Estimated Effort
- Code changes: 2-3 hours
- Testing: 1-2 hours
- Migration script: 1 hour
- **Total: 4-6 hours**

## Risks

### Critical Risk ⚠️
- **Missing RPC Function:** `update_user_tournament_data` is called but doesn't exist
  - This means tournament saves are likely FAILING in production
  - Need immediate investigation of current tournament functionality
  - May explain data inconsistencies between table and JSONB

### High Risk
- **Data Loss:** Must ensure all JSONB data is migrated to `tournament_selections` table before dropping column
- **Breaking Changes:** All tournament-related features will break if not updated simultaneously

### Medium Risk
- **Performance:** Queries may be slower during migration if not properly indexed

### Low Risk
- **Type Safety:** TypeScript types will need regeneration but errors will be caught at compile time

## Recommendations

1. **Before Migration:**
   - Locate `update_user_tournament_data` RPC function definition
   - Verify all JSONB data exists in `tournament_selections` table
   - Create backup of production database

2. **Migration Order:**
   - Phase 1: Ensure `tournament_selections` has all data
   - Phase 2: Update application code to read from table
   - Phase 3: Deploy code changes
   - Phase 4: Drop JSONB column and related objects

3. **Testing:**
   - Test tournament creation
   - Test tournament history retrieval
   - Test profile statistics calculation
   - Test with users who have large tournament histories

## Next Steps

1. ✅ Complete this audit
2. ⏭️ Identify all code referencing `user_role` column (Task 1.1.2)
3. ⏭️ List all queries using removed columns (Task 1.1.3)
4. ⏭️ Document current query performance baselines (Task 1.1.4)

