# Audit: Queries Using Removed Columns

## Executive Summary

This audit identifies all references to columns that will be removed during the Supabase backend optimization. These columns are being removed to eliminate redundancy, improve performance, and simplify the schema.

**Status**: ✅ Complete  
**Date**: 2024-11-29

---

## Columns Being Removed

### From `cat_name_options`:
1. `user_name` - Not used, names are global
2. `popularity_score` - Calculated value, not stored
3. `total_tournaments` - Calculated value, not stored  
4. `is_hidden` - Replaced by `is_active` column

### From `cat_app_users`:
5. `tournament_data` - JSONB column, migrating to `tournament_selections` table
6. `user_role` - Migrating to `user_roles` table

---

## 1. `cat_name_options.user_name`

### Database Layer

**Migration Files:**
- `supabase/migrations/20251014030000_add_input_validation_constraints.sql` (Lines 62-67)
  - Adds constraint: `cat_name_options_user_name_length`
  - **Action**: Remove this constraint before dropping column

**Impact**: LOW - Column appears unused in application code

---

## 2. `cat_name_options.popularity_score`

### Application Code

**File: `src/shared/services/supabase/types.ts`**
- Lines 83, 94, 105: TypeScript type definitions
- **Action**: Remove from Row, Insert, and Update types

**File: `src/features/tournament/utils.js`**
- Lines 97-98: Sorting by popularity
```javascript
case "popularity":
  return (b.popularity_score || 0) - (a.popularity_score || 0);
```
- **Action**: Remove popularity sort option or calculate dynamically

**File: `src/features/tournament/components/SwipeMode/SwipeCard.jsx`**
- Lines 113-117: Display popularity score
```javascript
{name.popularity_score && (
  <span className={styles.metadataItem}>
    🔥 {name.popularity_score}
  </span>
)}
```
- Lines 144: PropTypes definition
- **Action**: Remove UI display and prop validation

**File: `src/shared/components/NameGrid/NameGrid.jsx`**
- Lines 154, 171: Passing popularity to stats
```javascript
popularity: nameObj.popularity_score,
```
- **Action**: Calculate popularity dynamically or remove

**File: `src/shared/services/supabase/legacy/supabaseClient.js`**
- Lines 151, 167, 183, 199, 215, 231, 247, 263, 301, 342, 358, 374, 390, 406, 422, 438, 454, 657, 681, 887: Fallback data and SELECT queries
- **Action**: Remove from all queries and fallback objects

**File: `README.md`**
- Line 113: Documentation
- **Action**: Update schema documentation

**Impact**: MEDIUM - Used in UI and sorting logic

---

## 3. `cat_name_options.total_tournaments`

### Application Code

**File: `src/shared/services/supabase/types.ts`**
- Lines 84, 95, 106: TypeScript type definitions
- **Action**: Remove from Row, Insert, and Update types

**File: `src/shared/components/NameGrid/NameGrid.jsx`**
- Line 155: Passing tournaments to stats
```javascript
tournaments: nameObj.total_tournaments,
```
- **Action**: Calculate from `tournament_selections` table or remove

**File: `src/shared/services/supabase/legacy/supabaseClient.js`**
- Lines 152, 168, 184, 200, 216, 232, 248, 264, 302, 343, 359, 375, 391, 407, 423, 439, 455, 658, 682, 888: Fallback data and SELECT queries
- **Action**: Remove from all queries and fallback objects

**Impact**: MEDIUM - Used in UI display

---

## 4. `cat_name_options.is_hidden`

### Application Code

**File: `src/shared/services/supabase/types.ts`**
- Lines 112, 122, 132: TypeScript type definitions for `cat_name_ratings` table
- **Note**: This is `cat_name_ratings.is_hidden`, not `cat_name_options.is_hidden`
- **Action**: Keep this - it's a different table

**File: `src/features/profile/hooks/useProfileNameOperations.js`**
- Lines 100: Query for hidden names
```javascript
.eq("is_hidden", true)
```
- **Action**: Keep - this is `cat_name_ratings.is_hidden`

**File: `src/shared/services/supabase/legacy/catNamesAPI.js`**
- Lines 37, 118: Query and filter for hidden names
- **Action**: Keep - this is `cat_name_ratings.is_hidden`

**File: `src/core/hooks/useNameData.js`**
- Line 126: Query for hidden names
- **Action**: Keep - this is `cat_name_ratings.is_hidden`

**File: `src/shared/services/supabase/legacy/supabaseClient.js`**
- Lines 282, 689, 711, 772, 793, 794, 1147, 1777: Multiple queries and filters
- **Action**: Keep - this is `cat_name_ratings.is_hidden`

### Database Layer

**Migration Files:**
- `supabase/migrations/20251114195825_reapply_toggle_name_visibility_rpc.sql`
  - Adds `is_hidden` column to `cat_name_options`
  - Creates index `idx_cat_name_options_is_hidden`
  - Updates RLS policies
  - Creates `toggle_name_visibility` RPC function
  - **Action**: Drop column, index, and update RLS policies

- `supabase/migrations/20250128000000_add_is_hidden_to_cat_name_options.sql`
  - Similar to above migration
  - **Action**: Drop column and related objects

- `supabase/migrations/20251014040000_add_rls_cat_name_tables.sql` (Lines 66-68)
  - RLS policy checks `is_hidden = false`
  - **Action**: Update policy to use `is_active` instead

- `supabase/migrations/20250115030000_modernize_backend_simple.sql` (Lines 19-21, 168)
  - Index on `cat_name_ratings.is_hidden` (different table - keep)
  - Function uses `is_hidden` (different table - keep)

**Impact**: HIGH - Used in RLS policies and admin functions for `cat_name_options`

**Note**: There are TWO different `is_hidden` columns:
1. `cat_name_options.is_hidden` - Being removed (use `is_active` instead)
2. `cat_name_ratings.is_hidden` - Keeping (user-specific hidden names)

---

## 5. `cat_app_users.tournament_data`

### Application Code

**File: `src/shared/services/supabase/types.ts`**
- Lines 51, 59, 67: TypeScript type definitions
- **Action**: Remove from Row, Insert, and Update types

**File: `src/features/profile/utils/profileStats.js`**
- Lines 139-155: Calculate selection analytics from tournament_data
```javascript
// Pull tournaments from cat_app_users.tournament_data via API
const tournaments = await tournamentsAPI.getUserTournaments(userName);
// Flatten selections from tournament_data
const selections = tournaments.flatMap((t) => ...);
```
- **Action**: Update to query `tournament_selections` table directly

**File: `src/shared/services/supabase/legacy/supabaseClient.js`**
- Lines 1198-1251: Save tournament to JSONB
- Lines 1280-1320: Update tournament status in JSONB
- Lines 1368-1387: Get user tournaments from JSONB
- Lines 1473-1501: Create tournament in JSONB
- **Action**: Update all functions to use `tournament_selections` table

### Database Layer

**Migration Files:**
- `supabase/migrations/20251128000000_add_increment_selection_rpc.sql` (Lines 3-16)
  - Comment references tournament_data
  - **Action**: Update comment or remove function

- `supabase/migrations/20250115030000_modernize_backend_simple.sql` (Lines 30-32, 95-97)
  - Index: `idx_cat_app_users_tournament_recent`
  - Constraint: `check_tournament_data_json`
  - **Action**: Drop index and constraint

- `supabase/migrations/20250827013700_add_preferences_columns.sql` (Lines 1-26)
  - Adds `tournament_data` column
  - Creates GIN index
  - **Action**: This migration will be superseded by removal

**Impact**: CRITICAL - Core tournament functionality depends on this

---

## 6. `cat_app_users.user_role`

### Application Code

**File: `src/shared/utils/auth/authConstants.js`**
- Line 15: ROLE_SOURCES array includes "cat_app_users"
```javascript
export const ROLE_SOURCES = ["user_roles", "cat_app_users"];
```
- **Action**: Remove "cat_app_users" from array

### Database Layer

**Migration Files:**
- `supabase/migrations/20250103020000_add_user_roles.sql` (Lines 9-12)
  - Adds comment and index on `user_role` column
  - **Action**: Drop index before dropping column

- `supabase/migrations/20251014010000_create_user_roles_table.sql` (Lines 24-27)
  - Migrates data from `cat_app_users.user_role` to `user_roles` table
  - **Action**: Ensure migration is complete before dropping column

- `supabase/migrations/20251114191400_add_create_user_account_function.sql` (Lines 19-24)
  - Function inserts/updates `user_role` column
  - **Action**: Update function to use `user_roles` table

- `supabase/migrations/20250115010000_fix_login_and_add_roles.sql` (Lines 9-19)
  - Adds `user_role` column back
  - Creates index and comment
  - **Action**: This migration will be superseded by removal

**Impact**: HIGH - Role management depends on this

---

## Summary of Required Actions

### High Priority (Breaking Changes)

1. **tournament_data removal**:
   - Update `tournamentsAPI.getUserTournaments()` to query `tournament_selections` table
   - Update `saveTournamentSelections()` to insert into `tournament_selections` table
   - Update `profileStats.js` to query `tournament_selections` table
   - Drop indexes: `idx_cat_app_users_tournament_data`, `idx_cat_app_users_tournament_recent`
   - Drop constraint: `check_tournament_data_json`
   - Update TypeScript types

2. **user_role removal**:
   - Update `authConstants.js` ROLE_SOURCES array
   - Update `create_user_account` function
   - Drop index: `idx_cat_app_users_user_role`
   - Update TypeScript types

3. **is_hidden removal from cat_name_options**:
   - Update RLS policies to use `is_active` instead
   - Drop `toggle_name_visibility` RPC function or update to use `is_active`
   - Drop index: `idx_cat_name_options_is_hidden`

### Medium Priority (UI Changes)

4. **popularity_score removal**:
   - Remove popularity sort option or calculate dynamically
   - Remove UI display in SwipeCard component
   - Remove from NameGrid stats
   - Update all SELECT queries
   - Update TypeScript types

5. **total_tournaments removal**:
   - Calculate from `tournament_selections` table or remove from UI
   - Remove from NameGrid stats
   - Update all SELECT queries
   - Update TypeScript types

### Low Priority (Cleanup)

6. **user_name removal from cat_name_options**:
   - Drop constraint: `cat_name_options_user_name_length`

---

## Migration Order

1. **Phase 1**: Migrate data
   - Copy `user_role` → `user_roles` table
   - Copy `tournament_data` → `tournament_selections` table

2. **Phase 2**: Update application code
   - Update all queries to use new tables
   - Remove UI references to calculated columns
   - Update TypeScript types

3. **Phase 3**: Update database functions
   - Update RLS policies
   - Update RPC functions
   - Drop constraints

4. **Phase 4**: Drop columns
   - Drop indexes first
   - Drop constraints
   - Drop columns
   - Verify no errors

---

## Testing Checklist

- [ ] Verify all tournament data migrated correctly
- [ ] Verify all role data migrated correctly
- [ ] Test tournament creation/retrieval with new table
- [ ] Test role checks with new table
- [ ] Test RLS policies with `is_active` instead of `is_hidden`
- [ ] Verify UI still displays correctly without calculated columns
- [ ] Run full test suite
- [ ] Performance test queries before/after

---

## Rollback Plan

If issues arise:
1. Keep backup of data before migration
2. Re-add columns with ALTER TABLE
3. Restore data from backup
4. Revert application code changes
5. Restore indexes and constraints

---

## Files Requiring Updates

### TypeScript Types
- `src/shared/services/supabase/types.ts`

### Application Code
- `src/shared/utils/auth/authConstants.js`
- `src/features/profile/utils/profileStats.js`
- `src/shared/services/supabase/legacy/supabaseClient.js`
- `src/features/tournament/utils.js`
- `src/features/tournament/components/SwipeMode/SwipeCard.jsx`
- `src/shared/components/NameGrid/NameGrid.jsx`

### Database Migrations (New)
- Create migration to drop columns
- Create migration to update RLS policies
- Create migration to update RPC functions
- Create migration to drop indexes/constraints

### Documentation
- `README.md`

---

## Estimated Impact

- **Files to modify**: 8 application files + 1 new migration
- **Database objects to drop**: 6 indexes, 2 constraints, 1 RPC function
- **RLS policies to update**: 3 policies
- **TypeScript types to update**: 3 tables
- **Estimated time**: 4-6 hours for code changes + testing
