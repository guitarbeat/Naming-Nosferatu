-- Comprehensive Database Maintenance Script
-- Run this periodically to maintain optimal database performance

-- ============================================
-- 1. VACUUM ANALYZE - Reclaim space and update statistics
-- ============================================

VACUUM ANALYZE cat_app_users;
VACUUM ANALYZE cat_name_options;
VACUUM ANALYZE cat_name_ratings;
VACUUM ANALYZE tournament_selections;
VACUUM ANALYZE user_roles;
VACUUM ANALYZE audit_log;
VACUUM ANALYZE site_settings;

-- ============================================
-- 2. REINDEX - Rebuild indexes to remove bloat
-- ============================================

-- Reindex all tables (can be done concurrently in production)
REINDEX TABLE CONCURRENTLY cat_app_users;
REINDEX TABLE CONCURRENTLY cat_name_options;
REINDEX TABLE CONCURRENTLY cat_name_ratings;
REINDEX TABLE CONCURRENTLY tournament_selections;
REINDEX TABLE CONCURRENTLY user_roles;
REINDEX TABLE CONCURRENTLY audit_log;
REINDEX TABLE CONCURRENTLY site_settings;

-- ============================================
-- 3. UPDATE STATISTICS - Ensure query planner has accurate data
-- ============================================

ANALYZE cat_app_users;
ANALYZE cat_name_options;
ANALYZE cat_name_ratings;
ANALYZE tournament_selections;
ANALYZE user_roles;
ANALYZE audit_log;
ANALYZE site_settings;

-- ============================================
-- 4. CHECK FOR BLOAT
-- ============================================

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_percent,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- 5. INDEX USAGE STATISTICS
-- ============================================

SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================
-- 6. UNUSED INDEXES (candidates for removal)
-- ============================================

SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexrelid NOT IN (
        SELECT indexrelid FROM pg_index WHERE indisprimary OR indisunique
    )
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- 7. TABLE STATISTICS
-- ============================================

SELECT
    schemaname,
    tablename,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;
