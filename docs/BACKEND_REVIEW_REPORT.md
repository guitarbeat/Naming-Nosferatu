# Backend and Database Review Report

**Date**: January 2026  
**Project**: Naming Nosferatu  
**Database**: Supabase (Project ID: `ocghxwwwuubgmwsxgyoy`)

## Executive Summary

This comprehensive review examines the Supabase backend implementation, database schema, RLS policies, security measures, and frontend integration patterns. The review identified several critical issues including table name discrepancies, missing schema documentation, and some security concerns that need attention.

### Key Findings

- ✅ **RLS Enabled**: All tables have RLS enabled with comprehensive policies
- ⚠️ **Table Name Discrepancies**: Code uses inconsistent table names (with/without `cat_` prefix)
- ⚠️ **Schema Documentation Gap**: Migration files missing some columns (`status`, `provenance`)
- ✅ **Security Functions**: Properly secured with privilege escalation prevention
- ⚠️ **Client Implementation**: Dual client setup may cause confusion

---

## 1. Table Name Verification

### Actual Database Tables

All tables in the database use the `cat_` prefix:

| Database Table Name | User Provided | Code References | Status |
|---------------------|---------------|-----------------|--------|
| `cat_app_users` | ✅ `cat_app_users` | ✅ `cat_app_users` | ✅ Consistent |
| `cat_audit_log` | ✅ `cat_audit_log` | ✅ `cat_audit_log` | ✅ Consistent |
| `cat_name_options` | ✅ `cat_name_options` | ✅ `cat_name_options` | ✅ Consistent |
| `cat_name_ratings` | ✅ `cat_name_ratings` | ✅ `cat_name_ratings` | ✅ Consistent |
| `cat_rate_limit_events` | ✅ `cat_rate_limit_events` | ❌ Not used in code | ⚠️ Exists but unused |
| `cat_site_settings` | ✅ `cat_site_settings` | ⚠️ Mixed usage | ⚠️ **Inconsistency** |
| `cat_tournament_selections` | ✅ `cat_tournament_selections` | ❌ `tournament_selections` | ⚠️ **Critical Mismatch** |
| `cat_user_roles` | ✅ `cat_user_roles` | ❌ `user_roles` | ⚠️ **Critical Mismatch** |

### Critical Issues

1. **`tournament_selections` vs `cat_tournament_selections`**
   - Code references: `source/hooks/useProfile.ts`, `source/features/analytics/analyticsService.ts`
   - **Impact**: Queries will fail if table name doesn't match
   - **Action Required**: Update all code references to use `cat_tournament_selections`

2. **`user_roles` vs `cat_user_roles`**
   - Code references: `source/features/auth/authUtils.ts`, `source/features/auth/adminService.ts`
   - **Impact**: Role queries will fail
   - **Action Required**: Update all code references to use `cat_user_roles`

3. **`site_settings` vs `cat_site_settings`**
   - Service file references `cat_chosen_name` (different table entirely)
   - **Action Required**: Clarify which table is actually used for site settings

---

## 2. RLS Policy Audit

### RLS Status

✅ **All tables have RLS enabled**:
- `cat_app_users` - RLS enabled
- `cat_audit_log` - RLS enabled
- `cat_name_options` - RLS enabled
- `cat_name_ratings` - RLS enabled
- `cat_rate_limit_events` - RLS enabled
- `cat_site_settings` - RLS enabled
- `cat_tournament_selections` - RLS enabled
- `cat_user_roles` - RLS enabled

### RLS Policies by Table

#### `cat_app_users` (5 policies)

1. **"Public can read all users"** - `SELECT` - `public` role
   - Allows anyone to read user data (for public profiles)
   - ✅ Appropriate for username-based auth

2. **"Authenticated users can read all users"** - `SELECT` - `authenticated` role
   - Redundant with public policy
   - ⚠️ Consider consolidating

3. **"Users can insert own data"** - `INSERT` - `public` role
   - `WITH CHECK`: `user_name = get_current_user_name()`
   - ✅ Prevents users from creating accounts for others

4. **"Users can update own data"** - `UPDATE` - `public` role
   - `USING`: `user_name = get_current_user_name()`
   - `WITH CHECK`: `user_name = get_current_user_name()`
   - ✅ Properly restricts updates to own data

5. **"Admins can manage all users"** - `ALL` - `public` role
   - `USING`: `is_admin()`
   - `WITH CHECK`: `is_admin()`
   - ✅ Allows admin management

**Assessment**: ✅ Well-secured with proper user isolation

#### `cat_audit_log` (1 policy)

1. **"Admins can read audit log"** - `SELECT` - `public` role
   - `USING`: `is_admin()`
   - ✅ Appropriate - audit logs should be admin-only

**Assessment**: ✅ Properly restricted

#### `cat_name_options` (5 policies)

1. **"Public can read active names"** - `SELECT` - `public` role
   - `USING`: `(is_active = true) AND ((is_hidden = false) OR is_admin())`
   - ✅ Allows public to see active, non-hidden names

2. **"Public can read visible names"** - `SELECT` - `public` role
   - `USING`: `(is_hidden = false) OR (is_hidden IS NULL)`
   - ⚠️ Redundant with policy #1, may cause confusion

3. **"Users can suggest names"** - `INSERT` - `public` role
   - `WITH CHECK`: `validate_cat_name_suggestion_with_rate_limit(name, description)`
   - ✅ Includes rate limiting validation

4. **"Admins can update names"** - `UPDATE` - `public` role
   - `USING`: `is_admin()`
   - `WITH CHECK`: `is_admin()`
   - ✅ Admin-only updates

5. **"Admins can manage all names"** - `ALL` - `public` role
   - `USING`: `is_admin()`
   - `WITH CHECK`: `is_admin()`
   - ⚠️ Redundant with policy #4

6. **"Admins can delete names"** - `DELETE` - `public` role
   - `USING`: `is_admin()`
   - ✅ Admin-only deletes

**Assessment**: ⚠️ Some redundancy, but functionally secure

#### `cat_name_ratings` (4 policies)

1. **"Public can read all ratings"** - `SELECT` - `public` role
   - `USING`: `true`
   - ✅ Ratings are public data (for leaderboards)

2. **"Users can manage own ratings"** - `ALL` - `public` role
   - `USING`: `(user_name = get_current_user_name()) OR is_admin()`
   - `WITH CHECK`: `(user_name = get_current_user_name()) OR is_admin()`
   - ✅ Users can only modify their own ratings

3. **"Users can manage ratings with header auth"** - `ALL` - `public` role
   - `USING`: `user_name = get_user_name_from_header()`
   - `WITH CHECK`: `user_name = get_user_name_from_header()`
   - ⚠️ Alternative auth method - may be redundant

4. **"Admins can manage all ratings"** - `ALL` - `authenticated` role
   - `USING`: `is_admin()`
   - `WITH CHECK`: `is_admin()`
   - ⚠️ Redundant with policy #2 (which includes admin check)

**Assessment**: ⚠️ Multiple overlapping policies, but secure

#### `cat_tournament_selections` (4 policies)

1. **"Public can read all selections"** - `SELECT` - `public` role
   - `USING`: `true`
   - ✅ Tournament history is public

2. **"Anyone can insert selections"** - `INSERT` - `public` role
   - `WITH CHECK`: `(user_name IS NOT NULL) AND (name IS NOT NULL)`
   - ⚠️ **Security Concern**: No user validation - anyone can insert with any username

3. **"Anyone can update selections"** - `UPDATE` - `public` role
   - `USING`: `user_name IS NOT NULL`
   - `WITH CHECK`: `user_name IS NOT NULL`
   - ⚠️ **Security Concern**: No user ownership check

4. **"Anyone can delete selections"** - `DELETE` - `public` role
   - `USING`: `user_name IS NOT NULL`
   - ⚠️ **Security Concern**: No user ownership check

**Assessment**: ⚠️ **CRITICAL SECURITY ISSUE** - Users can modify/delete other users' selections

#### `cat_user_roles` (2 policies)

1. **"Public can read all roles"** - `SELECT` - `public` role
   - `USING`: `true`
   - ✅ Roles are public (for UI display)

2. **"Users can view their own roles"** - `SELECT` - `public` role
   - `USING`: `auth.uid() = user_id`
   - ⚠️ Uses `auth.uid()` but app uses username-based auth - may not work

**Assessment**: ⚠️ Policy #2 may not function with username-based auth

#### `cat_site_settings` (2 policies)

1. **"Public can read site settings"** - `SELECT` - `public` role
   - `USING`: `true`
   - ✅ Settings are public (for app configuration)

2. **"Admins can manage site settings"** - `ALL` - `public` role
   - `USING`: `is_admin()`
   - `WITH CHECK`: `is_admin()`
   - ✅ Admin-only modifications

**Assessment**: ✅ Properly secured

#### `cat_rate_limit_events` (1 policy)

1. **"Admins can view rate limits"** - `ALL` - `public` role
   - `USING`: `is_admin()`
   - ✅ Admin-only access

**Assessment**: ✅ Appropriate

### RLS Policy Summary

| Table | Policies | Security Level | Issues |
|-------|----------|----------------|--------|
| `cat_app_users` | 5 | ✅ Secure | Minor redundancy |
| `cat_audit_log` | 1 | ✅ Secure | None |
| `cat_name_options` | 6 | ✅ Secure | Some redundancy |
| `cat_name_ratings` | 4 | ✅ Secure | Overlapping policies |
| `cat_tournament_selections` | 4 | ⚠️ **INSECURE** | **No user ownership checks** |
| `cat_user_roles` | 2 | ⚠️ Partial | Policy may not work with username auth |
| `cat_site_settings` | 2 | ✅ Secure | None |
| `cat_rate_limit_events` | 1 | ✅ Secure | None |

---

## 3. Client Implementation Review

### Dual Client Setup

The codebase has two Supabase client implementations:

1. **`src/integrations/supabase/client.ts`** (Auto-generated)
   - Uses: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Simple, direct client creation
   - **Status**: Appears unused in actual codebase

2. **`source/services/supabase/clientBase.ts`** (Custom implementation)
   - Uses: `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`
   - Includes retry logic, error handling, user context management
   - **Status**: ✅ Primary client used throughout codebase

### Client Usage Analysis

**Primary Import Pattern**: `@supabase/client`
- Resolves to: `source/services/supabase/client.ts` (re-exports from `clientBase.ts`)
- Used in: 20+ files across the codebase
- ✅ Consistent usage pattern

**Direct Import** (Rare):
- `source/features/analytics/analyticsService.ts` imports directly from `@/services/supabase/clientBase`
- ⚠️ Inconsistent - should use `@supabase/client` for consistency

### User Context Management

The custom client implements username-based authentication:

1. **Header-based context**: Sets `x-user-name` header in client
2. **RPC-based context**: Calls `set_user_context()` RPC function
3. **Session variable**: Sets `app.user_name` PostgreSQL session variable

**Files using context setting**:
- `source/hooks/useUserSession.ts` - On login
- `source/services/supabase/modules/nameService.ts` - Before operations
- `source/services/supabase/modules/siteSettingsService.ts` - For admin ops

**Assessment**: ✅ Context is set consistently, but could be more centralized

---

## 4. Table Usage Analysis

### `cat_app_users` (148 rows)

**Usage Locations**:
- `source/hooks/useUserSession.ts` - User login/creation, preference retrieval
- `source/providers/AuthProvider.tsx` - User profile fetching (uses email-based auth - may conflict)
- `source/features/auth/adminService.ts` - Admin user listing

**Operations**:
- ✅ Create user via `create_user_account()` RPC
- ✅ Read user preferences
- ✅ Update user preferences
- ✅ List users (admin only)

**Issues**:
- ⚠️ `AuthProvider.tsx` uses email-based auth which conflicts with username-based system
- ✅ Username normalization implemented (`normalizeUsername()`)

### `cat_name_options` (172 rows)

**Usage Locations**:
- `source/services/supabase/modules/nameService.ts` - CRUD operations
- `source/features/tournament/TournamentLogic.ts` - Tournament name fetching
- `source/features/analytics/analyticsService.ts` - Analytics queries

**Operations**:
- ✅ Read active names (filtered by `is_active` and `is_hidden`)
- ✅ Insert new names (with rate limiting)
- ✅ Update names (admin only)
- ✅ Delete names (admin only)
- ✅ Hide/unhide names (admin only)

**Schema Discrepancy Found**:
- Code references: `status`, `provenance` columns
- ✅ **Verified**: These columns exist in database (not in initial migration file)
- `status`: `name_status` enum (default: `'candidate'`)
- `provenance`: `jsonb` array (default: `'[]'`)

**Issues**:
- ⚠️ Migration file incomplete - missing `status` and `provenance` columns
- ✅ Code usage matches actual schema

### `cat_name_ratings` (1,153 rows)

**Usage Locations**:
- `source/features/tournament/TournamentLogic.ts` - Rating saves (upsert)
- `source/features/analytics/analyticsService.ts` - Statistics aggregation
- `source/hooks/useProfile.ts` - User rating display

**Operations**:
- ✅ Upsert ratings with composite key (`user_name`, `name_id`)
- ✅ Read all ratings (public)
- ✅ Aggregate statistics
- ✅ User-specific rating queries

**Issues**:
- ✅ Composite primary key properly used
- ✅ Upsert operations correctly specify `onConflict: "user_name,name_id"`

### `cat_tournament_selections` (2,653 rows)

**Usage Locations**:
- `source/features/analytics/analyticsService.ts` - Selection analytics
- `source/hooks/useProfile.ts` - User selection history

**Operations**:
- ✅ Insert tournament selections
- ✅ Read all selections (public)
- ✅ Aggregate selection statistics
- ✅ User-specific selection queries

**Critical Issues**:
- ⚠️ **Table name mismatch**: Code uses `tournament_selections`, database has `cat_tournament_selections`
- ⚠️ **RLS Policy Issue**: No user ownership validation (see Security section)

### `cat_user_roles` (13 rows)

**Usage Locations**:
- `source/features/auth/authUtils.ts` - Role checking (`hasRole()`, `isUserAdmin()`)
- `source/features/auth/adminService.ts` - User listing with roles

**Operations**:
- ✅ Read roles (public)
- ✅ Check user roles via `has_role()` function
- ✅ Admin status checking

**Issues**:
- ⚠️ **Table name mismatch**: Code uses `user_roles`, database has `cat_user_roles`
- ⚠️ RLS policy uses `auth.uid()` which may not work with username-based auth

### `cat_audit_log` (331 rows)

**Usage**: Trigger-based only
- Automatic logging on INSERT/UPDATE/DELETE
- No direct frontend usage found

**Assessment**: ✅ Properly implemented via triggers

### `cat_site_settings` (1 row)

**Usage Locations**:
- `source/services/supabase/modules/siteSettingsService.ts` - But references `cat_chosen_name` table instead

**Issues**:
- ⚠️ Service file doesn't actually use `cat_site_settings` table
- ⚠️ Uses `cat_chosen_name` table (not in user's table list)
- ⚠️ Unclear which table is for site settings

### `cat_rate_limit_events` (0 rows)

**Status**: Table exists but **not used in codebase**
- RLS policy exists (admin-only)
- No code references found
- ⚠️ May be used by database functions (e.g., `validate_cat_name_suggestion_with_rate_limit`)

---

## 5. Security Audit

### SECURITY DEFINER Functions

#### `set_user_context(user_name_param TEXT)`
- **Security Type**: `DEFINER`
- **Grants**: `authenticated`, `anon`
- **Purpose**: Sets `app.user_name` session variable for RLS
- **Security**: ✅ Safe - only sets session variable, no data access

#### `create_user_account(p_user_name, p_preferences, p_user_role)`
- **Security Type**: `DEFINER`
- **Purpose**: Creates user account and optionally assigns role
- **Security Fix Applied**: ✅ Migration `20260103035951` added admin check
  ```sql
  IF p_user_role != 'user' AND NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can create privileged accounts';
  END IF;
  ```
- **Assessment**: ✅ Properly secured against privilege escalation

#### `is_admin()`
- **Security Type**: `DEFINER`
- **Purpose**: Checks if current user is admin
- **Implementation**: Uses `get_current_user_name()` then checks `cat_user_roles`
- **Assessment**: ✅ Secure - relies on session context

#### `has_role(_user_name TEXT, _role TEXT)`
- **Security Type**: `DEFINER`
- **Purpose**: Checks if user has specific role
- **Implementation**: Case-insensitive lookup in `cat_user_roles`
- **Assessment**: ✅ Secure - read-only operation

#### `get_current_user_name()`
- **Security Type**: `INVOKER` (not DEFINER)
- **Purpose**: Gets current username from session
- **Implementation**: Reads `app.user_name` or JWT claims
- **Assessment**: ✅ Safe - no privilege escalation risk

### Privilege Escalation Vectors

**Checked**:
- ✅ User creation with admin role - Protected by `create_user_account()` check
- ✅ Role assignment - Only via `create_user_account()` (admin-only for non-user roles)
- ✅ Direct role table modification - RLS policies prevent (but see `cat_user_roles` policy issue)

**Remaining Concerns**:
- ⚠️ `cat_user_roles` has no INSERT/UPDATE/DELETE policies - relies on function-based assignment only
- ⚠️ `cat_tournament_selections` allows anyone to modify any user's selections

### RLS Coverage Gaps

1. **`cat_tournament_selections`** - ⚠️ **CRITICAL**
   - No user ownership validation
   - Anyone can insert/update/delete with any `user_name`
   - **Recommendation**: Add policies requiring `user_name = get_current_user_name()`

2. **`cat_user_roles`** - ⚠️ **MODERATE**
   - No INSERT/UPDATE/DELETE policies
   - Relies entirely on `create_user_account()` function
   - **Recommendation**: Add explicit policies or document that function is only way to modify roles

---

## 6. Performance Review

### Index Analysis

**Well-Indexed Tables**:

1. **`cat_name_ratings`** - Excellent indexing
   - Composite PK: `(user_name, name_id)`
   - User stats index: `(user_name, rating DESC) INCLUDE (wins, losses, is_hidden, updated_at)`
   - Leaderboard index: `(name_id, rating DESC NULLS LAST) INCLUDE (wins, losses, user_name)`
   - Hidden ratings: `(user_name, name_id) WHERE is_hidden = true`
   - ✅ Covers all common query patterns

2. **`cat_name_options`** - Good indexing
   - Name lookup: `(name)`
   - Active names: `(name, avg_rating) WHERE is_active = true`
   - Categories: GIN index on `categories` array
   - Hidden filter: `(is_hidden) WHERE is_hidden = true`
   - ✅ Covers search and filtering needs

3. **`cat_app_users`** - Adequate
   - Primary key: `(user_name)`
   - Preferences: GIN index on `preferences` JSONB
   - ✅ Sufficient for user lookups

**Missing Indexes**:

1. **`cat_tournament_selections`**
   - ⚠️ No index on `user_name` (frequently queried)
   - ⚠️ No index on `tournament_id` (used in analytics)
   - ⚠️ No index on `selected_at` (used for date filtering)
   - **Recommendation**: Add indexes on these columns

2. **`cat_user_roles`**
   - ✅ Has unique indexes on `(user_id, role)` and `(user_name, role)`
   - ✅ Sufficient for role lookups

### Query Pattern Analysis

**Efficient Patterns**:
- ✅ Uses composite keys for upserts
- ✅ Filters at database level (`is_active`, `is_hidden`)
- ✅ Uses indexes for leaderboard queries

**Inefficient Patterns**:
- ⚠️ Some queries fetch all rows then filter in memory
  - Example: `analyticsService.ts` fetches all selections then groups
  - **Recommendation**: Add database-level aggregation
- ⚠️ Multiple sequential queries that could be parallelized
  - Example: `getSiteStats()` makes 5 separate queries
  - ✅ Already using `Promise.all()` in some places

**Pagination**:
- ⚠️ No pagination on large result sets
  - `getNamesWithDescriptions()` limits to 1000 but no offset
  - **Recommendation**: Implement cursor-based pagination for large datasets

---

## 7. Data Consistency

### Foreign Key Constraints

**Verified**:
- ✅ `cat_name_ratings.name_id` → `cat_name_options.id` (ON DELETE CASCADE)
- ✅ `cat_tournament_selections.name_id` → `cat_name_options.id` (ON DELETE CASCADE)

**Missing**:
- ⚠️ `cat_name_ratings.user_name` → `cat_app_users.user_name` (no FK constraint)
- ⚠️ `cat_tournament_selections.user_name` → `cat_app_users.user_name` (no FK constraint)
- ⚠️ `cat_user_roles.user_name` → `cat_app_users.user_name` (no FK constraint)

**Impact**: Orphaned records possible if usernames are deleted/changed

### Data Validation

**Schema Constraints**:
- ✅ Name length: 1-100 chars (`CHECK (length(name) >= 1 AND length(name) <= 100)`)
- ✅ Rating range: 800-2400 (enforced in code, not schema)
- ✅ Non-negative wins/losses (`CHECK (wins >= 0)`, `CHECK (losses >= 0)`)

**Client-Side Validation**:
- ✅ Rating clamping in `TournamentLogic.ts`: `Math.min(2400, Math.max(800, Math.round(rating)))`
- ⚠️ Name length validation not found in code (relies on database constraint)

---

## 8. Recommendations

### Critical (Security)

1. **Fix `cat_tournament_selections` RLS Policies**
   ```sql
   -- Add user ownership checks
   ALTER POLICY "Anyone can insert selections" ON cat_tournament_selections
   USING (user_name = get_current_user_name());
   
   ALTER POLICY "Anyone can update selections" ON cat_tournament_selections
   USING (user_name = get_current_user_name());
   
   ALTER POLICY "Anyone can delete selections" ON cat_tournament_selections
   USING (user_name = get_current_user_name());
   ```

2. **Fix Table Name Mismatches**
   - Update all references from `tournament_selections` → `cat_tournament_selections`
   - Update all references from `user_roles` → `cat_user_roles`

### High Priority

3. **Add Missing Indexes**
   ```sql
   CREATE INDEX idx_tournament_selections_user_name 
   ON cat_tournament_selections(user_name);
   
   CREATE INDEX idx_tournament_selections_tournament_id 
   ON cat_tournament_selections(tournament_id);
   
   CREATE INDEX idx_tournament_selections_selected_at 
   ON cat_tournament_selections(selected_at DESC);
   ```

4. **Add Foreign Key Constraints**
   ```sql
   ALTER TABLE cat_name_ratings
   ADD CONSTRAINT fk_ratings_user_name
   FOREIGN KEY (user_name) REFERENCES cat_app_users(user_name)
   ON DELETE CASCADE;
   
   ALTER TABLE cat_tournament_selections
   ADD CONSTRAINT fk_selections_user_name
   FOREIGN KEY (user_name) REFERENCES cat_app_users(user_name)
   ON DELETE CASCADE;
   ```

5. **Update Migration File**
   - Add `status` and `provenance` columns to `cat_name_options` in migration
   - Document all tables with `cat_` prefix

### Medium Priority

6. **Consolidate RLS Policies**
   - Remove redundant policies (e.g., `cat_name_options` has overlapping SELECT policies)
   - Document policy rationale

7. **Clarify Site Settings Table**
   - Determine if `cat_site_settings` or `cat_chosen_name` is the correct table
   - Update service file accordingly

8. **Improve Query Efficiency**
   - Add database-level aggregation for analytics
   - Implement pagination for large result sets

### Low Priority

9. **Documentation**
   - Create RLS policy documentation
   - Document username-based auth flow
   - Create database schema diagram

10. **Code Consistency**
    - Standardize on `@supabase/client` import (remove direct `clientBase` imports)
    - Centralize user context setting

---

## 9. Migration Checklist

Create a new migration file with:

- [ ] Fix `cat_tournament_selections` RLS policies
- [ ] Add missing indexes on `cat_tournament_selections`
- [ ] Add foreign key constraints for user_name references
- [ ] Update migration documentation for `status` and `provenance` columns
- [ ] Add comments explaining RLS policy rationale

---

## 10. Code Updates Required

### Files to Update

1. **`source/hooks/useProfile.ts`**
   - Change `tournament_selections` → `cat_tournament_selections`

2. **`source/features/analytics/analyticsService.ts`**
   - Change `tournament_selections` → `cat_tournament_selections` (5 occurrences)

3. **`source/features/auth/authUtils.ts`**
   - Change `user_roles` → `cat_user_roles`

4. **`source/features/auth/adminService.ts`**
   - Change `user_roles` → `cat_user_roles`

5. **`source/services/supabase/modules/siteSettingsService.ts`**
   - Clarify table usage (`cat_site_settings` vs `cat_chosen_name`)

6. **`source/features/analytics/analyticsService.ts`**
   - Change import from direct `clientBase` to `@supabase/client`

---

## Conclusion

The backend is generally well-architected with comprehensive RLS policies and good indexing. However, there are critical security issues with `cat_tournament_selections` that must be addressed immediately. Table name inconsistencies need to be resolved to prevent runtime errors, and some performance optimizations would benefit the application.

**Overall Security Rating**: ⚠️ **Needs Attention** (due to tournament_selections policies)

**Overall Code Quality**: ✅ **Good** (with noted inconsistencies)

**Overall Performance**: ✅ **Good** (with room for optimization)

---

**Report Generated**: January 2026  
**Next Review**: After implementing critical security fixes
