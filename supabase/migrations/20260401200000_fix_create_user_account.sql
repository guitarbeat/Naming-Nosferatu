-- Function: create_user_account
-- SECURITY FIX: Prevent privilege escalation by checking if caller is admin
CREATE OR REPLACE FUNCTION public.create_user_account(
  p_email TEXT,
  p_password TEXT,
  p_role TEXT DEFAULT 'user'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
    -- Prevent privilege escalation by checking if caller is admin
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only administrators can create user accounts.';
    END IF;

    -- Proceed with account creation logic or user record insertion
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
