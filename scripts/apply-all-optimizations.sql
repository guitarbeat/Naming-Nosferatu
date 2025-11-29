-- ============================================
-- Supabase Backend Optimization - Complete Migration Script
-- ============================================
-- This script applies all optimization migrations in order
-- Run this on a fresh database or after backing up existing data
--
-- Phases:
-- 1. Analysis & Preparation (manual)
-- 2. Add Constraints (Non-Breaking)
-- 3. Data Migration
-- 4. Update Functions & Policies
-- 5. Remove Legacy Code
-- 6. Update Application Code (manual)
-- 7. Optimization (manual)
-- ============================================

\echo '============================================'
\echo 'Starting Supabase Backend Optimization'
\echo '============================================'

-- ============================================
-- PHASE 2: Add Constraints (Non-Breaking)
-- ============================================

\echo ''
\echo 'PHASE 2: Adding Constraints...'

-- Migration 20251129000001: Add Unique Constraints
\echo '  - Adding unique constraints...'

ALTER TABLE cat_name_ratings
ADD CONSTRAINT cat_name_ratings_user_name_name_id_key 
UNIQUE (user_name, name_id);

-- Migration 20251129000002: Add Check Constraints
\echo '  - Adding check constraints...'

ALTER TABLE cat_name_options
ADD CONSTRAINT cat_name_options_name_length_check 
CHECK (length(name) >= 1 AND length(name) <= 100);

ALTER TABLE cat_name_ratings
ADD CONSTRAINT cat_name_ratings_rating_range_check 
CHECK (rating IS NULL OR (rating >= 0 AND rating <= 3000));

ALTER TABLE cat_name_ratings
ADD CONSTRAINT cat_name_ratings_wins_non_negative_check 
CHECK (wins >= 0);

ALTER TABLE cat_name_ratings
ADD CONSTRAINT cat_name_ratings_losses_non_negative_check 
CHECK (losses >= 0);

-- Migration 20251129000003: Add Indexes
\echo '  - Adding performance indexes...'

CREATE INDEX IF NOT EXISTS idx_ratings_leaderboard 
ON cat_name_ratings (name_id, rating DESC, wins DESC) 
WHERE rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ratings_user_stats 
ON cat_name_ratings (user_name, rating, wins, losses) 
WHERE rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tournament_user_recent 
ON tournament_selections (user_name, selected_at DESC);

\echo 'PHASE 2: Complete ✓'

-- ============================================
-- PHASE 3: Data Migration
-- ============================================

\echo ''
\echo 'PHASE 3: Migrating Data...'

-- Migration 20251129000004: Migrate Role Data
\echo '  - Migrating role data...'

INSERT INTO user_roles (user_name, role)
SELECT 
    user_name,
    CASE 
        WHEN user_role = 'admin' THEN 'admin'::app_role
        ELSE 'user'::app_role
    END as role
FROM cat_app_users
WHERE user_role IS NOT NULL
ON CONFLICT (user_name, role) DO NOTHING;

-- Migration 20251129000005: Migrate Tournament Data
\echo '  - Migrating tournament data...'

-- Note: This assumes tournament_data JSONB has been extracted
-- If you have existing tournament_data, you'll need to extract it first
-- See scripts/export_data.js for extraction logic

\echo 'PHASE 3: Complete ✓'

-- ============================================
-- PHASE 4: Update Functions & Policies
-- ============================================

\echo ''
\echo 'PHASE 4: Updating Functions and Policies...'

-- Migration 20251129000006: Update Role Functions
\echo '  - Updating role functions...'

CREATE OR REPLACE FUNCTION has_role(required_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_name = get_current_user_name()
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role('admin'::app_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS app_role AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_name = get_current_user_name()
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user'::app_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Migration 20251129000007: Simplify RLS Policies
\echo '  - Simplifying RLS policies...'

-- cat_name_options policies
DROP POLICY IF EXISTS "Anyone can view active names" ON cat_name_options;
DROP POLICY IF EXISTS "Users can view active names" ON cat_name_options;
DROP POLICY IF EXISTS "Admins can manage all names" ON cat_name_options;
DROP POLICY IF EXISTS "Users can suggest names" ON cat_name_options;

CREATE POLICY "public_read" ON cat_name_options
FOR SELECT TO public
USING (is_active = true);

CREATE POLICY "admin_all" ON cat_name_options
FOR ALL TO public
USING (is_admin());

CREATE POLICY "user_suggest" ON cat_name_options
FOR INSERT TO public
WITH CHECK (true);

-- cat_name_ratings policies
DROP POLICY IF EXISTS "Users can manage own ratings" ON cat_name_ratings;
DROP POLICY IF EXISTS "Admins can manage all ratings" ON cat_name_ratings;

CREATE POLICY "user_own_data" ON cat_name_ratings
FOR ALL TO public
USING (user_name = get_current_user_name());

CREATE POLICY "admin_all" ON cat_name_ratings
FOR ALL TO public
USING (is_admin());

-- cat_app_users policies
DROP POLICY IF EXISTS "Users can manage own account" ON cat_app_users;
DROP POLICY IF EXISTS "Admins can manage all accounts" ON cat_app_users;

CREATE POLICY "user_own_data" ON cat_app_users
FOR ALL TO public
USING (user_name = get_current_user_name());

CREATE POLICY "admin_all" ON cat_app_users
FOR ALL TO public
USING (is_admin());

-- tournament_selections policies
DROP POLICY IF EXISTS "Users can manage own tournaments" ON tournament_selections;
DROP POLICY IF EXISTS "Admins can manage all tournaments" ON tournament_selections;

CREATE POLICY "user_own_data" ON tournament_selections
FOR ALL TO public
USING (user_name = get_current_user_name());

CREATE POLICY "admin_all" ON tournament_selections
FOR ALL TO public
USING (is_admin());

\echo 'PHASE 4: Complete ✓'

-- ============================================
-- PHASE 5: Remove Legacy Code
-- ============================================

\echo ''
\echo 'PHASE 5: Removing Legacy Code...'

-- Migration 20251129000008: Remove Unused Columns
\echo '  - Removing unused columns...'

ALTER TABLE cat_app_users DROP COLUMN IF EXISTS tournament_data;
ALTER TABLE cat_app_users DROP COLUMN IF EXISTS user_role;
ALTER TABLE cat_name_options DROP COLUMN IF EXISTS user_name;
ALTER TABLE cat_name_options DROP COLUMN IF EXISTS popularity_score;
ALTER TABLE cat_name_options DROP COLUMN IF EXISTS total_tournaments;

-- Migration 20251129000009: Remove Unused Objects
\echo '  - Removing unused database objects...'

DROP MATERIALIZED VIEW IF EXISTS leaderboard_stats CASCADE;
DROP FUNCTION IF EXISTS increment_selection(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS refresh_materialized_views() CASCADE;

-- Remove unused indexes
DROP INDEX IF EXISTS idx_cat_app_users_user_role;
DROP INDEX IF EXISTS idx_cat_app_users_tournament_data;
DROP INDEX IF EXISTS idx_cat_app_users_tournament_recent;
DROP INDEX IF EXISTS idx_leaderboard_stats_rating;

\echo 'PHASE 5: Complete ✓'

-- ============================================
-- PHASE 7: Optimization
-- ============================================

\echo ''
\echo 'PHASE 7: Running Optimization...'

\echo '  - Running VACUUM ANALYZE...'
VACUUM ANALYZE cat_app_users;
VACUUM ANALYZE cat_name_options;
VACUUM ANALYZE cat_name_ratings;
VACUUM ANALYZE tournament_selections;
VACUUM ANALYZE user_roles;
VACUUM ANALYZE audit_log;
VACUUM ANALYZE site_settings;

\echo '  - Rebuilding indexes...'
REINDEX TABLE CONCURRENTLY cat_app_users;
REINDEX TABLE CONCURRENTLY cat_name_options;
REINDEX TABLE CONCURRENTLY cat_name_ratings;
REINDEX TABLE CONCURRENTLY tournament_selections;
REINDEX TABLE CONCURRENTLY user_roles;

\echo 'PHASE 7: Complete ✓'

-- ============================================
-- Verification
-- ============================================

\echo ''
\echo '============================================'
\echo 'Verification'
\echo '============================================'

\echo ''
\echo 'Table Statistics:'
SELECT 
    schemaname,
    relname as tablename,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

\echo ''
\echo '============================================'
\echo 'Migration Complete!'
\echo '============================================'
\echo ''
\echo 'Next Steps:'
\echo '1. Update application code (Phase 6)'
\echo '2. Run test suite to verify functionality'
\echo '3. Monitor performance metrics'
\echo '4. Review RLS policies with test users'
\echo ''
\echo 'See MIGRATION_GUIDE.md for detailed instructions'
\echo '============================================'
