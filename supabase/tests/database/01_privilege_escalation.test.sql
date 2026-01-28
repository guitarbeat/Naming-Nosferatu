BEGIN;

-- Plan the tests
SELECT plan(3);

-- Setup: Create a regular user 'test_normal' and an admin 'test_admin'
-- We insert directly to bypass the function we are testing and ensure initial state
INSERT INTO public.cat_app_users (user_name) VALUES ('test_normal'), ('test_admin') ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_name, role) VALUES ('test_normal', 'user') ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_name, role) VALUES ('test_admin', 'admin') ON CONFLICT DO NOTHING;

-- 1. Test: Normal user trying to create admin account (Should Fail)
-- Set context to normal user
SELECT set_user_context('test_normal');

SELECT throws_ok(
  $$ SELECT create_user_account('new_admin_attempt', '{}', 'admin') $$,
  'Only admins can create privileged accounts',
  'Normal user cannot create admin account'
);

-- 2. Test: Normal user trying to create normal account (Should Success)
-- Context is still 'test_normal'
SELECT lives_ok(
  $$ SELECT create_user_account('new_normal_user', '{}', 'user') $$,
  'Normal user can create normal account'
);

-- 3. Test: Admin user trying to create admin account (Should Success)
-- Set context to admin user
SELECT set_user_context('test_admin');

SELECT lives_ok(
  $$ SELECT create_user_account('new_admin_success', '{}', 'admin') $$,
  'Admin user can create admin account'
);

-- Clean up
SELECT * FROM finish();
ROLLBACK;
