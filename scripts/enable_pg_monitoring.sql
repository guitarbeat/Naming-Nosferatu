-- Enable PostgreSQL Performance Monitoring
-- This script enables various PostgreSQL extensions and settings for performance monitoring

-- ===== Enable pg_stat_statements Extension =====
-- This extension tracks execution statistics of all SQL statements

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Reset statistics to start fresh
SELECT pg_stat_statements_reset();

-- ===== Create Performance Monitoring Views =====

-- View: Slow Queries
CREATE OR REPLACE VIEW performance_slow_queries AS
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  stddev_exec_time,
  rows
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries averaging > 100ms
ORDER BY mean_exec_time DESC
LIMIT 50;

COMMENT ON VIEW performance_slow_queries IS 'Queries with mean execution time > 100ms';

-- View: Most Called Queries
CREATE OR REPLACE VIEW performance_frequent_queries AS
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 50;

COMMENT ON VIEW performance_frequent_queries IS 'Most frequently called queries';

-- View: Table Statistics
CREATE OR REPLACE VIEW performance_table_stats AS
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

COMMENT ON VIEW performance_table_stats IS 'Table access statistics';

-- View: Index Usage
CREATE OR REPLACE VIEW performance_index_usage AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;  -- Unused indexes first

COMMENT ON VIEW performance_index_usage IS 'Index usage statistics (unused indexes first)';

-- View: Table Sizes
CREATE OR REPLACE VIEW performance_table_sizes AS
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

COMMENT ON VIEW performance_table_sizes IS 'Table and index sizes';

-- View: Cache Hit Ratio
CREATE OR REPLACE VIEW performance_cache_hit_ratio AS
SELECT 
  'index hit rate' as metric,
  CASE 
    WHEN sum(idx_blks_hit) + sum(idx_blks_read) = 0 THEN 0
    ELSE round(sum(idx_blks_hit) / (sum(idx_blks_hit) + sum(idx_blks_read)) * 100, 2)
  END as percentage
FROM pg_statio_user_indexes
UNION ALL
SELECT 
  'table hit rate' as metric,
  CASE 
    WHEN sum(heap_blks_hit) + sum(heap_blks_read) = 0 THEN 0
    ELSE round(sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100, 2)
  END as percentage
FROM pg_statio_user_tables;

COMMENT ON VIEW performance_cache_hit_ratio IS 'Cache hit ratios (should be > 95%)';

-- ===== Create Performance Monitoring Functions =====

-- Function: Get Query Performance
CREATE OR REPLACE FUNCTION get_query_performance(query_pattern TEXT)
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION,
  max_time DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $
  SELECT 
    query,
    calls,
    total_exec_time as total_time,
    mean_exec_time as mean_time,
    max_exec_time as max_time
  FROM pg_stat_statements
  WHERE query ILIKE '%' || query_pattern || '%'
  ORDER BY mean_exec_time DESC;
$;

COMMENT ON FUNCTION get_query_performance(TEXT) IS 'Get performance stats for queries matching pattern';

-- Function: Get Table Bloat
CREATE OR REPLACE FUNCTION get_table_bloat()
RETURNS TABLE (
  tablename TEXT,
  bloat_ratio NUMERIC,
  bloat_size TEXT
)
LANGUAGE SQL
STABLE
AS $
  SELECT 
    tablename::TEXT,
    CASE 
      WHEN n_live_tup = 0 THEN 0
      ELSE round((n_dead_tup::NUMERIC / n_live_tup) * 100, 2)
    END as bloat_ratio,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as bloat_size
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
    AND n_dead_tup > 0
  ORDER BY n_dead_tup DESC;
$;

COMMENT ON FUNCTION get_table_bloat() IS 'Get table bloat statistics';

-- Function: Analyze Query Plan
CREATE OR REPLACE FUNCTION analyze_query(query_text TEXT)
RETURNS TABLE (
  plan TEXT
)
LANGUAGE plpgsql
AS $
DECLARE
  plan_output TEXT;
BEGIN
  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ' || query_text INTO plan_output;
  RETURN QUERY SELECT plan_output;
END;
$;

COMMENT ON FUNCTION analyze_query(TEXT) IS 'Get EXPLAIN ANALYZE output for a query';

-- ===== Grant Permissions =====

GRANT SELECT ON performance_slow_queries TO authenticated, anon;
GRANT SELECT ON performance_frequent_queries TO authenticated, anon;
GRANT SELECT ON performance_table_stats TO authenticated, anon;
GRANT SELECT ON performance_index_usage TO authenticated, anon;
GRANT SELECT ON performance_table_sizes TO authenticated, anon;
GRANT SELECT ON performance_cache_hit_ratio TO authenticated, anon;

GRANT EXECUTE ON FUNCTION get_query_performance(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_table_bloat() TO authenticated, anon;

-- ===== Create Performance Monitoring Dashboard Query =====

-- This query provides a quick overview of database performance
CREATE OR REPLACE VIEW performance_dashboard AS
SELECT 
  'Database Size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value,
  'info' as status
UNION ALL
SELECT 
  'Active Connections',
  count(*)::TEXT,
  CASE WHEN count(*) > 80 THEN 'warning' ELSE 'ok' END
FROM pg_stat_activity
WHERE state = 'active'
UNION ALL
SELECT 
  'Slow Queries (>100ms)',
  count(*)::TEXT,
  CASE WHEN count(*) > 10 THEN 'warning' ELSE 'ok' END
FROM pg_stat_statements
WHERE mean_exec_time > 100
UNION ALL
SELECT 
  'Unused Indexes',
  count(*)::TEXT,
  CASE WHEN count(*) > 5 THEN 'warning' ELSE 'ok' END
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND idx_scan = 0
UNION ALL
SELECT 
  'Tables Needing VACUUM',
  count(*)::TEXT,
  CASE WHEN count(*) > 3 THEN 'warning' ELSE 'ok' END
FROM pg_stat_user_tables
WHERE schemaname = 'public' 
  AND n_dead_tup > 1000;

COMMENT ON VIEW performance_dashboard IS 'Quick performance overview';

-- ===== Helpful Queries for Manual Monitoring =====

-- Query to find missing indexes
COMMENT ON SCHEMA public IS '
Helpful Performance Queries:

1. Find tables with sequential scans:
   SELECT * FROM performance_table_stats WHERE seq_scan > idx_scan;

2. Find unused indexes:
   SELECT * FROM performance_index_usage WHERE idx_scan = 0;

3. Find slow queries:
   SELECT * FROM performance_slow_queries;

4. Check cache hit ratio:
   SELECT * FROM performance_cache_hit_ratio;

5. Find table bloat:
   SELECT * FROM get_table_bloat();

6. Analyze specific query:
   SELECT * FROM get_query_performance(''cat_name_ratings'');
';

-- ===== Success Message =====

DO $
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Performance Monitoring Enabled';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Available views:';
  RAISE NOTICE '  - performance_dashboard';
  RAISE NOTICE '  - performance_slow_queries';
  RAISE NOTICE '  - performance_frequent_queries';
  RAISE NOTICE '  - performance_table_stats';
  RAISE NOTICE '  - performance_index_usage';
  RAISE NOTICE '  - performance_table_sizes';
  RAISE NOTICE '  - performance_cache_hit_ratio';
  RAISE NOTICE '';
  RAISE NOTICE 'Available functions:';
  RAISE NOTICE '  - get_query_performance(pattern)';
  RAISE NOTICE '  - get_table_bloat()';
  RAISE NOTICE '';
  RAISE NOTICE 'Quick check: SELECT * FROM performance_dashboard;';
END $;
