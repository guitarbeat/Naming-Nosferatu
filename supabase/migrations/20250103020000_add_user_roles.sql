-- Migration: Add role-based authentication to cat_app_users table
-- This migration adds a role column and sets up proper role-based permissions

-- Add role column with default value 'user'
ALTER TABLE cat_app_users 
ADD COLUMN IF NOT EXISTS user_role VARCHAR(20) DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'moderator'));

-- Add comment to document the column purpose
COMMENT ON COLUMN cat_app_users.user_role IS 'User role for role-based access control: user, admin, or moderator';

-- Create index on user_role for better query performance
CREATE INDEX IF NOT EXISTS idx_cat_app_users_user_role ON cat_app_users (user_role);

-- Update existing admin users (Aaron) to have admin role
UPDATE cat_app_users 
SET user_role = 'admin' 
WHERE LOWER(user_name) = 'aaron';

-- Create a function to check user roles
CREATE OR REPLACE FUNCTION check_user_role(user_name_param TEXT, required_role TEXT)
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_user_role(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_role(TEXT, TEXT) TO anon;