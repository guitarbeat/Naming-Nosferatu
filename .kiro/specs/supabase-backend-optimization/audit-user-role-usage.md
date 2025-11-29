# Audit: user_role Column Usage

## Executive Summary

This audit identifies all references to the `user_role` column in `cat_app_users` table across the codebase. The goal is to prepare for migration to use only the `user_roles` table as the single source of truth for role management.

**Status**: ✅ Complete  
**Date**: 2025-11-29  
**Scope**: Entire codebase including TypeScript, JavaScript, SQL migrations, and documentation

---

## Findings Overview

### Database Layer
- **Column Definition**: `cat_app_users.user_role` (VARCHAR/TEXT, nullable)
- **Dual System**: Both `user_roles` table AND `cat_app_users.user_role` column exist
- **Migration Created**: `20251014010000_create_user_roles_table.sql` already created the `user_roles` table

### Code References Found

**Total References**: 15 locations across 7 files

---

## Detailed Findings

### 1. TypeScript Type Definitions

**File**: `src/shared/services/supabase/types.ts`

```typescript
// Lines 54, 62, 70
export interface CatAppUsers {
  Row: {
    user_role: string | null;  // ← Column definition
  };
  Insert: {
    user_role?: string | null;  // ← Insert type
  };
  Update: {
    user_role?: string | null;  // ← Update type
  };
}

// Lines 295-298
get_current_user_role: {
  Args: never;
  Returns: Database["public"]["Enums"]["app_role"];
}
```

**Impact**: HIGH  
**Action Required**: 
- Remove `user_role` from Row/Insert/Update types after column is dropped
- Keep `get_current_user_role` function (it should query `user_roles` table)

---

### 2. User Session Hook

**File**: `src/core/hooks/useUserSession.js`

**Line 139-140**: SELECT query includes user_role
```javascript
.select("user_name, preferences, user_role")
.eq("user_name", trimmedName)
```

**Line 162**: Default role passed to create_user_account function
```javascript
p_user_role: "user",
```

**Impact**: HIGH  
**Action Required**:
- Remove `user_role` from SELECT query
- Update `create_user_account` function call to not pass `p_user_role` (or update function to insert into `user_roles` table instead)

---

### 3. Auth Utility Functions

**File**: `src/shared/utils/auth/authApi.js`

**Line 7**: Import includes ROLE_SOURCES constant
```javascript
import { USER_ROLES, ROLE_SOURCES } from "./authConstants";
```

**Lines 110-128**: Dual source role fetching logic
```javascript
if (source === "user_roles") {
  const { data, error } = await activeSupabase
    .from("user_roles")
    .select("role")
    .eq("user_name", trimmedUserName)
    .maybeSingle();
}

const { data, error } = await activeSupabase
  .from("cat_app_users")
  .select("user_role")  // ← Queries user_role column
  .eq("user_name", trimmedUserName)
  .maybeSingle();

return handleRoleResponse(data, error, source, state, "user_role");
```

**Line 253**: Admin check uses USER_ROLES constant
```javascript
return _hasRole(userIdOrName, USER_ROLES.ADMIN);
```

**Impact**: HIGH  
**Action Required**:
- Remove fallback to `cat_app_users.user_role` query
- Update to only query `user_roles` table
- Remove "cat_app_users" from ROLE_SOURCES array

---

### 4. Auth Constants

**File**: `src/shared/utils/auth/authConstants.js`

**Line 9-14**: USER_ROLES constant definition
```javascript
export const USER_ROLES = {
  USER: "user",
  MODERATOR: "moderator",
  ADMIN: "admin",
};
```

**Line 15**: ROLE_SOURCES includes both sources
```javascript
export const ROLE_SOURCES = ["user_roles", "cat_app_users"];
```

**Impact**: MEDIUM  
**Action Required**:
- Keep USER_ROLES constant (still needed)
- Update ROLE_SOURCES to only include "user_roles"

---

### 5. Auth Validation

**File**: `src/shared/utils/auth/authValidation.js`

**Lines 6-12**: Uses USER_ROLES for priority mapping
```javascript
import { USER_ROLES } from "./authConstants";

const ROLE_PRIORITY = {
  [USER_ROLES.USER]: 0,
  [USER_ROLES.MODERATOR]: 1,
  [USER_ROLES.ADMIN]: 2,
};
```

**Impact**: LOW  
**Action Required**: None (uses constant, not column directly)

---

### 6. Legacy Supabase Client

**File**: `src/shared/services/supabase/legacy/supabaseClient.js`

**Line 1940**: Admin query includes user_role
```javascript
.select("user_name, user_role, created_at, updated_at")
.order("user_name", { ascending: true });
```

**Impact**: MEDIUM  
**Action Required**:
- Remove `user_role` from SELECT query
- Update to JOIN with `user_roles` table if role info is needed

---

### 7. Profile User Hook

**File**: `src/features/profile/hooks/useProfileUser.js`

**Lines 47-49**: Checks user_role for badges
```javascript
if (user.user_role && user.user_role !== "user") {
  badges.push(user.user_role);
}
```

**Lines 157-159**: Sets user_role in user object
```javascript
uniqueUsers.set(userName, {
  user_name: userName,
  user_role: existing?.user_role ?? null,
  created_at: existing?.created_at ?? null,
  updated_at: existing?.updated_at ?? null,
});
```

**Impact**: MEDIUM  
**Action Required**:
- Update to query `user_roles` table for role information
- Update badge logic to use new data source

---

### 8. Database Migrations

**File**: `supabase/migrations/20251014010000_create_user_roles_table.sql`

This migration already:
- ✅ Creates `user_roles` table
- ✅ Creates `app_role` enum type
- ✅ Migrates existing data from `cat_app_users.user_role` to `user_roles`
- ✅ Creates helper functions (`has_role`, `get_user_role`)
- ✅ Sets up RLS policies

**Note**: The column was NOT dropped in this migration (intentional for backward compatibility)

---

## Database Functions Affected

### Functions that need updating:

1. **`get_current_user_role()`** - Should query `user_roles` table only
2. **`has_role(user_name, role)`** - Already queries `user_roles` table ✅
3. **`get_user_role(user_name)`** - Already queries `user_roles` table ✅
4. **`create_user_account()`** - May accept `p_user_role` parameter that inserts into column

---

## Migration Strategy

### Phase 1: Update Application Code (Non-Breaking)
1. Update all queries to use `user_roles` table instead of `user_role` column
2. Update TypeScript types (but keep column in database)
3. Test thoroughly with both sources available

### Phase 2: Deploy & Monitor
1. Deploy updated code
2. Monitor for errors
3. Verify all role checks work correctly

### Phase 3: Drop Column (Breaking)
1. Create migration to drop `cat_app_users.user_role` column
2. Apply in maintenance window
3. Verify no errors

---

## Files Requiring Updates

### High Priority (Direct Column Access)
1. ✅ `src/shared/services/supabase/types.ts` - Remove from types
2. ✅ `src/core/hooks/useUserSession.js` - Remove from SELECT, update create call
3. ✅ `src/shared/utils/auth/authApi.js` - Remove fallback query
4. ✅ `src/shared/services/supabase/legacy/supabaseClient.js` - Remove from SELECT
5. ✅ `src/features/profile/hooks/useProfileUser.js` - Query user_roles table instead

### Medium Priority (Configuration)
6. ✅ `src/shared/utils/auth/authConstants.js` - Update ROLE_SOURCES

### Low Priority (No Changes Needed)
7. ⚪ `src/shared/utils/auth/authValidation.js` - Uses constants only

### Database Functions
8. ✅ Review `create_user_account()` function
9. ✅ Review `get_current_user_role()` function

---

## Testing Checklist

- [ ] Test user login with role from `user_roles` table
- [ ] Test admin checks work correctly
- [ ] Test role-based UI elements (badges, permissions)
- [ ] Test user creation assigns role to `user_roles` table
- [ ] Test profile page displays roles correctly
- [ ] Test legacy admin queries work without `user_role` column

---

## Risks & Mitigation

### Risk 1: Data Inconsistency
**Risk**: `user_roles` table and `user_role` column may have different values  
**Mitigation**: Run data validation query before migration

### Risk 2: Missing Roles
**Risk**: Some users may not have entries in `user_roles` table  
**Mitigation**: Migration script should handle NULL/missing roles with default 'user'

### Risk 3: Function Dependencies
**Risk**: Database functions may still reference old column  
**Mitigation**: Review all functions that mention 'role' before dropping column

---

## Next Steps

1. ✅ Complete this audit
2. ⏭️ List all queries using removed columns (Task 1.1.3)
3. ⏭️ Document current query performance baselines (Task 1.1.4)
4. ⏭️ Create backup strategy (Task 1.2)
5. ⏭️ Begin Phase 2: Add constraints (Task 2.x)

---

## Appendix: Search Queries Used

```bash
# Primary search
grep -r "user_role" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.sql"

# Secondary search for user_roles table
grep -r "user_roles" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.sql"
```

---

**Audit completed successfully** ✅
