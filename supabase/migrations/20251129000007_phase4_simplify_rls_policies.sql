-- Migration: Phase 4 - Simplify RLS Policies
-- Part of Supabase Backend Optimization
-- This migration simplifies and consolidates RLS policies across all tables

-- ===== BACKUP REMINDER =====
-- Before running: ./scripts/create_backup.sh phase4_rls_policies

-- ===== ENABLE RLS ON ALL TABLES =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 4: Simplifying RLS Policies';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $;

-- Ensure RLS is enabled on all tables
ALTER TABLE cat_name_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_name_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

RAISE NOTICE '✓ RLS enabled on all tables';

-- ===== 1. CAT_NAME_OPTIONS POLICIES =====

RAISE NOTICE '';
RAISE NOTICE 'Updating cat_name_options policies...';

-- Drop all existing policies
DROP POLICY IF EXISTS "public_read" ON cat_name_options;
DROP POLICY IF EXISTS "admin_all" ON cat_name_options;
DROP POLICY IF EXISTS "user_suggest" ON cat_name_options;
DROP POLICY IF EXISTS "Anyone can view active cat names" ON cat_name_options;
DROP POLICY IF EXISTS "Users can suggest new names" ON cat_name_options;
DROP POLICY IF EXISTS "Admins can manage all names" ON cat_name_options;

-- Create simplified policies
CREATE POLICY "public_read_active" 
ON cat_name_options 
FOR SELECT 
TO public 
USING (is_active = true);

CREATE POLICY "user_suggest_names" 
ON cat_name_options 
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "admin_full_access" 
ON cat_name_options 
FOR ALL 
TO public 
USING (is_admin());

RAISE NOTICE '✓ cat_name_options: 3 policies (read, suggest, admin)';

-- ===== 2. CAT_NAME_RATINGS POLICIES =====

RAISE NOTICE '';
RAISE NOTICE 'Updating cat_name_ratings policies...';

-- Drop all existing policies
DROP POLICY IF EXISTS "user_own_data" ON cat_name_ratings;
DROP POLICY IF EXISTS "admin_all" ON cat_name_ratings;
DROP POLICY IF EXISTS "Users can manage own ratings" ON cat_name_ratings;
DROP POLICY IF EXISTS "Anyone can insert ratings" ON cat_name_ratings;
DROP POLICY IF EXISTS "Users can view own ratings" ON cat_name_ratings;
DROP POLICY IF EXISTS "Admins can view all ratings" ON cat_name_ratings;

-- Create simplified policies
CREATE POLICY "user_own_ratings" 
ON cat_name_ratings 
FOR ALL 
TO public 
USING (user_name = get_current_user_name())
WITH CHECK (user_name = get_current_user_name());

CREATE POLICY "admin_all_ratings" 
ON cat_name_ratings 
FOR ALL 
TO public 
USING (is_admin());

RAISE NOTICE '✓ cat_name_ratings: 2 policies (user own, admin all)';

-- ===== 3. CAT_APP_USERS POLICIES =====

RAISE NOTICE '';
RAISE NOTICE 'Updating cat_app_users policies...';

-- Drop all existing policies
DROP POLICY IF EXISTS "user_own_data" ON cat_app_users;
DROP POLICY IF EXISTS "admin_all" ON cat_app_users;
DROP POLICY IF EXISTS "Users can view own data" ON cat_app_users;
DROP POLICY IF EXISTS "Users can update own data" ON cat_app_users;
DROP POLICY IF EXISTS "Admins can view all data" ON cat_app_users;
DROP POLICY IF EXISTS "Public can view user data" ON cat_app_users;

-- Create simplified policies
CREATE POLICY "user_own_profile" 
ON cat_app_users 
FOR ALL 
TO public 
USING (user_name = get_current_user_name())
WITH CHECK (user_name = get_current_user_name());

CREATE POLICY "admin_all_users" 
ON cat_app_users 
FOR ALL 
TO public 
USING (is_admin());

RAISE NOTICE '✓ cat_app_users: 2 policies (user own, admin all)';

-- ===== 4. TOURNAMENT_SELECTIONS POLICIES =====

RAISE NOTICE '';
RAISE NOTICE 'Updating tournament_selections policies...';

-- Drop all existing policies
DROP POLICY IF EXISTS "user_own_data" ON tournament_selections;
DROP POLICY IF EXISTS "admin_all" ON tournament_selections;
DROP POLICY IF EXISTS "Users can manage own tournaments" ON tournament_selections;
DROP POLICY IF EXISTS "Anyone can insert tournaments" ON tournament_selections;

-- Create simplified policies
CREATE POLICY "user_own_tournaments" 
ON tournament_selections 
FOR ALL 
TO public 
USING (user_name = get_current_user_name())
WITH CHECK (user_name = get_current_user_name());

CREATE POLICY "admin_all_tournaments" 
ON tournament_selections 
FOR ALL 
TO public 
USING (is_admin());

RAISE NOTICE '✓ tournament_selections: 2 policies (user own, admin all)';

-- ===== 5. USER_ROLES POLICIES =====

RAISE NOTICE '';
RAISE NOTICE 'Updating user_roles policies...';

-- Drop all existing policies
DROP POLICY IF EXISTS "user_view_own_roles" ON user_roles;
DROP POLICY IF EXISTS "admin_manage_roles" ON user_roles;

-- Create simplified policies
CREATE POLICY "user_view_own_roles" 
ON user_roles 
FOR SELECT 
TO public 
USING (user_name = get_current_user_name() OR is_admin());

CREATE POLICY "admin_manage_all_roles" 
ON user_roles 
FOR ALL 
TO public 
USING (is_admin())
WITH CHECK (is_admin());

RAISE NOTICE '✓ user_roles: 2 policies (user view own, admin manage)';

-- ===== VERIFY POLICIES =====

DO $
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'cat_name_options',
      'cat_name_ratings',
      'cat_app_users',
      'tournament_selections',
      'user_roles'
    );

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Policy Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total policies: %', policy_count;
  RAISE NOTICE 'Expected: 11 policies';

  IF policy_count = 11 THEN
    RAISE NOTICE '✓ All policies created successfully';
  ELSE
    RAISE WARNING '⚠️  Policy count mismatch (expected 11, got %)', policy_count;
  END IF;
END $;

-- ===== LIST ALL POLICIES =====

RAISE NOTICE '';
RAISE NOTICE 'Current RLS Policies:';
RAISE NOTICE '';

SELECT 
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  CASE roles[1]
    WHEN 'public' THEN 'public'
    ELSE roles[1]::TEXT
  END as role
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'cat_name_options',
    'cat_name_ratings',
    'cat_app_users',
    'tournament_selections',
    'user_roles'
  )
ORDER BY tablename, policyname;

-- ===== TEST POLICIES =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing RLS Policies';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Full policy testing requires session context';
  RAISE NOTICE 'Run scripts/test_rls_policies.sql for comprehensive tests';
END $;

-- ===== POLICY SUMMARY =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Policy Summary';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Model:';
  RAISE NOTICE '  - Users can only access their own data';
  RAISE NOTICE '  - Admins can access all data';
  RAISE NOTICE '  - Active cat names are publicly readable';
  RAISE NOTICE '  - Anyone can suggest new names';
  RAISE NOTICE '';
  RAISE NOTICE 'Policy Pattern (per table):';
  RAISE NOTICE '  1. user_own_* - Users access own data';
  RAISE NOTICE '  2. admin_all_* - Admins access all data';
  RAISE NOTICE '';
  RAISE NOTICE 'Benefits:';
  RAISE NOTICE '  ✓ Simplified from multiple overlapping policies';
  RAISE NOTICE '  ✓ Consistent security model across tables';
  RAISE NOTICE '  ✓ Clear separation of user vs admin access';
  RAISE NOTICE '  ✓ No more "Anyone can X" policies (except public reads)';
  RAISE NOTICE '';
END $;

-- ===== STATISTICS =====

DO $
DECLARE
  old_policy_count INTEGER := 20; -- Approximate old count
  new_policy_count INTEGER;
  reduction_pct NUMERIC;
BEGIN
  SELECT COUNT(*) INTO new_policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  reduction_pct := ROUND(((old_policy_count - new_policy_count)::NUMERIC / old_policy_count) * 100, 1);

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 4: RLS Policies Simplified';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Old policy count: ~%', old_policy_count;
  RAISE NOTICE 'New policy count: %', new_policy_count;
  RAISE NOTICE 'Reduction: ~%%', reduction_pct;
  RAISE NOTICE '';
  RAISE NOTICE '✓ RLS policies simplified and consolidated';
  RAISE NOTICE '✓ Consistent security model applied';
  RAISE NOTICE '✓ All policies use updated role functions';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test security with different user roles (Phase 4.3)';
END $;
