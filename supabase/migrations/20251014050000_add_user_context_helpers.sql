-- Migration: Add helper functions for user context management
-- This helps maintain user session context for RLS policies

-- 1. Create function to set user context
CREATE OR REPLACE FUNCTION public.set_user_context(user_name_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Store user name in session for RLS policies to use
  PERFORM set_config('app.user_name', user_name_param, false);
END;
$$;

-- 2. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.set_user_context(TEXT) TO authenticated, anon;

-- 3. Add comment
COMMENT ON FUNCTION public.set_user_context(TEXT) IS 'Sets the current user context for RLS policy evaluation';
