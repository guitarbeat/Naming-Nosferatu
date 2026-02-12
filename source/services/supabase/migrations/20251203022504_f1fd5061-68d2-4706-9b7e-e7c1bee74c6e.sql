-- Fix the create_user_account function to remove non-existent user_role column
CREATE OR REPLACE FUNCTION public.create_user_account(
  p_user_name text,
  p_preferences jsonb DEFAULT '{"sound_enabled": true, "theme_preference": "dark"}'::jsonb,
  p_user_role text DEFAULT 'user'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new user into the cat_app_users table
  -- This function runs with SECURITY DEFINER to bypass RLS
  INSERT INTO public.cat_app_users (user_name, preferences)
  VALUES (p_user_name, p_preferences)
  ON CONFLICT (user_name) DO UPDATE
    SET preferences = COALESCE(EXCLUDED.preferences, cat_app_users.preferences);
    
  -- If a role is specified and user_roles table exists, add role there
  IF p_user_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_name, role)
    VALUES (p_user_name, p_user_role::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;