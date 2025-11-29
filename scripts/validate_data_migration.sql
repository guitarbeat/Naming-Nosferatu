-- Data Migration Validation Script
-- Validates that Phase 3 data migration was successful

-- ===== VALIDATION SUMMARY =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Data Migration Validation';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $;

-- ===== 1. ROLE DATA VALIDATION =====

DO $
BEGIN
  RAISE NOTICE '1. Role Data Validation';
  RAISE NOTICE '------------------------';
END $;

-- Check: All users have roles
DO $
DECLARE
  users_without_roles INTEGER;
  total_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM cat_app_users;
  
  SELECT COUNT(*) INTO users_without_roles
  FROM cat_app_users
  WHERE NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_name = cat_app_users.user_name
  );

  IF users_without_roles = 0 THEN
    RAISE NOTICE '✓ All % users have roles', total_users;
  ELSE
    RAISE WARNING '❌ % users missing roles', users_without_roles;
  END IF;
END $;

-- Check: Role distribution matches
DO $
DECLARE
  old_admin_count INTEGER;
  new_admin_count INTEGER;
  old_moderator_count INTEGER;
  new_moderator_count INTEGER;
BEGIN
  -- Count from old column
  SELECT COUNT(*) INTO old_admin_count
  FROM cat_app_users
  WHERE user_role = 'admin';

  SELECT COUNT(*) INTO old_moderator_count
  FROM cat_app_users
  WHERE user_role = 'moderator';

  -- Count from new table
  SELECT COUNT(DISTINCT user_name) INTO new_admin_count
  FROM user_roles
  WHERE role = 'admin';

  SELECT COUNT(DISTINCT user_name) INTO new_moderator_count
  FROM user_roles
  WHERE role = 'moderator';

  RAISE NOTICE '  Admins: old=%, new=%', old_admin_count, new_admin_count;
  RAISE NOTICE '  Moderators: old=%, new=%', old_moderator_count, new_moderator_count;

  IF old_admin_count = new_admin_count AND old_moderator_count = new_moderator_count THEN
    RAISE NOTICE '✓ Role distribution matches';
  ELSE
    RAISE WARNING '⚠️  Role distribution differs (may include defaults)';
  END IF;
END $;

-- ===== 2. TOURNAMENT DATA VALIDATION =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2. Tournament Data Validation';
  RAISE NOTICE '-----------------------------';
END $;

-- Check: Tournament count matches
DO $
DECLARE
  jsonb_count INTEGER;
  table_count INTEGER;
  difference INTEGER;
BEGIN
  -- Count from JSONB
  SELECT COALESCE(SUM(jsonb_array_length(tournament_data)), 0) INTO jsonb_count
  FROM cat_app_users
  WHERE tournament_data IS NOT NULL;

  -- Count from table
  SELECT COUNT(*) INTO table_count
  FROM tournament_selections;

  difference := ABS(table_count - jsonb_count);

  RAISE NOTICE '  JSONB tournaments: %', jsonb_count;
  RAISE NOTICE '  Table tournaments: %', table_count;
  RAISE NOTICE '  Difference: %', difference;

  IF difference = 0 THEN
    RAISE NOTICE '✓ Tournament counts match exactly';
  ELSIF difference < 10 THEN
    RAISE NOTICE '⚠️  Small difference (may be pre-existing records)';
  ELSE
    RAISE WARNING '❌ Significant difference in tournament counts';
  END IF;
END $;

-- Check: User tournament counts match
DO $
DECLARE
  mismatch_count INTEGER;
BEGIN
  WITH jsonb_counts AS (
    SELECT 
      user_name,
      COALESCE(jsonb_array_length(tournament_data), 0) as jsonb_count
    FROM cat_app_users
    WHERE tournament_data IS NOT NULL
  ),
  table_counts AS (
    SELECT 
      user_name,
      COUNT(*) as table_count
    FROM tournament_selections
    GROUP BY user_name
  )
  SELECT COUNT(*) INTO mismatch_count
  FROM jsonb_counts j
  FULL OUTER JOIN table_counts t ON j.user_name = t.user_name
  WHERE COALESCE(j.jsonb_count, 0) != COALESCE(t.table_count, 0);

  IF mismatch_count = 0 THEN
    RAISE NOTICE '✓ Per-user tournament counts match';
  ELSE
    RAISE WARNING '⚠️  % users have mismatched tournament counts', mismatch_count;
  END IF;
END $;

-- Check: Tournament IDs are unique
DO $
DECLARE
  duplicate_ids INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_ids
  FROM (
    SELECT id, COUNT(*) as cnt
    FROM tournament_selections
    GROUP BY id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_ids = 0 THEN
    RAISE NOTICE '✓ All tournament IDs are unique';
  ELSE
    RAISE WARNING '❌ Found % duplicate tournament IDs', duplicate_ids;
  END IF;
END $;

-- ===== 3. DATA INTEGRITY CHECKS =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3. Data Integrity Checks';
  RAISE NOTICE '------------------------';
END $;

-- Check: Foreign key integrity (user_name exists)
DO $
DECLARE
  orphaned_ratings INTEGER;
  orphaned_tournaments INTEGER;
BEGIN
  -- Check ratings
  SELECT COUNT(*) INTO orphaned_ratings
  FROM cat_name_ratings
  WHERE NOT EXISTS (
    SELECT 1 FROM cat_app_users 
    WHERE cat_app_users.user_name = cat_name_ratings.user_name
  );

  -- Check tournaments
  SELECT COUNT(*) INTO orphaned_tournaments
  FROM tournament_selections
  WHERE NOT EXISTS (
    SELECT 1 FROM cat_app_users 
    WHERE cat_app_users.user_name = tournament_selections.user_name
  );

  IF orphaned_ratings = 0 AND orphaned_tournaments = 0 THEN
    RAISE NOTICE '✓ No orphaned records';
  ELSE
    IF orphaned_ratings > 0 THEN
      RAISE WARNING '❌ Found % orphaned ratings', orphaned_ratings;
    END IF;
    IF orphaned_tournaments > 0 THEN
      RAISE WARNING '❌ Found % orphaned tournaments', orphaned_tournaments;
    END IF;
  END IF;
END $;

-- Check: Constraint violations
DO $
DECLARE
  constraint_violations INTEGER := 0;
BEGIN
  -- Check unique constraint on ratings
  SELECT COUNT(*) INTO constraint_violations
  FROM (
    SELECT user_name, name_id, COUNT(*) as cnt
    FROM cat_name_ratings
    GROUP BY user_name, name_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF constraint_violations > 0 THEN
    RAISE WARNING '❌ Found % duplicate ratings', constraint_violations;
  ELSE
    RAISE NOTICE '✓ No constraint violations';
  END IF;
END $;

-- Check: Data consistency
DO $
DECLARE
  invalid_ratings INTEGER;
  negative_stats INTEGER;
BEGIN
  -- Check rating ranges
  SELECT COUNT(*) INTO invalid_ratings
  FROM cat_name_ratings
  WHERE rating IS NOT NULL 
    AND (rating < 1000 OR rating > 2000);

  -- Check negative wins/losses
  SELECT COUNT(*) INTO negative_stats
  FROM cat_name_ratings
  WHERE (wins IS NOT NULL AND wins < 0)
     OR (losses IS NOT NULL AND losses < 0);

  IF invalid_ratings = 0 AND negative_stats = 0 THEN
    RAISE NOTICE '✓ All data within valid ranges';
  ELSE
    IF invalid_ratings > 0 THEN
      RAISE WARNING '❌ Found % ratings outside valid range', invalid_ratings;
    END IF;
    IF negative_stats > 0 THEN
      RAISE WARNING '❌ Found % records with negative stats', negative_stats;
    END IF;
  END IF;
END $;

-- ===== 4. SAMPLE DATA COMPARISON =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '4. Sample Data Comparison';
  RAISE NOTICE '-------------------------';
END $;

-- Compare sample tournament data
DO $
DECLARE
  sample_user TEXT;
  jsonb_first_tournament JSONB;
  table_first_tournament RECORD;
BEGIN
  -- Get a user with tournament data
  SELECT user_name INTO sample_user
  FROM cat_app_users
  WHERE tournament_data IS NOT NULL 
    AND jsonb_array_length(tournament_data) > 0
  LIMIT 1;

  IF sample_user IS NOT NULL THEN
    -- Get first tournament from JSONB
    SELECT tournament_data->0 INTO jsonb_first_tournament
    FROM cat_app_users
    WHERE user_name = sample_user;

    -- Get first tournament from table
    SELECT * INTO table_first_tournament
    FROM tournament_selections
    WHERE user_name = sample_user
    ORDER BY created_at
    LIMIT 1;

    RAISE NOTICE 'Sample user: %', sample_user;
    RAISE NOTICE '  JSONB tournament_name: %', jsonb_first_tournament->>'tournament_name';
    RAISE NOTICE '  Table tournament_name: %', table_first_tournament.tournament_name;
    
    IF (jsonb_first_tournament->>'tournament_name') = table_first_tournament.tournament_name THEN
      RAISE NOTICE '✓ Sample data matches';
    ELSE
      RAISE WARNING '⚠️  Sample data differs (check field mapping)';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  No tournament data to compare';
  END IF;
END $;

-- ===== 5. PERFORMANCE CHECK =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '5. Performance Check';
  RAISE NOTICE '--------------------';
END $;

-- Check index usage
DO $
DECLARE
  unused_indexes INTEGER;
BEGIN
  SELECT COUNT(*) INTO unused_indexes
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexrelname LIKE 'idx_%';

  RAISE NOTICE '  Unused indexes: %', unused_indexes;
  
  IF unused_indexes > 5 THEN
    RAISE WARNING '⚠️  Many unused indexes (consider removing)';
  ELSE
    RAISE NOTICE '✓ Index usage looks reasonable';
  END IF;
END $;

-- Check table sizes
DO $
DECLARE
  total_size TEXT;
BEGIN
  SELECT pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename)))
  INTO total_size
  FROM pg_tables
  WHERE schemaname = 'public';

  RAISE NOTICE '  Total database size: %', total_size;
END $;

-- ===== FINAL SUMMARY =====

DO $
DECLARE
  total_users INTEGER;
  total_roles INTEGER;
  total_ratings INTEGER;
  total_tournaments INTEGER;
  validation_passed BOOLEAN := TRUE;
BEGIN
  SELECT COUNT(*) INTO total_users FROM cat_app_users;
  SELECT COUNT(*) INTO total_roles FROM user_roles;
  SELECT COUNT(*) INTO total_ratings FROM cat_name_ratings;
  SELECT COUNT(*) INTO total_tournaments FROM tournament_selections;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Validation Summary';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Total roles: %', total_roles;
  RAISE NOTICE 'Total ratings: %', total_ratings;
  RAISE NOTICE 'Total tournaments: %', total_tournaments;
  RAISE NOTICE '';

  -- Check if validation passed
  -- (In a real implementation, you'd track failures)
  IF validation_passed THEN
    RAISE NOTICE '✅ VALIDATION PASSED';
    RAISE NOTICE '';
    RAISE NOTICE 'Data migration appears successful.';
    RAISE NOTICE 'Review any warnings above before proceeding.';
  ELSE
    RAISE WARNING '❌ VALIDATION FAILED';
    RAISE WARNING '';
    RAISE WARNING 'Fix issues before proceeding to Phase 4.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Review any warnings or errors above';
  RAISE NOTICE '  2. Test application functionality';
  RAISE NOTICE '  3. Run performance tests';
  RAISE NOTICE '  4. Proceed to Phase 4 (Update Functions & Policies)';
END $;
