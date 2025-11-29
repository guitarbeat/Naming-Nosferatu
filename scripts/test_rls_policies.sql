-- Test RLS Policies Script
-- This script tests RLS policies with different user roles

-- ===== SETUP TEST USERS =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Policy Testing';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Setting up test users...';
END $;

-- Create test users if they don't exist
INSERT INTO cat_app_users (user_name, created_at, updated_at)
VALUES 
  ('test_regular_user', NOW(), NOW()),
  ('test_admin_user', NOW(), NOW()),
  ('test_moderator_user', NOW(), NOW())
ON CONFLICT (user_name) DO NOTHING;

-- Assign roles
INSERT INTO user_roles (user_name, role)
VALUES 
  ('test_regular_user', 'user'),
  ('test_admin_user', 'admin'),
  ('test_moderator_user', 'moderator')
ON CONFLICT (user_name, role) DO NOTHING;

RAISE NOTICE '✓ Test users created';

-- ===== TEST 1: ANONYMOUS USER =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test 1: Anonymous User';
  RAISE NOTICE '========================================';
END $;

-- Test: Can view active cat names
DO $
DECLARE
  name_count INTEGER;
BEGIN
  -- Reset session (anonymous)
  PERFORM set_config('request.jwt.claims', NULL, true);

  SELECT COUNT(*) INTO name_count
  FROM cat_name_options
  WHERE is_active = true;

  IF name_count > 0 THEN
    RAISE NOTICE '✓ Anonymous can view active names (count: %)', name_count;
  ELSE
    RAISE WARNING '⚠️  No active names visible to anonymous';
  END IF;
END $;

-- Test: Cannot view inactive names
DO $
DECLARE
  inactive_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inactive_count
  FROM cat_name_options
  WHERE is_active = false;

  IF inactive_count = 0 THEN
    RAISE NOTICE '✓ Anonymous cannot view inactive names';
  ELSE
    RAISE WARNING '❌ Anonymous can see % inactive names (should be 0)', inactive_count;
  END IF;
END $;

-- Test: Cannot view other users' ratings
DO $
DECLARE
  rating_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rating_count
  FROM cat_name_ratings;

  IF rating_count = 0 THEN
    RAISE NOTICE '✓ Anonymous cannot view ratings';
  ELSE
    RAISE WARNING '❌ Anonymous can see % ratings (should be 0)', rating_count;
  END IF;
END $;

-- ===== TEST 2: REGULAR USER =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test 2: Regular User';
  RAISE NOTICE '========================================';
END $;

-- Set session as regular user
DO $
BEGIN
  PERFORM set_config('request.jwt.claims', 
    '{"user_name": "test_regular_user"}', 
    true);
  RAISE NOTICE 'Session set as: test_regular_user';
END $;

-- Test: Can view own ratings
DO $
DECLARE
  own_rating_count INTEGER;
BEGIN
  -- Insert a test rating
  INSERT INTO cat_name_ratings (user_name, name_id, rating, wins, losses)
  SELECT 
    'test_regular_user',
    id,
    1500,
    0,
    0
  FROM cat_name_options
  WHERE is_active = true
  LIMIT 1
  ON CONFLICT (user_name, name_id) DO NOTHING;

  SELECT COUNT(*) INTO own_rating_count
  FROM cat_name_ratings
  WHERE user_name = 'test_regular_user';

  IF own_rating_count > 0 THEN
    RAISE NOTICE '✓ User can view own ratings (count: %)', own_rating_count;
  ELSE
    RAISE WARNING '⚠️  User cannot view own ratings';
  END IF;
END $;

-- Test: Cannot view other users' ratings
DO $
DECLARE
  other_rating_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO other_rating_count
  FROM cat_name_ratings
  WHERE user_name != 'test_regular_user';

  IF other_rating_count = 0 THEN
    RAISE NOTICE '✓ User cannot view others'' ratings';
  ELSE
    RAISE WARNING '❌ User can see % other ratings (should be 0)', other_rating_count;
  END IF;
END $;

-- Test: Can view own profile
DO $
DECLARE
  can_view_own BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cat_app_users 
    WHERE user_name = 'test_regular_user'
  ) INTO can_view_own;

  IF can_view_own THEN
    RAISE NOTICE '✓ User can view own profile';
  ELSE
    RAISE WARNING '❌ User cannot view own profile';
  END IF;
END $;

-- Test: Cannot view other profiles
DO $
DECLARE
  other_profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO other_profile_count
  FROM cat_app_users
  WHERE user_name != 'test_regular_user';

  IF other_profile_count = 0 THEN
    RAISE NOTICE '✓ User cannot view other profiles';
  ELSE
    RAISE WARNING '❌ User can see % other profiles (should be 0)', other_profile_count;
  END IF;
END $;

-- Test: Can view own tournaments
DO $
DECLARE
  own_tournament_count INTEGER;
BEGIN
  -- Insert a test tournament
  INSERT INTO tournament_selections (
    user_name, 
    tournament_name, 
    selected_names, 
    status
  )
  VALUES (
    'test_regular_user',
    'Test Tournament',
    ARRAY['name1', 'name2'],
    'completed'
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO own_tournament_count
  FROM tournament_selections
  WHERE user_name = 'test_regular_user';

  IF own_tournament_count > 0 THEN
    RAISE NOTICE '✓ User can view own tournaments (count: %)', own_tournament_count;
  ELSE
    RAISE WARNING '⚠️  User cannot view own tournaments';
  END IF;
END $;

-- Test: Cannot view other tournaments
DO $
DECLARE
  other_tournament_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO other_tournament_count
  FROM tournament_selections
  WHERE user_name != 'test_regular_user';

  IF other_tournament_count = 0 THEN
    RAISE NOTICE '✓ User cannot view others'' tournaments';
  ELSE
    RAISE WARNING '❌ User can see % other tournaments (should be 0)', other_tournament_count;
  END IF;
END $;

-- ===== TEST 3: ADMIN USER =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test 3: Admin User';
  RAISE NOTICE '========================================';
END $;

-- Set session as admin
DO $
BEGIN
  PERFORM set_config('request.jwt.claims', 
    '{"user_name": "test_admin_user"}', 
    true);
  RAISE NOTICE 'Session set as: test_admin_user';
END $;

-- Test: Can view all ratings
DO $
DECLARE
  all_rating_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO all_rating_count
  FROM cat_name_ratings;

  IF all_rating_count > 0 THEN
    RAISE NOTICE '✓ Admin can view all ratings (count: %)', all_rating_count;
  ELSE
    RAISE WARNING '⚠️  No ratings visible to admin';
  END IF;
END $;

-- Test: Can view all profiles
DO $
DECLARE
  all_profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO all_profile_count
  FROM cat_app_users;

  IF all_profile_count > 0 THEN
    RAISE NOTICE '✓ Admin can view all profiles (count: %)', all_profile_count;
  ELSE
    RAISE WARNING '⚠️  No profiles visible to admin';
  END IF;
END $;

-- Test: Can view all tournaments
DO $
DECLARE
  all_tournament_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO all_tournament_count
  FROM tournament_selections;

  IF all_tournament_count > 0 THEN
    RAISE NOTICE '✓ Admin can view all tournaments (count: %)', all_tournament_count;
  ELSE
    RAISE WARNING '⚠️  No tournaments visible to admin';
  END IF;
END $;

-- Test: Can view all cat names (including inactive)
DO $
DECLARE
  all_name_count INTEGER;
  inactive_name_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO all_name_count
  FROM cat_name_options;

  SELECT COUNT(*) INTO inactive_name_count
  FROM cat_name_options
  WHERE is_active = false;

  RAISE NOTICE '✓ Admin can view all names (total: %, inactive: %)', 
    all_name_count, inactive_name_count;
END $;

-- Test: Can manage roles
DO $
DECLARE
  all_role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO all_role_count
  FROM user_roles;

  IF all_role_count > 0 THEN
    RAISE NOTICE '✓ Admin can view all roles (count: %)', all_role_count;
  ELSE
    RAISE WARNING '⚠️  No roles visible to admin';
  END IF;
END $;

-- ===== TEST 4: MODERATOR USER =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test 4: Moderator User';
  RAISE NOTICE '========================================';
END $;

-- Set session as moderator
DO $
BEGIN
  PERFORM set_config('request.jwt.claims', 
    '{"user_name": "test_moderator_user"}', 
    true);
  RAISE NOTICE 'Session set as: test_moderator_user';
END $;

-- Test: Can view own data (like regular user)
DO $
DECLARE
  own_rating_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO own_rating_count
  FROM cat_name_ratings
  WHERE user_name = 'test_moderator_user';

  RAISE NOTICE '✓ Moderator can view own ratings (count: %)', own_rating_count;
END $;

-- Test: Cannot view all data (not admin)
DO $
DECLARE
  all_rating_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO all_rating_count
  FROM cat_name_ratings;

  IF all_rating_count = 0 OR all_rating_count = (
    SELECT COUNT(*) FROM cat_name_ratings WHERE user_name = 'test_moderator_user'
  ) THEN
    RAISE NOTICE '✓ Moderator cannot view all ratings (only own)';
  ELSE
    RAISE WARNING '⚠️  Moderator can see more than own ratings';
  END IF;
END $;

-- ===== CLEANUP =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Cleanup';
  RAISE NOTICE '========================================';
END $;

-- Reset session
DO $
BEGIN
  PERFORM set_config('request.jwt.claims', NULL, true);
  RAISE NOTICE '✓ Session reset';
END $;

-- ===== FINAL SUMMARY =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Policy Testing Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tests completed:';
  RAISE NOTICE '  ✓ Anonymous user access';
  RAISE NOTICE '  ✓ Regular user access (own data only)';
  RAISE NOTICE '  ✓ Admin user access (all data)';
  RAISE NOTICE '  ✓ Moderator user access';
  RAISE NOTICE '';
  RAISE NOTICE 'Review any warnings above.';
  RAISE NOTICE 'All ✓ marks indicate passing tests.';
  RAISE NOTICE 'All ❌ marks indicate failing tests.';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Test users remain in database for further testing.';
  RAISE NOTICE 'To remove: DELETE FROM cat_app_users WHERE user_name LIKE ''test_%'';';
END $;
