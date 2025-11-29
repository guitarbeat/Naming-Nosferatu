-- Migration: Fix RLS Policies and User Roles
-- Date: 2025-11-29
-- Description: Fixes RLS policies for username-based auth and migrates admin roles

-- ===== 1. MIGRATE ADMIN ROLES TO user_roles TABLE =====
-- The user_roles table was empty, causing admin checks to fail

INSERT INTO user_roles (user_name, role)
SELECT user_name, 'admin'::app_role
FROM cat_app_users 
WHERE user_role = 'admin'
ON CONFLICT (user_name, role) DO NOTHING;

-- ===== 2. CREATE TEXT OVERLOAD FOR has_role FUNCTION =====
-- The original function only accepts app_role enum, but clients pass strings

CREATE OR REPLACE FUNCTION public.has_role(_user_name TEXT, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_name = _user_name 
      AND role = _role::app_role
  );
$$;

COMMENT ON FUNCTION public.has_role(TEXT, TEXT) IS 
  'Check if user has specific role (text version for client compatibility)';

GRANT EXECUTE ON FUNCTION public.has_role(TEXT, TEXT) TO authenticated, anon;

-- ===== 3. FIX user_roles RLS POLICIES =====
-- Allow public read access for admin checks

DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

CREATE POLICY "Public can read user roles" ON user_roles
  FOR SELECT
  TO public
  USING (true);

-- ===== 4. FIX tournament_selections RLS POLICIES =====
-- Remove auth.role() checks that don't work with username-based auth

DROP POLICY IF EXISTS "Users can delete their own tournament selections" ON tournament_selections;
DROP POLICY IF EXISTS "Users can insert their own tournament selections" ON tournament_selections;
DROP POLICY IF EXISTS "Users can read their own tournament selections" ON tournament_selections;
DROP POLICY IF EXISTS "Users can update their own tournament selections" ON tournament_selections;

CREATE POLICY "Public can read tournament selections" ON tournament_selections
  FOR SELECT
  TO public
  USING (true);

-- ===== 5. FIX cat_name_options RLS POLICIES =====
-- Separate policies for public and admin access

DROP POLICY IF EXISTS "Public can view names" ON cat_name_options;

CREATE POLICY "Public can view active names" ON cat_name_options
  FOR SELECT
  TO public
  USING (is_hidden IS NOT TRUE OR is_hidden IS NULL);

CREATE POLICY "Admins can view all names" ON cat_name_options
  FOR SELECT
  TO public
  USING (is_admin());

-- ===== 6. FIX cat_name_ratings RLS POLICIES =====
-- Add public read access for leaderboards

CREATE POLICY "Public can read all ratings" ON cat_name_ratings
  FOR SELECT
  TO public
  USING (true);

-- ===== 7. UPDATE is_admin FUNCTION =====
-- Make it more robust for username-based auth

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_name TEXT;
BEGIN
  -- Try to get user name from various sources
  current_user_name := COALESCE(
    current_setting('app.user_name', true),
    current_setting('request.jwt.claims', true)::json->>'user_name',
    NULL
  );
  
  -- If we have a user name, check if they're admin
  IF current_user_name IS NOT NULL THEN
    RETURN public.has_role(current_user_name, 'admin');
  END IF;
  
  RETURN FALSE;
END;
$$;

-- ===== VERIFICATION =====
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: RLS policies and user roles fixed';
  RAISE NOTICE 'Admin users migrated to user_roles table';
  RAISE NOTICE 'has_role() now accepts TEXT parameters';
  RAISE NOTICE 'Public read access enabled for user_roles, tournament_selections, cat_name_ratings';
END $$;
