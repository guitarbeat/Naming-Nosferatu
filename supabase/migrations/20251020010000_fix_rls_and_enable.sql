-- Migration: Fix RLS and Enable Data Visibility
-- This migration enables RLS on all tables and creates proper policies for username-based auth
-- Design: Public can read all data, users can only edit their own data, admins can edit everything

-- ===== 1. CREATE HELPER FUNCTIONS =====

-- Function to get current user name from session context
CREATE OR REPLACE FUNCTION public.get_current_user_name()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    current_setting('app.user_name', true),
    current_setting('request.jwt.claims', true)::json->>'user_name'
  )
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM cat_app_users 
    WHERE user_name = public.get_current_user_name() 
    AND user_role = 'admin'
  )
$$;

-- Function to check if current user has specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM cat_app_users 
    WHERE user_name = public.get_current_user_name() 
    AND (
      user_role = required_role OR
      (required_role = 'user' AND user_role IN ('moderator', 'admin')) OR
      (required_role = 'moderator' AND user_role = 'admin')
    )
  )
$$;

-- ===== 2. CLEAN UP EXISTING POLICIES =====

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can view all data" ON cat_app_users;
DROP POLICY IF EXISTS "Public can view user data" ON cat_app_users;
DROP POLICY IF EXISTS "Users can insert their own data" ON cat_app_users;
DROP POLICY IF EXISTS "Users can update own data" ON cat_app_users;
DROP POLICY IF EXISTS "Users can update their own data" ON cat_app_users;
DROP POLICY IF EXISTS "Users can view own data" ON cat_app_users;
DROP POLICY IF EXISTS "Users can delete own data" ON cat_app_users;

DROP POLICY IF EXISTS "Admin insert cat_name_options" ON cat_name_options;
DROP POLICY IF EXISTS "Admin update cat_name_options" ON cat_name_options;
DROP POLICY IF EXISTS "Public read cat_name_options" ON cat_name_options;

DROP POLICY IF EXISTS "Anyone can insert ratings (prototype)" ON cat_name_ratings;
DROP POLICY IF EXISTS "Anyone can update ratings (prototype)" ON cat_name_ratings;
DROP POLICY IF EXISTS "Public can read all ratings" ON cat_name_ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON cat_name_ratings;
DROP POLICY IF EXISTS "Users can read all ratings" ON cat_name_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON cat_name_ratings;

DROP POLICY IF EXISTS "Anyone can delete selections (prototype)" ON tournament_selections;
DROP POLICY IF EXISTS "Anyone can insert selections (prototype)" ON tournament_selections;
DROP POLICY IF EXISTS "Anyone can update selections (prototype)" ON tournament_selections;
DROP POLICY IF EXISTS "Public can read selections" ON tournament_selections;

-- ===== 3. CREATE PROPER RLS POLICIES =====

-- CAT_APP_USERS policies
-- Public can read all users (for leaderboards, admin panels, etc.)
CREATE POLICY "Public can read all users" ON cat_app_users
  FOR SELECT 
  TO public
  USING (true);

-- Users can insert their own data
CREATE POLICY "Users can insert own data" ON cat_app_users
  FOR INSERT 
  TO public
  WITH CHECK (user_name = public.get_current_user_name());

-- Users can update their own data
CREATE POLICY "Users can update own data" ON cat_app_users
  FOR UPDATE 
  TO public
  USING (user_name = public.get_current_user_name())
  WITH CHECK (user_name = public.get_current_user_name());

-- Users can delete their own data
CREATE POLICY "Users can delete own data" ON cat_app_users
  FOR DELETE 
  TO public
  USING (user_name = public.get_current_user_name());

-- Admins can do everything
CREATE POLICY "Admins can manage all users" ON cat_app_users
  FOR ALL
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- CAT_NAME_OPTIONS policies
-- Public can read all names (for tournament setup, browsing, etc.)
CREATE POLICY "Public can read all names" ON cat_name_options
  FOR SELECT 
  TO public
  USING (true);

-- Only admins can insert/update/delete names
CREATE POLICY "Admins can manage names" ON cat_name_options
  FOR ALL
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- CAT_NAME_RATINGS policies
-- Public can read all ratings (for leaderboards, statistics, etc.)
CREATE POLICY "Public can read all ratings" ON cat_name_ratings
  FOR SELECT 
  TO public
  USING (true);

-- Users can insert their own ratings
CREATE POLICY "Users can insert own ratings" ON cat_name_ratings
  FOR INSERT 
  TO public
  WITH CHECK (user_name = public.get_current_user_name());

-- Users can update their own ratings
CREATE POLICY "Users can update own ratings" ON cat_name_ratings
  FOR UPDATE 
  TO public
  USING (user_name = public.get_current_user_name())
  WITH CHECK (user_name = public.get_current_user_name());

-- Users can delete their own ratings
CREATE POLICY "Users can delete own ratings" ON cat_name_ratings
  FOR DELETE 
  TO public
  USING (user_name = public.get_current_user_name());

-- Admins can manage all ratings
CREATE POLICY "Admins can manage all ratings" ON cat_name_ratings
  FOR ALL
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- TOURNAMENT_SELECTIONS policies
-- Public can read all selections (for analytics, popular names, etc.)
CREATE POLICY "Public can read all selections" ON tournament_selections
  FOR SELECT 
  TO public
  USING (true);

-- Users can insert their own selections
CREATE POLICY "Users can insert own selections" ON tournament_selections
  FOR INSERT 
  TO public
  WITH CHECK (user_name = public.get_current_user_name());

-- Users can update their own selections
CREATE POLICY "Users can update own selections" ON tournament_selections
  FOR UPDATE 
  TO public
  USING (user_name = public.get_current_user_name())
  WITH CHECK (user_name = public.get_current_user_name());

-- Users can delete their own selections
CREATE POLICY "Users can delete own selections" ON tournament_selections
  FOR DELETE 
  TO public
  USING (user_name = public.get_current_user_name());

-- Admins can manage all selections
CREATE POLICY "Admins can manage all selections" ON tournament_selections
  FOR ALL
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ===== 4. ENABLE ROW LEVEL SECURITY =====

-- Enable RLS on all tables
ALTER TABLE cat_app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_name_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_name_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_selections ENABLE ROW LEVEL SECURITY;

-- ===== 5. GRANT NECESSARY PERMISSIONS =====

-- Ensure public role has necessary permissions
GRANT SELECT ON cat_app_users TO public;
GRANT INSERT, UPDATE, DELETE ON cat_app_users TO public;

GRANT SELECT ON cat_name_options TO public;
GRANT INSERT, UPDATE, DELETE ON cat_name_options TO public;

GRANT SELECT ON cat_name_ratings TO public;
GRANT INSERT, UPDATE, DELETE ON cat_name_ratings TO public;

GRANT SELECT ON tournament_selections TO public;
GRANT INSERT, UPDATE, DELETE ON tournament_selections TO public;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_current_user_name() TO public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO public;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO public;

-- ===== 6. VERIFICATION QUERIES =====

-- These queries will be run to verify the migration worked
-- (Commented out to avoid execution during migration)

/*
-- Test that all users are visible
SELECT COUNT(*) as total_users FROM cat_app_users;

-- Test that all names are visible  
SELECT COUNT(*) as total_names FROM cat_name_options;

-- Test that all ratings are visible
SELECT COUNT(*) as total_ratings FROM cat_name_ratings;

-- Test that all selections are visible
SELECT COUNT(*) as total_selections FROM tournament_selections;

-- Test RLS is enabled
SELECT tablename, rowsecurity as rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('cat_app_users', 'cat_name_options', 'cat_name_ratings', 'tournament_selections');
*/
