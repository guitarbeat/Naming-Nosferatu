-- Security Fix: Secure set_user_context to prevent privilege escalation
--
-- Vulnerability: Previously, any user (including anonymous) could call set_user_context
-- with any username. Since has_role/is_admin checks relied on the session variable
-- set by this function, an attacker could spoof an admin username.
--
-- Fix: We now check if the target username has a privileged role (admin/moderator).
-- If so, we REQUIRE the caller to be authenticated and prove ownership of that username
-- either via user_roles.user_id link or via matching JWT email.

CREATE OR REPLACE FUNCTION set_user_context(user_name_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_uid UUID;
  jwt_email TEXT;
  is_privileged BOOLEAN;
BEGIN
  -- Check if the target user has a privileged role
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_name = user_name_param
      AND role IN ('admin', 'moderator')
  ) INTO is_privileged;

  IF is_privileged THEN
    current_uid := auth.uid();

    -- Must be authenticated
    IF current_uid IS NULL THEN
      RAISE EXCEPTION 'Authentication required for privileged context';
    END IF;

    -- Check 1: Does the user_roles entry explicitly link to this Auth User ID?
    -- (This is the strongest link)
    IF EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_name = user_name_param
          AND user_id = current_uid
    ) THEN
        -- Allowed
        PERFORM set_config('app.user_name', user_name_param, false);
        RETURN;
    END IF;

    -- Check 2: Does the Auth User's email match the user_name_param?
    -- (Common pattern in this app: user_name = email)
    jwt_email := auth.jwt() ->> 'email';

    IF jwt_email = user_name_param THEN
        -- Allowed
        PERFORM set_config('app.user_name', user_name_param, false);
        RETURN;
    END IF;

    -- If neither check passes, deny access
    RAISE EXCEPTION 'Unauthorized: Cannot assume privileged identity';
  END IF;

  -- For non-privileged users, allow setting context (legacy/simple behavior)
  PERFORM set_config('app.user_name', user_name_param, false);
END;
$$;
