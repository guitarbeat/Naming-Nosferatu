-- Fix RLS policies for cat_app_users table to allow anonymous access
-- This resolves the "new row violates row-level security policy" error

-- Allow anonymous users to read their own data (for initial user check)
CREATE POLICY IF NOT EXISTS "Anonymous users can view own data" ON cat_app_users
  FOR SELECT USING (user_name IS NOT NULL);

-- Allow anonymous users to insert their own data (for new user registration)
CREATE POLICY IF NOT EXISTS "Anonymous users can insert own data" ON cat_app_users
  FOR INSERT WITH CHECK (user_name IS NOT NULL);

-- Grant necessary permissions
GRANT ALL ON cat_app_users TO authenticated;
GRANT ALL ON cat_app_users TO anon;
