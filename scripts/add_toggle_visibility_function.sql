-- Add the toggle_name_visibility function to the database
-- Run this script in your Supabase SQL editor

CREATE OR REPLACE FUNCTION toggle_name_visibility(
  p_name_id UUID,
  p_hide BOOLEAN,
  p_user_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin (case-insensitive)
  SELECT EXISTS (
    SELECT 1 FROM cat_app_users 
    WHERE LOWER(user_name) = LOWER(COALESCE(p_user_name, get_current_user_name()))
    AND user_role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can toggle name visibility';
  END IF;
  
  -- Update the is_hidden flag on cat_name_options
  UPDATE cat_name_options
  SET is_hidden = p_hide
  WHERE id = p_name_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Name not found: %', p_name_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION toggle_name_visibility(UUID, BOOLEAN, TEXT) IS 'Toggle visibility of a name (admin only). Sets is_hidden on cat_name_options.';
