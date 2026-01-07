-- Migration: Ensure user_role column exists in cat_app_users
-- This fixes the "column cat_app_users.user_role does not exist" error

-- 1. Add user_role column if it doesn't exist
ALTER TABLE cat_app_users 
ADD COLUMN IF NOT EXISTS user_role VARCHAR(20) DEFAULT 'user';

-- 2. Add check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_user_role_values'
  ) THEN
    ALTER TABLE cat_app_users 
    ADD CONSTRAINT check_user_role_values 
    CHECK (user_role IN ('user', 'admin', 'moderator'));
  END IF;
END $$;

-- 3. Create or replace index on user_role for performance
CREATE INDEX IF NOT EXISTS idx_cat_app_users_user_role 
ON cat_app_users (user_role);

-- 4. Set Aaron as admin (case-insensitive)
UPDATE cat_app_users 
SET user_role = 'admin' 
WHERE LOWER(user_name) = 'aaron';

-- 5. Add comment to document the column
COMMENT ON COLUMN cat_app_users.user_role IS 'User role for role-based access control: user, admin, or moderator';
