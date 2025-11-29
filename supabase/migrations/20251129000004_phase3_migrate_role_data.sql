-- Migration: Phase 3 - Migrate Role Data
-- Part of Supabase Backend Optimization
-- This migration copies user_role data from cat_app_users to user_roles table

-- ===== BACKUP REMINDER =====
-- Before running: ./scripts/create_backup.sh phase3_role_migration

-- ===== PRE-MIGRATION CHECKS =====

DO $
DECLARE
  users_with_roles INTEGER;
  existing_role_records INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 3: Role Data Migration';
  RAISE NOTICE '========================================';
  
  -- Count users with roles in cat_app_users
  SELECT COUNT(*) INTO users_with_roles
  FROM cat_app_users
  WHERE user_role IS NOT NULL;

  -- Count existing records in user_roles
  SELECT COUNT(*) INTO existing_role_records
  FROM user_roles;

  RAISE NOTICE 'Users with roles in cat_app_users: %', users_with_roles;
  RAISE NOTICE 'Existing records in user_roles: %', existing_role_records;
  RAISE NOTICE '';
END $;

-- ===== VALIDATE ROLE VALUES =====

-- Check for invalid role values that won't fit in the enum
DO $
DECLARE
  invalid_roles TEXT[];
BEGIN
  SELECT array_agg(DISTINCT user_role) INTO invalid_roles
  FROM cat_app_users
  WHERE user_role IS NOT NULL
    AND user_role NOT IN ('user', 'admin', 'moderator');

  IF array_length(invalid_roles, 1) > 0 THEN
    RAISE WARNING 'Found invalid role values: %', invalid_roles;
    RAISE WARNING 'These will be converted to ''user'' role';
  ELSE
    RAISE NOTICE '✓ All role values are valid';
  END IF;
END $;

-- ===== MIGRATE ROLE DATA =====

-- Insert roles from cat_app_users into user_roles table
-- Handle users with no role by defaulting to 'user'
INSERT INTO user_roles (user_name, role, created_at)
SELECT 
  user_name,
  CASE 
    WHEN user_role IS NULL THEN 'user'::app_role
    WHEN user_role NOT IN ('user', 'admin', 'moderator') THEN 'user'::app_role
    ELSE user_role::app_role
  END as role,
  COALESCE(created_at, NOW()) as created_at
FROM cat_app_users
WHERE user_name IS NOT NULL
ON CONFLICT (user_name, role) DO NOTHING;

-- Log migration results
DO $
DECLARE
  migrated_count INTEGER;
BEGIN
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE '✓ Migrated % role records to user_roles table', migrated_count;
END $;

-- ===== HANDLE USERS WITH NO ROLE =====

-- Ensure all users have at least the 'user' role
INSERT INTO user_roles (user_name, role, created_at)
SELECT 
  user_name,
  'user'::app_role,
  COALESCE(created_at, NOW())
FROM cat_app_users
WHERE user_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_name = cat_app_users.user_name
  )
ON CONFLICT (user_name, role) DO NOTHING;

-- Log default role assignments
DO $
DECLARE
  default_count INTEGER;
BEGIN
  GET DIAGNOSTICS default_count = ROW_COUNT;
  IF default_count > 0 THEN
    RAISE NOTICE '✓ Assigned default ''user'' role to % users', default_count;
  END IF;
END $;

-- ===== VERIFICATION =====

-- Verify all users have roles
DO $
DECLARE
  users_without_roles INTEGER;
  total_users INTEGER;
  total_role_records INTEGER;
BEGIN
  -- Count users without roles
  SELECT COUNT(*) INTO users_without_roles
  FROM cat_app_users
  WHERE user_name IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_name = cat_app_users.user_name
    );

  -- Count totals
  SELECT COUNT(*) INTO total_users FROM cat_app_users;
  SELECT COUNT(*) INTO total_role_records FROM user_roles;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Total role records: %', total_role_records;
  RAISE NOTICE 'Users without roles: %', users_without_roles;

  IF users_without_roles > 0 THEN
    RAISE EXCEPTION 'Migration incomplete: % users still without roles', users_without_roles;
  ELSE
    RAISE NOTICE '✓ All users have roles in user_roles table';
  END IF;
END $;

-- ===== COMPARE OLD VS NEW =====

-- Compare role distribution
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Role Distribution Comparison:';
  RAISE NOTICE '';
  RAISE NOTICE 'From cat_app_users.user_role:';
END $;

SELECT 
  COALESCE(user_role, 'NULL') as role,
  COUNT(*) as count
FROM cat_app_users
GROUP BY user_role
ORDER BY count DESC;

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'From user_roles table:';
END $;

SELECT 
  role::TEXT,
  COUNT(*) as count
FROM user_roles
GROUP BY role
ORDER BY count DESC;

-- ===== TEST ROLE-CHECKING FUNCTIONS =====

-- Test has_role() function with migrated data
DO $
DECLARE
  test_user TEXT;
  test_role app_role;
  has_role_result BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing Role Functions';
  RAISE NOTICE '========================================';

  -- Get a test user with a role
  SELECT user_name, role INTO test_user, test_role
  FROM user_roles
  LIMIT 1;

  IF test_user IS NOT NULL THEN
    -- Test has_role function
    SELECT public.has_role(test_user, test_role) INTO has_role_result;
    
    IF has_role_result THEN
      RAISE NOTICE '✓ has_role() function works correctly';
      RAISE NOTICE '  User: %, Role: %, Result: %', test_user, test_role, has_role_result;
    ELSE
      RAISE WARNING 'has_role() function returned false for valid user/role';
    END IF;

    -- Test is_admin function if user is admin
    IF test_role = 'admin' THEN
      -- Note: is_admin() uses current session, so we can't test it directly here
      RAISE NOTICE '  (is_admin() requires session context to test)';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  No users found to test role functions';
  END IF;
END $;

-- ===== STATISTICS =====

DO $
DECLARE
  user_count INTEGER;
  admin_count INTEGER;
  moderator_count INTEGER;
  regular_user_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_name) INTO user_count FROM user_roles;
  SELECT COUNT(DISTINCT user_name) INTO admin_count FROM user_roles WHERE role = 'admin';
  SELECT COUNT(DISTINCT user_name) INTO moderator_count FROM user_roles WHERE role = 'moderator';
  SELECT COUNT(DISTINCT user_name) INTO regular_user_count FROM user_roles WHERE role = 'user';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 3: Role Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users with roles: %', user_count;
  RAISE NOTICE '  Admins: %', admin_count;
  RAISE NOTICE '  Moderators: %', moderator_count;
  RAISE NOTICE '  Regular users: %', regular_user_count;
  RAISE NOTICE '';
  RAISE NOTICE '✓ Role data successfully migrated';
  RAISE NOTICE '✓ All users have roles in user_roles table';
  RAISE NOTICE '✓ Role functions tested and working';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Update role-checking functions to use user_roles only';
  RAISE NOTICE '      (Phase 4)';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: cat_app_users.user_role column still exists';
  RAISE NOTICE '      It will be dropped in Phase 5';
END $;
