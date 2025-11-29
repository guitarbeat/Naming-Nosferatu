-- Enable Slow Query Logging
-- This helps identify queries that need optimization

-- Note: These settings may require superuser privileges
-- On Supabase, some settings are managed through the dashboard

-- Log queries slower than 100ms
ALTER DATABASE postgres SET log_min_duration_statement = 100;

-- Log query execution plans for slow queries
ALTER DATABASE postgres SET auto_explain.log_min_duration = 100;

-- Enable auto_explain extension if not already enabled
CREATE EXTENSION IF NOT EXISTS auto_explain;

-- Configure auto_explain settings
ALTER DATABASE postgres SET auto_explain.log_analyze = true;
ALTER DATABASE postgres SET auto_explain.log_buffers = true;
ALTER DATABASE postgres SET auto_explain.log_timing = true;
ALTER DATABASE postgres SET auto_explain.log_triggers = true;
ALTER DATABASE postgres SET auto_explain.log_verbose = false;
ALTER DATABASE postgres SET auto_explain.log_nested_statements = true;

-- View current slow query settings
SELECT name, setting, unit, context 
FROM pg_settings 
WHERE name IN (
    'log_min_duration_statement',
    'auto_explain.log_min_duration',
    'auto_explain.log_analyze',
    'auto_explain.log_buffers'
)
ORDER BY name;

-- Query to find slow queries from pg_stat_statements
-- (requires pg_stat_statements extension)
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    stddev_exec_time,
    rows
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- queries averaging over 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;
