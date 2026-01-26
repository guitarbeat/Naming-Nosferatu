-- Verification script for create_user_account privilege escalation fix
-- Run this in a transaction to verify behavior without modifying data permanently

BEGIN;

DO $$
DECLARE
  v_exception_raised BOOLEAN := FALSE;
BEGIN
  -- 1. Test: Non-admin trying to create admin account should fail
  -- Mock being a normal user (or anon if allowed, but anon revoked in 20260106)
  -- For this test, we assume we are not admin.

  -- Note: This test requires proper session context setup which mimics the app
  -- Setting 'app.user_name' to a non-existent or non-admin user
  PERFORM set_config('app.user_name', 'not_admin_user', false);

  BEGIN
    PERFORM public.create_user_account('test_admin_hack', '{}'::jsonb, 'admin');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'Only admins can create privileged accounts' THEN
      v_exception_raised := TRUE;
    ELSE
      RAISE NOTICE 'Unexpected error: %', SQLERRM;
    END IF;
  END;

  IF NOT v_exception_raised THEN
    RAISE EXCEPTION 'Security check FAILED: Non-admin was able to create admin account';
  ELSE
    RAISE NOTICE 'Security check PASSED: Non-admin blocked from creating admin account';
  END IF;

  -- 2. Test: Non-admin creating user account should succeed
  v_exception_raised := FALSE;
  BEGIN
    PERFORM public.create_user_account('test_normal_user', '{}'::jsonb, 'user');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Regression: Normal user creation failed: %', SQLERRM;
  END;

  RAISE NOTICE 'Regression check PASSED: Non-admin can create normal user account';

END $$;

ROLLBACK;
