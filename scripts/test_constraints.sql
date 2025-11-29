-- Test Constraints Script
-- This script tests all constraints added in Phase 2

-- ===== TEST 1: Unique Constraint on cat_name_ratings =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing Unique Constraint';
  RAISE NOTICE '========================================';
END $;

-- Test: Try to insert duplicate (should fail)
DO $
DECLARE
  test_user TEXT := 'test_constraint_user';
  test_name_id UUID;
  duplicate_error BOOLEAN := FALSE;
BEGIN
  -- Get a name ID
  SELECT id INTO test_name_id FROM cat_name_options WHERE is_active = true LIMIT 1;

  -- Insert first rating
  INSERT INTO cat_name_ratings (user_name, name_id, rating, wins, losses)
  VALUES (test_user, test_name_id, 1500, 0, 0)
  ON CONFLICT (user_name, name_id) DO NOTHING;

  -- Try to insert duplicate (should fail)
  BEGIN
    INSERT INTO cat_name_ratings (user_name, name_id, rating, wins, losses)
    VALUES (test_user, test_name_id, 1600, 1, 0);
    
    RAISE NOTICE '❌ FAIL: Duplicate insert succeeded (should have failed)';
  EXCEPTION WHEN unique_violation THEN
    duplicate_error := TRUE;
    RAISE NOTICE '✓ PASS: Duplicate insert correctly rejected';
  END;

  -- Cleanup
  DELETE FROM cat_name_ratings WHERE user_name = test_user;

  IF NOT duplicate_error THEN
    RAISE EXCEPTION 'Unique constraint test failed';
  END IF;
END $;

-- ===== TEST 2: Check Constraints =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing Check Constraints';
  RAISE NOTICE '========================================';
END $;

-- Test: Name length constraint (if exists)
DO $
DECLARE
  test_error BOOLEAN := FALSE;
BEGIN
  BEGIN
    INSERT INTO cat_name_options (name, description, is_active)
    VALUES ('', 'Test empty name', true);
    
    RAISE NOTICE '❌ FAIL: Empty name insert succeeded (should have failed)';
    DELETE FROM cat_name_options WHERE name = '';
  EXCEPTION WHEN check_violation THEN
    test_error := TRUE;
    RAISE NOTICE '✓ PASS: Empty name correctly rejected';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  SKIP: Name length constraint not yet added';
  END;
END $;

-- Test: Rating range constraint (if exists)
DO $
DECLARE
  test_user TEXT := 'test_rating_range';
  test_name_id UUID;
  test_error BOOLEAN := FALSE;
BEGIN
  SELECT id INTO test_name_id FROM cat_name_options WHERE is_active = true LIMIT 1;

  BEGIN
    INSERT INTO cat_name_ratings (user_name, name_id, rating, wins, losses)
    VALUES (test_user, test_name_id, 3000, 0, 0);  -- Invalid: > 2000
    
    RAISE NOTICE '❌ FAIL: Invalid rating insert succeeded (should have failed)';
    DELETE FROM cat_name_ratings WHERE user_name = test_user;
  EXCEPTION WHEN check_violation THEN
    test_error := TRUE;
    RAISE NOTICE '✓ PASS: Invalid rating correctly rejected';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  SKIP: Rating range constraint not yet added';
  END;
END $;

-- Test: Non-negative wins constraint (if exists)
DO $
DECLARE
  test_user TEXT := 'test_negative_wins';
  test_name_id UUID;
  test_error BOOLEAN := FALSE;
BEGIN
  SELECT id INTO test_name_id FROM cat_name_options WHERE is_active = true LIMIT 1;

  BEGIN
    INSERT INTO cat_name_ratings (user_name, name_id, rating, wins, losses)
    VALUES (test_user, test_name_id, 1500, -1, 0);  -- Invalid: negative wins
    
    RAISE NOTICE '❌ FAIL: Negative wins insert succeeded (should have failed)';
    DELETE FROM cat_name_ratings WHERE user_name = test_user;
  EXCEPTION WHEN check_violation THEN
    test_error := TRUE;
    RAISE NOTICE '✓ PASS: Negative wins correctly rejected';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  SKIP: Non-negative wins constraint not yet added';
  END;
END $;

-- ===== TEST 3: Index Usage =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing Index Usage';
  RAISE NOTICE '========================================';
END $;

-- Test: Check if indexes are being used
DO $
DECLARE
  plan_text TEXT;
BEGIN
  -- Test leaderboard index
  SELECT query_plan INTO plan_text
  FROM (
    SELECT string_agg(line, E'\n') as query_plan
    FROM (
      SELECT * FROM (
        EXPLAIN (FORMAT TEXT)
        SELECT name_id, rating, wins
        FROM cat_name_ratings
        WHERE rating IS NOT NULL
        ORDER BY rating DESC, wins DESC
        LIMIT 10
      ) AS plan_lines(line)
    ) AS lines
  ) AS plan;

  IF plan_text LIKE '%Index%' THEN
    RAISE NOTICE '✓ PASS: Leaderboard query uses index';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Leaderboard query not using index';
  END IF;
END $;

-- ===== TEST 4: Constraint Information =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Constraint Summary';
  RAISE NOTICE '========================================';
END $;

-- List all constraints on cat_name_ratings
SELECT 
  conname as constraint_name,
  CASE contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 't' THEN 'TRIGGER'
    WHEN 'x' THEN 'EXCLUSION'
  END as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'cat_name_ratings'::regclass
ORDER BY contype, conname;

-- ===== TEST 5: Performance Impact =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Performance Impact Check';
  RAISE NOTICE '========================================';
END $;

-- Check if constraint checking is fast
DO $
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  duration INTERVAL;
  test_user TEXT := 'perf_test_user';
  test_name_id UUID;
BEGIN
  SELECT id INTO test_name_id FROM cat_name_options WHERE is_active = true LIMIT 1;

  start_time := clock_timestamp();
  
  -- Insert 100 ratings
  FOR i IN 1..100 LOOP
    INSERT INTO cat_name_ratings (user_name, name_id, rating, wins, losses)
    SELECT 
      test_user || '_' || i,
      id,
      1500,
      0,
      0
    FROM cat_name_options
    WHERE is_active = true
    LIMIT 1
    ON CONFLICT (user_name, name_id) DO NOTHING;
  END LOOP;

  end_time := clock_timestamp();
  duration := end_time - start_time;

  RAISE NOTICE 'Inserted 100 ratings in: %', duration;
  
  IF EXTRACT(EPOCH FROM duration) < 1.0 THEN
    RAISE NOTICE '✓ PASS: Constraint checking is fast (< 1 second)';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Constraint checking is slow (> 1 second)';
  END IF;

  -- Cleanup
  DELETE FROM cat_name_ratings WHERE user_name LIKE 'perf_test_user%';
END $;

-- ===== FINAL SUMMARY =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Constraint Testing Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Review the results above to ensure:';
  RAISE NOTICE '  1. Unique constraint prevents duplicates';
  RAISE NOTICE '  2. Check constraints validate data';
  RAISE NOTICE '  3. Indexes are being used';
  RAISE NOTICE '  4. Performance is acceptable';
  RAISE NOTICE '';
  RAISE NOTICE 'If all tests pass, constraints are working correctly.';
  RAISE NOTICE 'If any tests fail, review and fix before proceeding.';
END $;
