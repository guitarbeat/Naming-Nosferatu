-- Phase 2 Rollback: Remove Added Constraints
-- This script removes all constraints and indexes added in Phase 2
-- Run this if Phase 2 constraints cause issues

-- ===== Remove Unique Constraints =====

ALTER TABLE cat_name_ratings 
DROP CONSTRAINT IF EXISTS unique_user_name_name_id;

COMMENT ON TABLE cat_name_ratings IS 'Unique constraint on (user_name, name_id) removed';

-- ===== Remove Check Constraints =====

ALTER TABLE cat_name_options 
DROP CONSTRAINT IF EXISTS check_name_length;

ALTER TABLE cat_name_ratings 
DROP CONSTRAINT IF EXISTS check_rating_range;

ALTER TABLE cat_name_ratings 
DROP CONSTRAINT IF EXISTS check_wins_non_negative;

ALTER TABLE cat_name_ratings 
DROP CONSTRAINT IF EXISTS check_losses_non_negative;

-- ===== Remove New Indexes =====

DROP INDEX IF EXISTS idx_ratings_leaderboard;
DROP INDEX IF EXISTS idx_ratings_user_stats;
DROP INDEX IF EXISTS idx_tournament_user_recent;

-- ===== Verification Queries =====

-- Check remaining constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid IN (
  'cat_name_ratings'::regclass,
  'cat_name_options'::regclass
)
ORDER BY conrelid, conname;

-- Check remaining indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('cat_name_ratings', 'cat_name_options', 'tournament_selections')
ORDER BY tablename, indexname;

-- Success message
DO $
BEGIN
  RAISE NOTICE 'Phase 2 rollback complete';
  RAISE NOTICE 'Constraints and indexes removed';
  RAISE NOTICE 'Verify application functionality';
END $;
