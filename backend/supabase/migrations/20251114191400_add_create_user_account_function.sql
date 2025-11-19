-- Migration: Add create_user_account function
-- This migration creates a security definer function to handle new user account creation,
-- bypassing the RLS policy that prevents new users from creating their own records.

CREATE OR REPLACE FUNCTION public.create_user_account(
  p_user_name TEXT,
  p_preferences JSONB DEFAULT '{"sound_enabled": true, "theme_preference": "dark"}'::jsonb,
  p_user_role TEXT DEFAULT 'user'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new user into the cat_app_users table
  -- This function runs with the privileges of the user who defined it (the superuser),
  -- allowing it to bypass the RLS policy that prevents new users from creating their own accounts.
  INSERT INTO public.cat_app_users (user_name, preferences, user_role)
  VALUES (p_user_name, p_preferences, p_user_role)
  ON CONFLICT (user_name) DO UPDATE
    SET 
      preferences = COALESCE(EXCLUDED.preferences, cat_app_users.preferences),
      user_role = COALESCE(EXCLUDED.user_role, cat_app_users.user_role);
END;
$$;

-- Grant execute permissions on the function to the public role
GRANT EXECUTE ON FUNCTION public.create_user_account(TEXT, JSONB, TEXT) TO public;
