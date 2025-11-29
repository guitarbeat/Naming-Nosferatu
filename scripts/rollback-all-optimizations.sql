-- ============================================
-- Supabase Backend Optimization - Complete Rollback Script
-- ============================================
-- This script rolls back all optimization migrations
-- WARNING: This will restore the old schema structure
-- Make sure you have a backup before running this!
--
-- Rollback Order (reverse of migration):
-- 7. Restore optimization state
-- 5. Restore legacy code
-- 4. Restore old functions & policies
-- 3. Restore old data structure
-- 2. Remove new constraints
-- ============================================

\echo '============================================'
\echo 'Rolling Back Supabase Backend Optimization'
\echo 'WARNING: This will restore the old schema!'
\echo '============================================'

-- ============================================
-- PHASE 5 ROLLBACK: Restore Legacy Code
-- ============================================

\echo ''
\echo 'PHASE 5 ROLLBACK: Restoring Legacy Code...'

-- Restore removed columns
\echo '  - Restoring removed columns...'

ALTER TABLE cat_app_users 
ADD COLUMN IF NOT EXISTS tournament_data JSONB;

ALTER TABLE cat_app_users 
ADD COLUMN IF NOT EXISTS user_role VARCHAR;

ALTER TABLE cat_name_options 
ADD COLUMN IF NOT EXISTS user_name TEXT;

ALTER TABLE cat_name_options 
ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0;

ALTER TABLE cat_name_options 
ADD COLUMN IF NOT EXISTS total_tournaments INTEGER DEFAULT 0;

-- Restore materialized view
\echo '  - Restoring materialized view...'

CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_stats AS
SELECT 
    cnr.name_id,
    cno.name,
    cno.description,
    COUNT(cnr.user_name) as total_ratings,
    AVG(cnr.rating) as avg_rating,
    SUM(cnr.wins) as total_wins,
    SUM(cnr.losses) as total_losses
FROM cat_name_ratings cnr
INNER JOIN cat_name_options cno ON cnr.name_id = cno.id
WHERE cnr.rating IS NOT NULL
GROUP BY cnr.name_id, cno.name, cno.description;

CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_rating 
ON leaderboard_stats (avg_rating DESC);

-- Restore increment_selection function
\echo '  - Restoring increment_selection function...'

CREATE OR REPLACE FUNCTION increment_selection(p_name_id TEXT, p_user_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- This was a no-op function, keeping it for compatibility
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Restore refresh function
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Restore old indexes
\echo '  - Restoring old indexes...'

CREATE INDEX IF NOT EXISTS idx_cat_app_users_user_role 
ON cat_app_users (user_role);

CREATE INDEX IF NOT EXISTS idx_cat_app_users_tournament_data 
ON cat_app_users USING GIN (tournament_data);

CREATE INDEX IF NOT EXISTS idx_cat_app_users_tournament_recent 
ON cat_app_users ((tournament_data->'tournaments'));

\echo 'PHASE 5 ROLLBACK: Complete ✓'

-- ============================================
-- PHASE 4 ROLLBACK: Restore Old Functions & Policies
-- ============================================

\echo ''
\echo 'PHASE 4 ROLLBACK: Restoring Old Functions and Policies...'

-- Restore old role functions
\echo '  - Restoring old role functions...'

CREATE OR REPLACE FUNCTION has_role(required_role TEXT, user_name_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cat_app_users
    WHERE user_name = user_name_param
    AND user_role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cat_app_users
    WHERE user_name = get_current_user_name()
    AND user_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT cat_app_users.user_role INTO user_role
  FROM cat_app_users
  WHERE user_name = get_current_user_name()
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Restore old RLS policies
\echo '  - Restoring old RLS policies...'

-- cat_name_options policies
DROP POLICY IF EXISTS "public_read" ON cat_name_options;
DROP POLICY IF EXISTS "admin_all" ON cat_name_options;
DROP POLICY IF EXISTS "user_suggest" ON cat_name_options;

CREATE POLICY "Anyone can view active names" ON cat_name_options
FOR SELECT TO public
USING (is_active = true);

CREATE POLICY "Admins can manage all names" ON cat_name_options
FOR ALL TO public
USING (is_admin());

CREATE POLICY "Users can suggest names" ON cat_name_options
FOR INSERT TO public
WITH CHECK (true);

-- cat_name_ratings policies
DROP POLICY IF EXISTS "user_own_data" ON cat_name_ratings;
DROP POLICY IF EXISTS "admin_all" ON cat_name_ratings;

CREATE POLICY "Users can manage own ratings" ON cat_name_ratings
FOR ALL TO public
USING (user_name = get_current_user_name());

CREATE POLICY "Admins can manage all ratings" ON cat_name_ratings
FOR ALL TO public
USING (is_admin());

-- cat_app_users policies
DROP POLICY IF EXISTS "user_own_data" ON cat_app_users;
DROP POLICY IF EXISTS "admin_all" ON cat_app_users;

CREATE POLICY "Users can manage own account" ON cat_app_users
FOR ALL TO public
USING (user_name = get_current_user_name());

CREATE POLICY "Admins can manage all accounts" ON cat_app_users
FOR ALL TO public
USING (is_admin());

-- tournament_selections policies
DROP POLICY IF EXISTS "user_own_data" ON tournament_selections;
DROP POLICY IF EXISTS "admin_all" ON tournament_selections;

CREATE POLICY "Users can manage own tournaments" ON tournament_selections
FOR ALL TO public
USING (user_name = get_current_user_name());

CREATE POLICY "Admins can manage all tournaments" ON tournament_selections
FOR ALL TO public
USING (is_admin());

\echo 'PHASE 4 ROLLBACK: Complete ✓'

-- ============================================
-- PHASE 3 ROLLBACK: Restore Old Data Structure
-- ============================================

\echo ''
\echo 'PHASE 3 ROLLBACK: Restoring Old Data Structure...'

-- Migrate role data back to cat_app_users
\echo '  - Migrating role data back to cat_app_users...'

UPDATE cat_app_users
SET user_role = ur.role::TEXT
FROM user_roles ur
WHERE cat_app_users.user_name = ur.user_name;

-- Note: Tournament data migration back to JSONB would require
-- custom logic based on your specific data structure
\echo '  - WARNING: Tournament data migration to JSONB not automated'
\echo '  - You may need to manually restore tournament_data from backup'

\echo 'PHASE 3 ROLLBACK: Complete ✓'

-- ============================================
-- PHASE 2 ROLLBACK: Remove New Constraints
-- ============================================

\echo ''
\echo 'PHASE 2 ROLLBACK: Removing New Constraints...'

-- Remove new indexes
\echo '  - Removing new indexes...'

DROP INDEX IF EXISTS idx_ratings_leaderboard;
DROP INDEX IF EXISTS idx_ratings_user_stats;
DROP INDEX IF EXISTS idx_tournament_user_recent;

-- Remove check constraints
\echo '  - Removing check constraints...'

ALTER TABLE cat_name_options
DROP CONSTRAINT IF EXISTS cat_name_options_name_length_check;

ALTER TABLE cat_name_ratings
DROP CONSTRAINT IF EXISTS cat_name_ratings_rating_range_check;

ALTER TABLE cat_name_ratings
DROP CONSTRAINT IF EXISTS cat_name_ratings_wins_non_negative_check;

ALTER TABLE cat_name_ratings
DROP CONSTRAINT IF EXISTS cat_name_ratings_losses_non_negative_check;

-- Remove unique constraints
\echo '  - Removing unique constraints...'

ALTER TABLE cat_name_ratings
DROP CONSTRAINT IF EXISTS cat_name_ratings_user_name_name_id_key;

\echo 'PHASE 2 ROLLBACK: Complete ✓'

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
\echo 'Rollback Complete!'
\echo '============================================'
\echo ''
\echo 'Next Steps:'
\echo '1. Verify data integrity'
\echo '2. Restore tournament_data from backup if needed'
\echo '3. Update application code to use old schema'
\echo '4. Run test suite to verify functionality'
\echo ''
\echo 'WARNING: You may need to manually restore some data'
\echo 'from your backup, especially tournament_data JSONB'
\echo '============================================'
