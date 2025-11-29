-- Migration: Phase 5 - Remove Unused Columns
-- Part of Supabase Backend Optimization
-- This migration removes legacy columns that are no longer used

-- ⚠️  WARNING: This is a DESTRUCTIVE migration!
-- ⚠️  Data in these columns will be PERMANENTLY DELETED!
-- ⚠️  BACKUP REQUIRED before running!

-- ===== BACKUP REMINDER =====
-- STOP! Before running this migration:
-- 1. Create backup: ./scripts/create_backup.sh phase5_before_drop
-- 2. Verify Phase 3 migration completed successfully
-- 3. Verify application works with new data structure
-- 4. Test rollback procedure on staging

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚠️  DESTRUCTIVE MIGRATION WARNING ⚠️';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'This migration will PERMANENTLY DELETE:';
  RAISE NOTICE '  - cat_app_users.tournament_data';
  RAISE NOTICE '  - cat_app_users.user_role';
  RAISE NOTICE '  - cat_name_options.user_name';
  RAISE NOTICE '  - cat_name_options.popularity_score';
  RAISE NOTICE '  - cat_name_options.total_tournaments';
  RAISE NOTICE '  - cat_name_options.is_hidden';
  RAISE NOTICE '';
  RAISE NOTICE 'Ensure you have a backup before proceeding!';
  RAISE NOTICE '';
END $;

-- ===== PRE-DROP VERIFICATION =====

DO $
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Pre-Drop Verification';
  RAISE NOTICE '========================================';
END $;

-- Verify Phase 3 migration completed
DO $
DECLARE
  users_with_roles INTEGER;
  tournaments_in_table INTEGER;
BEGIN
  -- Check role migration
  SELECT COUNT(DISTINCT user_name) INTO users_with_roles
  FROM user_roles;

  -- Check tournament migration
  SELECT COUNT(*) INTO tournaments_in_table
  FROM tournament_selections;

  RAISE NOTICE 'Users with roles in user_roles: %', users_with_roles;
  RAISE NOTICE 'Tournaments in tournament_selections: %', tournaments_in_table;

  IF users_with_roles = 0 THEN
    RAISE EXCEPTION 'Role migration not complete! Run Phase 3 first.';
  END IF;

  IF tournaments_in_table = 0 THEN
    RAISE WARNING 'No tournaments in tournament_selections table';
    RAISE WARNING 'Verify this is expected before proceeding';
  END IF;

  RAISE NOTICE '✓ Phase 3 migration appears complete';
END $;

-- ===== BACKUP DATA FOR ROLLBACK =====

-- Create backup tables (in case we need to rollback)
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Creating backup tables...';
END $;

-- Backup tournament_data
CREATE TABLE IF NOT EXISTS _backup_tournament_data AS
SELECT user_name, tournament_data, updated_at
FROM cat_app_users
WHERE tournament_data IS NOT NULL;

-- Backup user_role
CREATE TABLE IF NOT EXISTS _backup_user_role AS
SELECT user_name, user_role, updated_at
FROM cat_app_users
WHERE user_role IS NOT NULL;

-- Backup cat_name_options columns
CREATE TABLE IF NOT EXISTS _backup_cat_name_options_columns AS
SELECT id, user_name, popularity_score, total_tournaments, is_hidden
FROM cat_name_options;

DO $
DECLARE
  backup_tournament_count INTEGER;
  backup_role_count INTEGER;
  backup_name_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_tournament_count FROM _backup_tournament_data;
  SELECT COUNT(*) INTO backup_role_count FROM _backup_user_role;
  SELECT COUNT(*) INTO backup_name_count FROM _backup_cat_name_options_columns;

  RAISE NOTICE '✓ Backup tables created:';
  RAISE NOTICE '  - _backup_tournament_data: % rows', backup_tournament_count;
  RAISE NOTICE '  - _backup_user_role: % rows', backup_role_count;
  RAISE NOTICE '  - _backup_cat_name_options_columns: % rows', backup_name_count;
  RAISE NOTICE '';
  RAISE NOTICE 'These tables can be used for rollback if needed';
END $;

-- ===== DROP INDEXES FIRST =====

DO $
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Dropping Related Indexes';
  RAISE NOTICE '========================================';
END $;

-- Drop indexes on columns we're about to drop
DROP INDEX IF EXISTS idx_cat_app_users_tournament_data;
DROP INDEX IF EXISTS idx_cat_app_users_tournament_recent;

RAISE NOTICE '✓ Dropped indexes on tournament_data';

-- ===== DROP CONSTRAINTS =====

-- Drop constraints on columns we're about to drop
ALTER TABLE cat_app_users 
DROP CONSTRAINT IF EXISTS check_tournament_data_json;

ALTER TABLE cat_app_users 
DROP CONSTRAINT IF EXISTS check_user_role_valid;

RAISE NOTICE '✓ Dropped constraints on columns to be removed';

-- ===== DROP COLUMNS FROM cat_app_users =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Dropping cat_app_users Columns';
  RAISE NOTICE '========================================';
END $;

-- Drop tournament_data column
ALTER TABLE cat_app_users 
DROP COLUMN IF EXISTS tournament_data;

RAISE NOTICE '✓ Dropped cat_app_users.tournament_data';

-- Drop user_role column
ALTER TABLE cat_app_users 
DROP COLUMN IF EXISTS user_role;

RAISE NOTICE '✓ Dropped cat_app_users.user_role';

-- ===== DROP COLUMNS FROM cat_name_options =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Dropping cat_name_options Columns';
  RAISE NOTICE '========================================';
END $;

-- Drop user_name column (names are global, not user-specific)
ALTER TABLE cat_name_options 
DROP COLUMN IF EXISTS user_name;

RAISE NOTICE '✓ Dropped cat_name_options.user_name';

-- Drop popularity_score column (calculated, not stored)
ALTER TABLE cat_name_options 
DROP COLUMN IF EXISTS popularity_score;

RAISE NOTICE '✓ Dropped cat_name_options.popularity_score';

-- Drop total_tournaments column (calculated, not stored)
ALTER TABLE cat_name_options 
DROP COLUMN IF EXISTS total_tournaments;

RAISE NOTICE '✓ Dropped cat_name_options.total_tournaments';

-- Drop is_hidden column (use is_active instead)
ALTER TABLE cat_name_options 
DROP COLUMN IF EXISTS is_hidden;

RAISE NOTICE '✓ Dropped cat_name_options.is_hidden';

-- ===== VERIFY COLUMNS DROPPED =====

DO $
DECLARE
  remaining_columns TEXT[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Verification';
  RAISE NOTICE '========================================';

  -- Check cat_app_users
  SELECT array_agg(column_name) INTO remaining_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'cat_app_users'
    AND column_name IN ('tournament_data', 'user_role');

  IF remaining_columns IS NULL OR array_length(remaining_columns, 1) IS NULL THEN
    RAISE NOTICE '✓ cat_app_users: All target columns dropped';
  ELSE
    RAISE WARNING '❌ cat_app_users: Columns still exist: %', remaining_columns;
  END IF;

  -- Check cat_name_options
  SELECT array_agg(column_name) INTO remaining_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'cat_name_options'
    AND column_name IN ('user_name', 'popularity_score', 'total_tournaments', 'is_hidden');

  IF remaining_columns IS NULL OR array_length(remaining_columns, 1) IS NULL THEN
    RAISE NOTICE '✓ cat_name_options: All target columns dropped';
  ELSE
    RAISE WARNING '❌ cat_name_options: Columns still exist: %', remaining_columns;
  END IF;
END $;

-- ===== SHOW REMAINING COLUMNS =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining columns in cat_app_users:';
END $;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cat_app_users'
ORDER BY ordinal_position;

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining columns in cat_name_options:';
END $;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cat_name_options'
ORDER BY ordinal_position;

-- ===== CALCULATE SPACE SAVINGS =====

DO $
DECLARE
  cat_app_users_size TEXT;
  cat_name_options_size TEXT;
BEGIN
  SELECT pg_size_pretty(pg_total_relation_size('cat_app_users')) INTO cat_app_users_size;
  SELECT pg_size_pretty(pg_total_relation_size('cat_name_options')) INTO cat_name_options_size;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table Sizes After Column Removal';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'cat_app_users: %', cat_app_users_size;
  RAISE NOTICE 'cat_name_options: %', cat_name_options_size;
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Run VACUUM FULL to reclaim disk space';
END $;

-- ===== STATISTICS =====

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 5: Unused Columns Removed';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Removed from cat_app_users:';
  RAISE NOTICE '  ✓ tournament_data (JSONB)';
  RAISE NOTICE '  ✓ user_role (VARCHAR)';
  RAISE NOTICE '';
  RAISE NOTICE 'Removed from cat_name_options:';
  RAISE NOTICE '  ✓ user_name (VARCHAR)';
  RAISE NOTICE '  ✓ popularity_score (INTEGER)';
  RAISE NOTICE '  ✓ total_tournaments (INTEGER)';
  RAISE NOTICE '  ✓ is_hidden (BOOLEAN)';
  RAISE NOTICE '';
  RAISE NOTICE 'Backup tables created for rollback:';
  RAISE NOTICE '  - _backup_tournament_data';
  RAISE NOTICE '  - _backup_user_role';
  RAISE NOTICE '  - _backup_cat_name_options_columns';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  To rollback, restore from backup tables';
  RAISE NOTICE '⚠️  Backup tables will be kept for 30 days';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Remove unused database objects (Phase 5.2)';
END $;
