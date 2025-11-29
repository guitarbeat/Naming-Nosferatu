-- Migration: Add increment_selection RPC function
-- This function is a no-op placeholder since selection tracking is now handled
-- via tournament_data in cat_app_users table. Keeping this to avoid breaking
-- existing code that calls it.

CREATE OR REPLACE FUNCTION increment_selection(
  p_user_name TEXT,
  p_name_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- No-op: Selection tracking is now handled via tournament_data in cat_app_users
  -- This function exists only to prevent RPC errors in legacy code
  NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_selection(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_selection(TEXT, UUID) TO anon;

-- Add comment
COMMENT ON FUNCTION increment_selection IS 
  'Legacy no-op function. Selection tracking is now handled via tournament_data in cat_app_users.';
