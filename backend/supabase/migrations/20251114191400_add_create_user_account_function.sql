-- Migration: Add create_user_account function
-- This migration creates a security definer function to handle new user account creation,
-- bypassing the RLS policy that prevents new users from creating their own records.

CREATE OR REPLACE FUNCTION public.create_user_account(
  p_user_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a new user into the cat_app_users table
  -- This function runs with the privileges of the user who defined it (the superuser),
  -- allowing it to bypass the RLS policy that prevents new users from creating their own accounts.
  INSERT INTO public.cat_app_users (user_name)
  VALUES (p_user_name)
  ON CONFLICT (user_name) DO NOTHING;
END;
$$;

-- Grant execute permissions on the function to the public role
GRANT EXECUTE ON FUNCTION public.create_user_account(TEXT) TO public;
