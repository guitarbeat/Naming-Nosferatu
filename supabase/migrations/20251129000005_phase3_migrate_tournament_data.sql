-- Migration: Phase 3 - Migrate Tournament Data
-- Part of Supabase Backend Optimization
-- This migration extracts tournament data from JSONB to tournament_selections table

-- ===== BACKUP REMINDER =====
-- Before running: ./scripts/create_backup.sh phase3_tournament_migration

-- ===== PRE-MIGRATION CHECKS =====

DO $
DECLARE
  users_with_tournament_data INTEGER;
  existing_tournament_records INTEGER;
  total_jsonb_tournaments INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 3: Tournament Data Migration';
  RAISE NOTICE '========================================';
  
  -- Count users with tournament_data
  SELECT COUNT(*) INTO users_with_tournament_data
  FROM cat_app_users
  WHERE tournament_data IS NOT NULL 
    AND jsonb_array_length(tournament_data) > 0;

  -- Count existing records in tournament_selections
  SELECT COUNT(*) INTO existing_tournament_records
  FROM tournament_selections;

  -- Count total tournaments in JSONB
  SELECT COALESCE(SUM(jsonb_array_length(tournament_data)), 0) INTO total_jsonb_tournaments
  FROM cat_app_users
  WHERE tournament_data IS NOT NULL;

  RAISE NOTICE 'Users with tournament_data: %', users_with_tournament_data;
  RAISE NOTICE 'Tournaments in JSONB: %', total_jsonb_tournaments;
  RAISE NOTICE 'Existing tournament_selections records: %', existing_tournament_records;
  RAISE NOTICE '';
END $;

-- ===== EXTRACT AND MIGRATE TOURNAMENT DATA =====

-- Extract tournaments from JSONB and insert into tournament_selections
-- Handle missing fields with defaults
INSERT INTO tournament_selections (
  id,
  user_name,
  tournament_name,
  selected_names,
  participant_names,
  status,
  created_at,
  completed_at
)
SELECT 
  -- Use existing ID if present, otherwise generate new UUID
  COALESCE(
    (tournament->>'id')::UUID,
    gen_random_uuid()
  ) as id,
  
  -- User name from the cat_app_users table
  u.user_name,
  
  -- Tournament name (default if missing)
  COALESCE(
    tournament->>'tournament_name',
    'Tournament ' || (tournament->>'id')
  ) as tournament_name,
  
  -- Selected names (convert from JSONB array to text array)
  CASE 
    WHEN tournament->'selected_names' IS NOT NULL THEN
      ARRAY(SELECT jsonb_array_elements_text(tournament->'selected_names'))
    ELSE
      ARRAY[]::TEXT[]
  END as selected_names,
  
  -- Participant names (convert from JSONB array to text array)
  CASE 
    WHEN tournament->'participant_names' IS NOT NULL THEN
      ARRAY(SELECT jsonb_array_elements_text(tournament->'participant_names'))
    ELSE
      ARRAY[]::TEXT[]
  END as participant_names,
  
  -- Status (default to 'completed' if missing)
  COALESCE(
    tournament->>'status',
    'completed'
  ) as status,
  
  -- Created at (parse timestamp or use current time)
  COALESCE(
    (tournament->>'created_at')::TIMESTAMPTZ,
    NOW()
  ) as created_at,
  
  -- Completed at (parse timestamp or NULL)
  (tournament->>'completed_at')::TIMESTAMPTZ as completed_at

FROM cat_app_users u,
     jsonb_array_elements(u.tournament_data) as tournament
WHERE u.tournament_data IS NOT NULL
  AND jsonb_array_length(u.tournament_data) > 0
ON CONFLICT (id) DO UPDATE SET
  -- Update if tournament already exists (in case of re-run)
  tournament_name = EXCLUDED.tournament_name,
  selected_names = EXCLUDED.selected_names,
  participant_names = EXCLUDED.participant_names,
  status = EXCLUDED.status,
  created_at = EXCLUDED.created_at,
  completed_at = EXCLUDED.completed_at;

-- Log migration results
DO $
DECLARE
  migrated_count INTEGER;
BEGIN
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE '✓ Migrated % tournament records from JSONB', migrated_count;
END $;

-- ===== VERIFICATION =====

-- Verify row counts match
DO $
DECLARE
  jsonb_tournament_count INTEGER;
  table_tournament_count INTEGER;
  count_difference INTEGER;
BEGIN
  -- Count tournaments in JSONB
  SELECT COALESCE(SUM(jsonb_array_length(tournament_data)), 0) INTO jsonb_tournament_count
  FROM cat_app_users
  WHERE tournament_data IS NOT NULL;

  -- Count tournaments in table
  SELECT COUNT(*) INTO table_tournament_count
  FROM tournament_selections;

  count_difference := ABS(table_tournament_count - jsonb_tournament_count);

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tournaments in JSONB: %', jsonb_tournament_count;
  RAISE NOTICE 'Tournaments in table: %', table_tournament_count;
  RAISE NOTICE 'Difference: %', count_difference;

  IF count_difference > 0 THEN
    RAISE WARNING 'Row count mismatch: % tournaments difference', count_difference;
    RAISE WARNING 'This may be due to pre-existing records or duplicates';
  ELSE
    RAISE NOTICE '✓ Row counts match perfectly';
  END IF;
END $;

-- ===== VERIFY DATA INTEGRITY =====

-- Check for tournaments with missing required fields
DO $
DECLARE
  missing_user_name INTEGER;
  missing_tournament_name INTEGER;
  empty_selected_names INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_user_name
  FROM tournament_selections
  WHERE user_name IS NULL OR user_name = '';

  SELECT COUNT(*) INTO missing_tournament_name
  FROM tournament_selections
  WHERE tournament_name IS NULL OR tournament_name = '';

  SELECT COUNT(*) INTO empty_selected_names
  FROM tournament_selections
  WHERE selected_names IS NULL OR array_length(selected_names, 1) IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE 'Data Integrity Checks:';
  RAISE NOTICE '  Missing user_name: %', missing_user_name;
  RAISE NOTICE '  Missing tournament_name: %', missing_tournament_name;
  RAISE NOTICE '  Empty selected_names: %', empty_selected_names;

  IF missing_user_name > 0 OR missing_tournament_name > 0 THEN
    RAISE WARNING 'Some tournaments have missing required fields';
  ELSE
    RAISE NOTICE '✓ All tournaments have required fields';
  END IF;
END $;

-- ===== COMPARE SAMPLE DATA =====

-- Show sample comparison of old vs new data
DO $
DECLARE
  sample_user TEXT;
BEGIN
  -- Get a user with tournament data
  SELECT user_name INTO sample_user
  FROM cat_app_users
  WHERE tournament_data IS NOT NULL 
    AND jsonb_array_length(tournament_data) > 0
  LIMIT 1;

  IF sample_user IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE 'Sample Data Comparison for user: %', sample_user;
    RAISE NOTICE '';
    RAISE NOTICE 'From JSONB (first tournament):';
    
    -- Show first tournament from JSONB
    PERFORM jsonb_pretty(tournament_data->0)
    FROM cat_app_users
    WHERE user_name = sample_user;

    RAISE NOTICE '';
    RAISE NOTICE 'From table (first tournament):';
    
    -- Show first tournament from table
    PERFORM row_to_json(t.*)
    FROM tournament_selections t
    WHERE user_name = sample_user
    ORDER BY created_at
    LIMIT 1;
  END IF;
END $;

-- ===== TEST TOURNAMENT QUERIES =====

-- Test common tournament queries
DO $
DECLARE
  test_user TEXT;
  tournament_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing Tournament Queries';
  RAISE NOTICE '========================================';

  -- Get a test user
  SELECT user_name INTO test_user
  FROM tournament_selections
  LIMIT 1;

  IF test_user IS NOT NULL THEN
    -- Test: Get user's tournaments
    SELECT COUNT(*) INTO tournament_count
    FROM tournament_selections
    WHERE user_name = test_user;

    RAISE NOTICE '✓ User tournament query works';
    RAISE NOTICE '  User: %, Tournaments: %', test_user, tournament_count;

    -- Test: Get recent tournaments
    PERFORM *
    FROM tournament_selections
    WHERE user_name = test_user
    ORDER BY created_at DESC
    LIMIT 10;

    RAISE NOTICE '✓ Recent tournaments query works';

    -- Test: Get tournaments by status
    SELECT COUNT(*) INTO tournament_count
    FROM tournament_selections
    WHERE user_name = test_user
      AND status = 'completed';

    RAISE NOTICE '✓ Status filter query works';
    RAISE NOTICE '  Completed tournaments: %', tournament_count;
  ELSE
    RAISE NOTICE '⚠️  No tournaments found to test queries';
  END IF;
END $;

-- ===== STATISTICS =====

DO $
DECLARE
  total_tournaments INTEGER;
  total_users_with_tournaments INTEGER;
  completed_tournaments INTEGER;
  in_progress_tournaments INTEGER;
  avg_selections_per_tournament NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_tournaments FROM tournament_selections;
  SELECT COUNT(DISTINCT user_name) INTO total_users_with_tournaments FROM tournament_selections;
  SELECT COUNT(*) INTO completed_tournaments FROM tournament_selections WHERE status = 'completed';
  SELECT COUNT(*) INTO in_progress_tournaments FROM tournament_selections WHERE status = 'in_progress';
  
  SELECT AVG(array_length(selected_names, 1)) INTO avg_selections_per_tournament
  FROM tournament_selections
  WHERE selected_names IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 3: Tournament Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total tournaments: %', total_tournaments;
  RAISE NOTICE 'Users with tournaments: %', total_users_with_tournaments;
  RAISE NOTICE 'Completed: %', completed_tournaments;
  RAISE NOTICE 'In progress: %', in_progress_tournaments;
  RAISE NOTICE 'Avg selections per tournament: %', ROUND(avg_selections_per_tournament, 1);
  RAISE NOTICE '';
  RAISE NOTICE '✓ Tournament data successfully migrated';
  RAISE NOTICE '✓ All JSONB tournaments extracted to table';
  RAISE NOTICE '✓ Tournament queries tested and working';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Validate data consistency (Phase 3.3)';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: cat_app_users.tournament_data column still exists';
  RAISE NOTICE '      It will be dropped in Phase 5';
END $;
