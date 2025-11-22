-- Migration: Fix login 409 error and add role support
-- This migration adds SELECT policy, user_role column, and sets Aaron as admin

-- 1. Add SELECT policy to allow anonymous users to read cat_app_users
CREATE POLICY "Public can view user data" ON cat_app_users
  FOR SELECT TO public
  USING (true);

-- 2. Add user_role column back to cat_app_users (simpler for username-based auth)
ALTER TABLE cat_app_users 
ADD COLUMN IF NOT EXISTS user_role VARCHAR(20) DEFAULT 'user' 
CHECK (user_role IN ('user', 'admin', 'moderator'));

-- 3. Add comment to document the column purpose
COMMENT ON COLUMN cat_app_users.user_role IS 'User role for role-based access control: user, admin, or moderator';

-- 4. Create index on user_role for better query performance
CREATE INDEX IF NOT EXISTS idx_cat_app_users_user_role 
ON cat_app_users (user_role);

-- 5. Set Aaron as admin (case-insensitive)
UPDATE cat_app_users 
SET user_role = 'admin' 
WHERE LOWER(user_name) = 'aaron';

-- 6. Create a function to check user roles by username (for username-based auth)
CREATE OR REPLACE FUNCTION check_user_role_by_name(user_name_param TEXT, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user exists and has the required role or higher
  RETURN EXISTS (
    SELECT 1 
    FROM cat_app_users 
    WHERE LOWER(user_name) = LOWER(user_name_param) 
    AND (
      user_role = required_role OR
      (required_role = 'user' AND user_role IN ('moderator', 'admin')) OR
      (required_role = 'moderator' AND user_role = 'admin')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_user_role_by_name(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_role_by_name(TEXT, TEXT) TO anon;

-- 8. Add comment for documentation
COMMENT ON FUNCTION check_user_role_by_name(TEXT, TEXT) IS 'Check if user has required role by username (for username-based auth)';
