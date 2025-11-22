-- Migration: Fix RLS policies on cat_app_users for proper user isolation
-- This ensures users can only access their own data

-- 1. Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anonymous users can view own data" ON cat_app_users;
DROP POLICY IF EXISTS "Anonymous users can insert own data" ON cat_app_users;
DROP POLICY IF EXISTS "Users can view own data" ON cat_app_users;
DROP POLICY IF EXISTS "Users can insert own data" ON cat_app_users;
DROP POLICY IF EXISTS "Users can update own data" ON cat_app_users;
DROP POLICY IF EXISTS "Users can delete own data" ON cat_app_users;

-- 2. Create function to get current user name from session
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

-- 3. Create secure RLS policies - users can only access their own data
CREATE POLICY "Users can view own data" ON cat_app_users
  FOR SELECT 
  USING (user_name = public.get_current_user_name());

CREATE POLICY "Users can insert own data" ON cat_app_users
  FOR INSERT 
  WITH CHECK (user_name = public.get_current_user_name());

CREATE POLICY "Users can update own data" ON cat_app_users
  FOR UPDATE 
  USING (user_name = public.get_current_user_name())
  WITH CHECK (user_name = public.get_current_user_name());

CREATE POLICY "Users can delete own data" ON cat_app_users
  FOR DELETE 
  USING (user_name = public.get_current_user_name());

-- 4. Admins can view all users (read-only for admin panel)
CREATE POLICY "Admins can view all users" ON cat_app_users
  FOR SELECT
  USING (public.has_role(public.get_current_user_name(), 'admin'));

-- 5. Prevent users from modifying their own roles
-- The user_role column should become read-only via trigger
CREATE OR REPLACE FUNCTION public.prevent_role_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to modify roles
  IF NOT public.has_role(public.get_current_user_name(), 'admin') THEN
    IF TG_OP = 'UPDATE' AND OLD.user_role IS DISTINCT FROM NEW.user_role THEN
      RAISE EXCEPTION 'Only admins can modify user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Create trigger to prevent role modification
DROP TRIGGER IF EXISTS prevent_role_modification_trigger ON cat_app_users;
CREATE TRIGGER prevent_role_modification_trigger
  BEFORE UPDATE ON cat_app_users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_modification();

-- 7. Grant permissions
GRANT SELECT ON cat_app_users TO authenticated, anon;
GRANT INSERT ON cat_app_users TO authenticated, anon;
GRANT UPDATE ON cat_app_users TO authenticated, anon;
GRANT DELETE ON cat_app_users TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_name() TO authenticated, anon;

-- 8. Add comments
COMMENT ON FUNCTION public.get_current_user_name() IS 'Gets current authenticated user name from session';
COMMENT ON FUNCTION public.prevent_role_modification() IS 'Prevents non-admin users from modifying their own roles';
