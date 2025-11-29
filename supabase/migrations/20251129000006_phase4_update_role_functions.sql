-- Migration: Phase 4 - Update Role Functions
-- Part of Supabase Backend Optimization
-- This migration updates all role-checking functions to use user_roles table only

-- ===== BACKUP REMINDER =====
-- Before running: ./scripts/create_backup.sh phase4_functions

-- ===== UPDATE ROLE FUNCTIONS =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 4: Updating Role Functions';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $;

-- 1. Update has_role() function
-- Now uses ONLY user_roles table (not cat_app_users.user_role)
CREATE OR REPLACE FUNCTION public.has_role(_user_name TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_name = _user_name 
      AND role = _role
  );
$;

COMMENT ON FUNCTION public.has_role(TEXT, app_role) IS 
  'Check if user has specific role (uses user_roles table only)';

RAISE NOTICE '✓ Updated has_role() function';

-- 2. Update get_user_role() function
-- Returns highest role from user_roles table
CREATE OR REPLACE FUNCTION public.get_user_role(_user_name TEXT)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $
  SELECT role
  FROM user_roles
  WHERE user_name = _user_name
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1;
$;

COMMENT ON FUNCTION public.get_user_role(TEXT) IS 
  'Get user''s highest role from user_roles table';

RAISE NOTICE '✓ Updated get_user_role() function';

-- 3. Update is_admin() function
-- Uses user_roles table and current session context
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_name = current_setting('request.jwt.claims', true)::json->>'user_name'
      AND role = 'admin'
  );
$;

COMMENT ON FUNCTION public.is_admin() IS 
  'Check if current user is admin (uses user_roles table)';

RAISE NOTICE '✓ Updated is_admin() function';

-- 4. Create is_moderator() function (if not exists)
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_name = current_setting('request.jwt.claims', true)::json->>'user_name'
      AND role IN ('admin', 'moderator')
  );
$;

COMMENT ON FUNCTION public.is_moderator() IS 
  'Check if current user is moderator or admin (uses user_roles table)';

RAISE NOTICE '✓ Created is_moderator() function';

-- 5. Update get_current_user_role() function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $
  SELECT role
  FROM user_roles
  WHERE user_name = current_setting('request.jwt.claims', true)::json->>'user_name'
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1;
$;

COMMENT ON FUNCTION public.get_current_user_role() IS 
  'Get current user''s highest role from user_roles table';

RAISE NOTICE '✓ Updated get_current_user_role() function';

-- 6. Create helper function: has_any_role()
CREATE OR REPLACE FUNCTION public.has_any_role(_user_name TEXT, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_name = _user_name 
      AND role = ANY(_roles)
  );
$;

COMMENT ON FUNCTION public.has_any_role(TEXT, app_role[]) IS 
  'Check if user has any of the specified roles';

RAISE NOTICE '✓ Created has_any_role() function';

-- ===== DEPRECATE OLD FUNCTIONS =====

-- Mark old check_user_role functions as deprecated
DO $
BEGIN
  -- Check if old function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'check_user_role_by_name'
  ) THEN
    COMMENT ON FUNCTION public.check_user_role_by_name(TEXT, TEXT) IS 
      'DEPRECATED: Use has_role() instead. This function checks both old and new role sources.';
    RAISE NOTICE '⚠️  Marked check_user_role_by_name() as deprecated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'check_user_role'
  ) THEN
    COMMENT ON FUNCTION public.check_user_role(TEXT, TEXT) IS 
      'DEPRECATED: Use has_role() instead. This function checks both old and new role sources.';
    RAISE NOTICE '⚠️  Marked check_user_role() as deprecated';
  END IF;
END $;

-- ===== GRANT PERMISSIONS =====

GRANT EXECUTE ON FUNCTION public.has_role(TEXT, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_moderator() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(TEXT, app_role[]) TO authenticated, anon;

RAISE NOTICE '✓ Granted permissions on role functions';

-- ===== TEST FUNCTIONS =====

DO $
DECLARE
  test_user TEXT;
  test_role app_role;
  test_result BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing Role Functions';
  RAISE NOTICE '========================================';

  -- Get a test user
  SELECT user_name, role INTO test_user, test_role
  FROM user_roles
  LIMIT 1;

  IF test_user IS NOT NULL THEN
    -- Test has_role()
    SELECT public.has_role(test_user, test_role) INTO test_result;
    IF test_result THEN
      RAISE NOTICE '✓ has_role() works: user=%, role=%, result=%', test_user, test_role, test_result;
    ELSE
      RAISE WARNING '❌ has_role() failed for valid user/role';
    END IF;

    -- Test get_user_role()
    SELECT public.get_user_role(test_user) INTO test_role;
    IF test_role IS NOT NULL THEN
      RAISE NOTICE '✓ get_user_role() works: user=%, role=%', test_user, test_role;
    ELSE
      RAISE WARNING '❌ get_user_role() returned NULL';
    END IF;

    -- Test has_any_role()
    SELECT public.has_any_role(test_user, ARRAY['user', 'admin']::app_role[]) INTO test_result;
    IF test_result THEN
      RAISE NOTICE '✓ has_any_role() works: user=%, result=%', test_user, test_result;
    ELSE
      RAISE WARNING '❌ has_any_role() failed';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '✓ All role functions tested successfully';
  ELSE
    RAISE NOTICE '⚠️  No users found to test functions';
  END IF;
END $;

-- ===== VERIFY FUNCTIONS =====

DO $
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'has_role',
      'get_user_role',
      'is_admin',
      'is_moderator',
      'get_current_user_role',
      'has_any_role'
    );

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Function Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Updated/created % role functions', function_count;

  IF function_count >= 6 THEN
    RAISE NOTICE '✓ All role functions present';
  ELSE
    RAISE WARNING '⚠️  Some functions may be missing';
  END IF;
END $;

-- ===== STATISTICS =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 4: Role Functions Updated';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Updated functions:';
  RAISE NOTICE '  ✓ has_role(user_name, role)';
  RAISE NOTICE '  ✓ get_user_role(user_name)';
  RAISE NOTICE '  ✓ is_admin()';
  RAISE NOTICE '  ✓ is_moderator()';
  RAISE NOTICE '  ✓ get_current_user_role()';
  RAISE NOTICE '  ✓ has_any_role(user_name, roles[])';
  RAISE NOTICE '';
  RAISE NOTICE 'All functions now use user_roles table only';
  RAISE NOTICE 'Old cat_app_users.user_role column is no longer used';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Update RLS policies (Phase 4.2)';
END $;
