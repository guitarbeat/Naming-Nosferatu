-- Fix privilege escalation vulnerability in create_user_account function
-- Add admin check before allowing privileged role assignment

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
  -- Insert or update user in cat_app_users table
  INSERT INTO public.cat_app_users (user_name, preferences)
  VALUES (p_user_name, p_preferences)
  ON CONFLICT (user_name) DO UPDATE
    SET preferences = COALESCE(EXCLUDED.preferences, cat_app_users.preferences);
    
  -- Only allow admin role assignment if caller is already an admin
  IF p_user_role IS NOT NULL THEN
    -- SECURITY FIX: Prevent privilege escalation by checking if caller is admin (Verified)
    IF p_user_role != 'user' AND NOT is_admin() THEN
      RAISE EXCEPTION 'Only admins can create privileged accounts';
    END IF;
    
    INSERT INTO public.user_roles (user_name, role)
    VALUES (p_user_name, p_user_role::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
