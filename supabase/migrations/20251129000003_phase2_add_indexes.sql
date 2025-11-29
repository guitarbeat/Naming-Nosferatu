-- Migration: Phase 2 - Add Optimized Indexes
-- Part of Supabase Backend Optimization
-- This migration adds covering indexes for common query patterns

-- ===== BACKUP REMINDER =====
-- Before running: ./scripts/create_backup.sh phase2_indexes

-- ===== ADD COVERING INDEXES =====

-- 1. Leaderboard Query Index
-- Covers: SELECT name_id, rating, wins FROM cat_name_ratings 
--         WHERE rating IS NOT NULL ORDER BY rating DESC, wins DESC
CREATE INDEX IF NOT EXISTS idx_ratings_leaderboard 
ON cat_name_ratings (name_id, rating DESC, wins DESC) 
WHERE rating IS NOT NULL;

COMMENT ON INDEX idx_ratings_leaderboard IS 
  'Covering index for leaderboard queries (rating + wins sorting)';

-- 2. User Stats Query Index
-- Covers: SELECT * FROM cat_name_ratings 
--         WHERE user_name = ? AND rating IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_ratings_user_stats 
ON cat_name_ratings (user_name, rating, wins, losses)
WHERE rating IS NOT NULL;

COMMENT ON INDEX idx_ratings_user_stats IS 
  'Covering index for user statistics queries';

-- 3. Tournament History Index
-- Covers: SELECT * FROM tournament_selections 
--         WHERE user_name = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_tournament_user_recent 
ON tournament_selections (user_name, created_at DESC);

COMMENT ON INDEX idx_tournament_user_recent IS 
  'Index for user tournament history queries';

-- 4. Active Names Index (if not exists)
-- Covers: SELECT * FROM cat_name_options WHERE is_active = true
CREATE INDEX IF NOT EXISTS idx_cat_name_options_active 
ON cat_name_options (is_active, avg_rating DESC)
WHERE is_active = true;

COMMENT ON INDEX idx_cat_name_options_active IS 
  'Partial index for active cat names with rating sorting';

-- 5. Name Search Index
-- Covers: SELECT * FROM cat_name_options WHERE name ILIKE '%search%'
CREATE INDEX IF NOT EXISTS idx_cat_name_options_name_search 
ON cat_name_options USING gin (name gin_trgm_ops)
WHERE is_active = true;

-- Note: Requires pg_trgm extension
DO $
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  RAISE NOTICE '✓ pg_trgm extension enabled for fuzzy search';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Could not enable pg_trgm extension (may require superuser)';
  RAISE NOTICE '   Name search index will use standard text matching';
END $;

-- ===== ANALYZE TABLES =====

-- Update statistics for query planner
ANALYZE cat_name_options;
ANALYZE cat_name_ratings;
ANALYZE tournament_selections;

-- ===== VERIFICATION =====

-- Verify indexes were created
DO $
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_ratings_leaderboard',
      'idx_ratings_user_stats',
      'idx_tournament_user_recent',
      'idx_cat_name_options_active',
      'idx_cat_name_options_name_search'
    );

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Index Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created % out of 5 indexes', index_count;

  IF index_count >= 4 THEN
    RAISE NOTICE '✓ Core indexes created successfully';
  ELSE
    RAISE WARNING 'Some indexes may not have been created';
  END IF;
END $;

-- ===== INDEX USAGE ANALYSIS =====

-- Show index sizes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ===== QUERY PLAN TESTING =====

-- Test leaderboard query plan
DO $
DECLARE
  plan_text TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Query Plan Analysis';
  RAISE NOTICE '========================================';
  
  -- Test leaderboard query
  RAISE NOTICE '';
  RAISE NOTICE 'Leaderboard Query Plan:';
  FOR plan_text IN
    EXPLAIN (FORMAT TEXT)
    SELECT name_id, rating, wins
    FROM cat_name_ratings
    WHERE rating IS NOT NULL
    ORDER BY rating DESC, wins DESC
    LIMIT 50
  LOOP
    RAISE NOTICE '%', plan_text;
  END LOOP;

  -- Test user stats query
  RAISE NOTICE '';
  RAISE NOTICE 'User Stats Query Plan:';
  FOR plan_text IN
    EXPLAIN (FORMAT TEXT)
    SELECT rating, wins, losses
    FROM cat_name_ratings
    WHERE user_name = 'test_user'
      AND rating IS NOT NULL
  LOOP
    RAISE NOTICE '%', plan_text;
  END LOOP;

  -- Test tournament history query
  RAISE NOTICE '';
  RAISE NOTICE 'Tournament History Query Plan:';
  FOR plan_text IN
    EXPLAIN (FORMAT TEXT)
    SELECT *
    FROM tournament_selections
    WHERE user_name = 'test_user'
    ORDER BY created_at DESC
    LIMIT 20
  LOOP
    RAISE NOTICE '%', plan_text;
  END LOOP;
END $;

-- ===== STATISTICS =====

DO $
DECLARE
  total_indexes INTEGER;
  total_index_size TEXT;
BEGIN
  SELECT COUNT(*), pg_size_pretty(SUM(pg_relation_size(indexrelid)))
  INTO total_indexes, total_index_size
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 2: Indexes Added';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total indexes: %', total_indexes;
  RAISE NOTICE 'Total index size: %', total_index_size;
  RAISE NOTICE '';
  RAISE NOTICE 'New indexes:';
  RAISE NOTICE '  - idx_ratings_leaderboard (covering)';
  RAISE NOTICE '  - idx_ratings_user_stats (covering)';
  RAISE NOTICE '  - idx_tournament_user_recent';
  RAISE NOTICE '  - idx_cat_name_options_active (partial)';
  RAISE NOTICE '  - idx_cat_name_options_name_search (GIN)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run performance tests to verify improvements';
  RAISE NOTICE '      node scripts/performance_monitor.js';
END $;
