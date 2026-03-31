-- Migration: Fix is_admin() to use auth.uid() exclusively
-- Removes the insecure app.user_name session-variable path that allowed
-- any caller to escalate privileges via set_user_context().
-- Uses cat_user_roles (the live table name, as reflected in generated types).

-- ============================================================================
-- FIX is_admin(): auth.uid() primary, JWT user_metadata fallback (both secure)
-- The old path: current_setting('app.user_name') was client-settable → removed.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Primary: check user_id = auth.uid() (linked after first login via link_auth_uid)
  IF EXISTS (
    SELECT 1 FROM public.cat_user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Secondary: user_name from JWT user_metadata (signed by Supabase — not client-settable)
  RETURN EXISTS (
    SELECT 1 FROM public.cat_user_roles
    WHERE user_name = (auth.jwt() -> 'user_metadata' ->> 'user_name')
      AND role = 'admin'
      AND (auth.jwt() -> 'user_metadata' ->> 'user_name') IS NOT NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- ============================================================================
-- FIX get_current_user_name(): JWT-based, no session variable
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_current_user_name()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'user_name',
    split_part(auth.email(), '@', 1)
  )
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_name() TO authenticated, anon;

-- ============================================================================
-- ADD link_auth_uid(): called once after admin login to persist user_id
-- Finds the cat_user_roles row matching the caller's JWT user_name and sets user_id.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.link_auth_uid()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to link auth UID';
  END IF;

  v_user_name := COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'user_name',
    split_part(auth.email(), '@', 1)
  );

  IF v_user_name IS NOT NULL AND v_user_name != '' THEN
    UPDATE public.cat_user_roles
    SET user_id = auth.uid()
    WHERE user_name = v_user_name
      AND user_id IS NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_auth_uid() TO authenticated;
