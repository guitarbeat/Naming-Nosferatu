# Row Level Security (RLS) Policies Documentation

## Overview

This document describes the simplified RLS policies implemented as part of the backend optimization. The new policies are more maintainable, performant, and secure than the previous overlapping policies.

## Design Principles

1. **Single Source of Truth**: Each access pattern has one clear policy
2. **Consistent Helper Functions**: Use `get_current_user_name()` and `is_admin()` consistently
3. **Explicit Permissions**: No ambiguous "anyone can" policies
4. **Performance First**: Policies optimized for index usage

## Helper Functions

### `get_current_user_name()`
Returns the current authenticated user's username from JWT claims.

```sql
CREATE OR REPLACE FUNCTION get_current_user_name()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'user_name',
    current_setting('app.current_user_name', true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### `is_admin()`
Checks if the current user has admin role.

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_name = get_current_user_name()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

## Table Policies

### cat_name_options

**Purpose**: Manage available cat names

**Policies**:

1. **public_read** - Allow anyone to view active names
   ```sql
   CREATE POLICY "public_read" ON cat_name_options
   FOR SELECT TO public
   USING (is_active = true);
   ```

2. **admin_all** - Allow admins full access
   ```sql
   CREATE POLICY "admin_all" ON cat_name_options
   FOR ALL TO public
   USING (is_admin());
   ```

3. **user_suggest** - Allow users to suggest new names
   ```sql
   CREATE POLICY "user_suggest" ON cat_name_options
   FOR INSERT TO public
   WITH CHECK (true);
   ```

**Access Matrix**:
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Anonymous | Active only | ✅ | ❌ | ❌ |
| User | Active only | ✅ | ❌ | ❌ |
| Admin | All | ✅ | ✅ | ✅ |

### cat_name_ratings

**Purpose**: Store user ratings for cat names

**Policies**:

1. **user_own_data** - Users can manage their own ratings
   ```sql
   CREATE POLICY "user_own_data" ON cat_name_ratings
   FOR ALL TO public
   USING (user_name = get_current_user_name());
   ```

2. **admin_all** - Admins can access all ratings
   ```sql
   CREATE POLICY "admin_all" ON cat_name_ratings
   FOR ALL TO public
   USING (is_admin());
   ```

**Access Matrix**:
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Anonymous | ❌ | ❌ | ❌ | ❌ |
| User | Own only | Own only | Own only | Own only |
| Admin | All | All | All | All |

**Unique Constraint**: `(user_name, name_id)` prevents duplicate ratings

### cat_app_users

**Purpose**: User account information

**Policies**:

1. **user_own_data** - Users can manage their own account
   ```sql
   CREATE POLICY "user_own_data" ON cat_app_users
   FOR ALL TO public
   USING (user_name = get_current_user_name());
   ```

2. **admin_all** - Admins can access all accounts
   ```sql
   CREATE POLICY "admin_all" ON cat_app_users
   FOR ALL TO public
   USING (is_admin());
   ```

**Access Matrix**:
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Anonymous | ❌ | ❌ | ❌ | ❌ |
| User | Own only | Own only | Own only | Own only |
| Admin | All | All | All | All |

### tournament_selections

**Purpose**: Tournament participation history

**Policies**:

1. **user_own_data** - Users can manage their own tournament data
   ```sql
   CREATE POLICY "user_own_data" ON tournament_selections
   FOR ALL TO public
   USING (user_name = get_current_user_name());
   ```

2. **admin_all** - Admins can access all tournament data
   ```sql
   CREATE POLICY "admin_all" ON tournament_selections
   FOR ALL TO public
   USING (is_admin());
   ```

**Access Matrix**:
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Anonymous | ❌ | ❌ | ❌ | ❌ |
| User | Own only | Own only | Own only | Own only |
| Admin | All | All | All | All |

### user_roles

**Purpose**: User role assignments

**Policies**:

1. **admin_all** - Only admins can manage roles
   ```sql
   CREATE POLICY "admin_all" ON user_roles
   FOR ALL TO public
   USING (is_admin());
   ```

**Access Matrix**:
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Anonymous | ❌ | ❌ | ❌ | ❌ |
| User | ❌ | ❌ | ❌ | ❌ |
| Admin | All | All | All | All |

**Security Note**: Separating roles into a dedicated table prevents privilege escalation attacks.

### audit_log

**Purpose**: System audit trail

**Policies**:

1. **admin_read** - Only admins can read audit logs
   ```sql
   CREATE POLICY "admin_read" ON audit_log
   FOR SELECT TO public
   USING (is_admin());
   ```

2. **system_write** - System can write audit logs
   ```sql
   CREATE POLICY "system_write" ON audit_log
   FOR INSERT TO public
   WITH CHECK (true);
   ```

**Access Matrix**:
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Anonymous | ❌ | ✅ (system) | ❌ | ❌ |
| User | ❌ | ✅ (system) | ❌ | ❌ |
| Admin | All | ✅ | ❌ | ❌ |

### site_settings

**Purpose**: Application configuration

**Policies**:

1. **public_read** - Anyone can read settings
   ```sql
   CREATE POLICY "public_read" ON site_settings
   FOR SELECT TO public
   USING (true);
   ```

2. **admin_write** - Only admins can modify settings
   ```sql
   CREATE POLICY "admin_write" ON site_settings
   FOR INSERT TO public
   WITH CHECK (is_admin());
   
   CREATE POLICY "admin_update" ON site_settings
   FOR UPDATE TO public
   USING (is_admin());
   
   CREATE POLICY "admin_delete" ON site_settings
   FOR DELETE TO public
   USING (is_admin());
   ```

**Access Matrix**:
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Anonymous | All | ❌ | ❌ | ❌ |
| User | All | ❌ | ❌ | ❌ |
| Admin | All | ✅ | ✅ | ✅ |

## Testing RLS Policies

Use the provided test script to verify policies:

```bash
psql -f scripts/test_rls_policies.sql
```

### Test Scenarios

1. **Anonymous User**
   - Can view active cat names
   - Can suggest new names
   - Cannot view ratings or user data

2. **Regular User**
   - Can view active cat names
   - Can manage own ratings
   - Can manage own tournament data
   - Cannot view other users' data

3. **Admin User**
   - Full access to all tables
   - Can manage roles
   - Can view audit logs

## Performance Considerations

### Index Usage

All policies are designed to use existing indexes:

- `cat_name_options.is_active` - Partial index for active names
- `cat_name_ratings(user_name, name_id)` - Composite primary key
- `cat_app_users_pkey` - Primary key on user_name
- `tournament_selections.user_name` - Index for user filtering

### Query Optimization

The simplified policies reduce query complexity:

**Before** (multiple overlapping policies):
```sql
-- Multiple policy checks per query
-- Ambiguous permission resolution
-- Slower query planning
```

**After** (single clear policy):
```sql
-- One policy check per query
-- Clear permission model
-- Faster query planning
```

## Security Best Practices

1. **Never bypass RLS** in application code
2. **Use service role key** only for admin operations
3. **Test policies** with different user roles
4. **Monitor failed access** attempts in audit logs
5. **Review policies** quarterly for security updates

## Migration from Old Policies

The old policies had several issues:

1. **Overlapping Permissions**: Multiple policies for same operation
2. **Ambiguous Access**: "Anyone can X" policies were too permissive
3. **Performance Impact**: Multiple policy evaluations per query

The new policies address these by:

1. **Single Policy per Operation**: Clear permission model
2. **Explicit Access Control**: No ambiguous permissions
3. **Optimized Evaluation**: Faster policy checks

## Troubleshooting

### Common Issues

**Issue**: User cannot access their own data
- **Check**: Verify `get_current_user_name()` returns correct username
- **Fix**: Ensure JWT claims include `user_name` field

**Issue**: Admin cannot access data
- **Check**: Verify user has admin role in `user_roles` table
- **Fix**: Insert role: `INSERT INTO user_roles (user_name, role) VALUES ('admin_user', 'admin')`

**Issue**: Slow queries with RLS
- **Check**: Verify indexes exist on filtered columns
- **Fix**: Run `EXPLAIN ANALYZE` to identify missing indexes

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Implementation Summary](.kiro/specs/supabase-backend-optimization/implementation-summary.md)
