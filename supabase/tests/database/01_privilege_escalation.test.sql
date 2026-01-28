BEGIN;
SELECT plan(4);

-- 1. Create a regular user (should succeed)
-- This runs as the superuser or whatever role runs the test, which typically bypasses RLS but create_user_account checks logic
SELECT lives_ok(
  $$ SELECT create_user_account('test_normal', '{}', 'user') $$,
  'Regular user creation should succeed'
);

-- 2. Verify 'test_normal' exists
SELECT ok(
  EXISTS(SELECT 1 FROM cat_app_users WHERE user_name = 'test_normal'),
  'test_normal should exist'
);

-- 3. Switch context to 'test_normal' and try to create an admin (should fail)
-- We use set_user_context to simulate the session variable that is_admin() checks
SELECT set_user_context('test_normal');

SELECT throws_ok(
  $$ SELECT create_user_account('test_hacker', '{}', 'admin') $$,
  'Only admins can create privileged accounts',
  'Non-admin user creating admin should fail'
);

-- 4. Try to create a moderator (should fail)
SELECT throws_ok(
  $$ SELECT create_user_account('test_mod', '{}', 'moderator') $$,
  'Only admins can create privileged accounts',
  'Non-admin user creating moderator should fail'
);

SELECT * FROM finish();
ROLLBACK;
