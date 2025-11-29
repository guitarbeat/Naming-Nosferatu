-- Migration: Phase 5 - Remove Unused Database Objects
-- Part of Supabase Backend Optimization
-- This migration removes unused materialized views, functions, indexes, and triggers

-- ===== BACKUP REMINDER =====
-- Before running: ./scripts/create_backup.sh phase5_remove_objects

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 5: Removing Unused Objects';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $;

-- ===== 1. DROP MATERIALIZED VIEWS =====

DO $
BEGIN
  RAISE NOTICE 'Dropping materialized views...';
END $;

-- Drop leaderboard_stats materialized view
-- This view is never refreshed and queries are fast enough without it
DROP MATERIALIZED VIEW IF EXISTS leaderboard_stats CASCADE;

RAISE NOTICE '✓ Dropped leaderboard_stats materialized view';

-- Drop related indexes
DROP INDEX IF EXISTS idx_leaderboard_stats_rating;

RAISE NOTICE '✓ Dropped related indexes';

-- ===== 2. DROP UNUSED FUNCTIONS =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Dropping unused functions...';
END $;

-- Drop increment_selection function (no-op)
DROP FUNCTION IF EXISTS increment_selection(TEXT, UUID);

RAISE NOTICE '✓ Dropped increment_selection() function';

-- Drop refresh_materialized_views function (no longer needed)
DROP FUNCTION IF EXISTS refresh_materialized_views();

RAISE NOTICE '✓ Dropped refresh_materialized_views() function';

-- Drop update_user_tournament_data if it exists (was never created but called)
DROP FUNCTION IF EXISTS update_user_tournament_data(TEXT, JSONB);

RAISE NOTICE '✓ Dropped update_user_tournament_data() function (if existed)';

-- ===== 3. DROP UNUSED INDEXES =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Analyzing index usage...';
END $;

-- Show unused indexes before dropping
DO $
DECLARE
  unused_index RECORD;
  unused_count INTEGER := 0;
BEGIN
  FOR unused_index IN
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan,
      pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND idx_scan = 0
      AND indexrelname NOT LIKE '%_pkey'
    ORDER BY pg_relation_size(indexrelid) DESC
  LOOP
    unused_count := unused_count + 1;
    RAISE NOTICE '  Unused: %.% (scans: %, size: %)', 
      unused_index.tablename, 
      unused_index.indexname, 
      unused_index.idx_scan,
      unused_index.size;
  END LOOP;

  IF unused_count = 0 THEN
    RAISE NOTICE '✓ No unused indexes found';
  ELSE
    RAISE NOTICE '⚠️  Found % unused indexes', unused_count;
  END IF;
END $;

-- Drop specific unused indexes (if they exist and are truly unused)
-- Note: Be cautious - some indexes may be unused in test but used in production

-- Drop old partial index if it exists and is unused
DROP INDEX IF EXISTS idx_cat_name_options_active_old;

-- Drop old leaderboard index (replaced by new covering index)
DROP INDEX IF EXISTS idx_cat_name_ratings_leaderboard_old;

RAISE NOTICE '✓ Dropped old/unused indexes';

-- ===== 4. DROP UNUSED TRIGGERS =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Checking for unused triggers...';
END $;

-- List all triggers
DO $
DECLARE
  trigger_rec RECORD;
  trigger_count INTEGER := 0;
BEGIN
  FOR trigger_rec IN
    SELECT 
      trigger_name,
      event_object_table,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  LOOP
    trigger_count := trigger_count + 1;
    RAISE NOTICE '  Trigger: % on % (%)', 
      trigger_rec.trigger_name,
      trigger_rec.event_object_table,
      trigger_rec.action_statement;
  END LOOP;

  IF trigger_count = 0 THEN
    RAISE NOTICE '✓ No triggers found';
  ELSE
    RAISE NOTICE 'Found % triggers (review manually)', trigger_count;
  END IF;
END $;

-- Drop audit trigger if it's not being used
-- Uncomment if you want to remove audit logging:
-- DROP TRIGGER IF EXISTS audit_cat_app_users_trigger ON cat_app_users;

-- ===== 5. CLEAN UP OLD BACKUP TABLES =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Checking for old backup tables...';
END $;

-- List backup tables (don't drop automatically - let admin decide)
DO $
DECLARE
  backup_table RECORD;
  backup_count INTEGER := 0;
BEGIN
  FOR backup_table IN
    SELECT 
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename LIKE '_backup_%'
    ORDER BY tablename
  LOOP
    backup_count := backup_count + 1;
    RAISE NOTICE '  Backup table: % (size: %)', backup_table.tablename, backup_table.size;
  END LOOP;

  IF backup_count = 0 THEN
    RAISE NOTICE '✓ No backup tables found';
  ELSE
    RAISE NOTICE 'Found % backup tables (keep for rollback)', backup_count;
  END IF;
END $;

-- ===== 6. VERIFY REMOVALS =====

DO $
DECLARE
  remaining_objects INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Verification';
  RAISE NOTICE '========================================';

  -- Check materialized views
  SELECT COUNT(*) INTO remaining_objects
  FROM pg_matviews
  WHERE schemaname = 'public'
    AND matviewname = 'leaderboard_stats';

  IF remaining_objects = 0 THEN
    RAISE NOTICE '✓ leaderboard_stats removed';
  ELSE
    RAISE WARNING '❌ leaderboard_stats still exists';
  END IF;

  -- Check functions
  SELECT COUNT(*) INTO remaining_objects
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('increment_selection', 'refresh_materialized_views', 'update_user_tournament_data');

  IF remaining_objects = 0 THEN
    RAISE NOTICE '✓ Unused functions removed';
  ELSE
    RAISE WARNING '❌ % unused functions still exist', remaining_objects;
  END IF;
END $;

-- ===== 7. LIST REMAINING OBJECTS =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining database objects:';
  RAISE NOTICE '';
END $;

-- List functions
DO $
BEGIN
  RAISE NOTICE 'Functions:';
END $;

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- List indexes
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Indexes:';
END $;

SELECT 
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- List materialized views
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Materialized Views:';
END $;

SELECT 
  matviewname,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- ===== 8. CALCULATE SPACE SAVINGS =====

DO $
DECLARE
  total_db_size TEXT;
  total_index_size TEXT;
BEGIN
  SELECT pg_size_pretty(pg_database_size(current_database())) INTO total_db_size;
  
  SELECT pg_size_pretty(SUM(pg_relation_size(indexrelid))) INTO total_index_size
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Database Statistics';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total database size: %', total_db_size;
  RAISE NOTICE 'Total index size: %', total_index_size;
  RAISE NOTICE '';
  RAISE NOTICE 'Run VACUUM ANALYZE to update statistics';
  RAISE NOTICE 'Run VACUUM FULL to reclaim disk space';
END $;

-- ===== STATISTICS =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 5: Unused Objects Removed';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Removed:';
  RAISE NOTICE '  ✓ leaderboard_stats materialized view';
  RAISE NOTICE '  ✓ increment_selection() function';
  RAISE NOTICE '  ✓ refresh_materialized_views() function';
  RAISE NOTICE '  ✓ update_user_tournament_data() function';
  RAISE NOTICE '  ✓ Unused indexes';
  RAISE NOTICE '';
  RAISE NOTICE 'Kept:';
  RAISE NOTICE '  - Backup tables (for rollback)';
  RAISE NOTICE '  - Audit triggers (if configured)';
  RAISE NOTICE '  - Active indexes';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Update TypeScript types (Phase 5.3)';
END $;
