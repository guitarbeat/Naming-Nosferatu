# Database Monitoring Guide

This guide explains how to monitor and maintain optimal database performance for the Name Nosferatu application.

## Monitoring Tools

### 1. Database Performance Monitor

Run the monitoring script to check current database health:

```bash
node scripts/monitor-database.js
```

This script provides:
- Database connectivity status
- Table row counts
- Query performance tests
- Index effectiveness analysis
- Performance recommendations

### 2. Database Maintenance Report

Check for bloat and maintenance needs:

```bash
node scripts/database-maintenance.js
```

This script reports on:
- Table sizes and row counts
- Table bloat detection
- Unused index identification
- Maintenance recommendations

## Key Performance Indicators

### Query Performance Targets

| Query Type | Target | Warning | Critical |
|------------|--------|---------|----------|
| Leaderboard | <100ms | 100-200ms | >200ms |
| User Stats | <50ms | 50-100ms | >100ms |
| Tournament List | <75ms | 75-150ms | >150ms |
| Name Lookup | <25ms | 25-50ms | >50ms |

### Index Usage

Monitor these critical indexes:

1. **idx_ratings_leaderboard** (cat_name_ratings)
   - Covers: avg_rating, total_ratings, name_id
   - Used by: Leaderboard queries
   - Expected scans: High

2. **idx_ratings_user_stats** (cat_name_ratings)
   - Covers: user_name, rating, wins, losses
   - Used by: User statistics queries
   - Expected scans: Medium

3. **idx_tournament_user_recent** (tournament_selections)
   - Covers: user_name, selected_at
   - Used by: Tournament history queries
   - Expected scans: Medium

## Monitoring Procedures

### Daily Monitoring

1. **Check Query Performance**
   ```bash
   node scripts/monitor-database.js
   ```
   - Review slow queries (>100ms)
   - Check for errors
   - Verify index usage

2. **Review Application Logs**
   - Look for database errors
   - Check for slow query warnings
   - Monitor connection pool usage

### Weekly Monitoring

1. **Run Maintenance Report**
   ```bash
   node scripts/database-maintenance.js
   ```
   - Check table bloat
   - Review index usage
   - Identify optimization opportunities

2. **Analyze Performance Trends**
   - Compare with baseline metrics
   - Track query time trends
   - Monitor database growth

### Monthly Monitoring

1. **Deep Performance Analysis**
   - Run full performance benchmark
   - Review all query plans with EXPLAIN ANALYZE
   - Identify missing indexes

2. **Capacity Planning**
   - Review database size growth
   - Check connection limits
   - Plan for scaling needs

## Slow Query Detection

### Enabling Slow Query Logging

In Supabase Dashboard:
1. Go to Settings > Database
2. Enable slow query logging
3. Set threshold to 100ms

### Analyzing Slow Queries

When a slow query is detected:

1. **Get the query plan**
   ```sql
   EXPLAIN ANALYZE <your_query>;
   ```

2. **Check for missing indexes**
   - Look for "Seq Scan" in query plan
   - Identify frequently filtered columns
   - Consider adding covering indexes

3. **Optimize the query**
   - Add appropriate WHERE clauses
   - Use LIMIT for large result sets
   - Consider query restructuring

## Index Management

### Checking Index Usage

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Identifying Unused Indexes

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelid NOT IN (
    SELECT indexrelid FROM pg_index WHERE indisprimary
  )
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Rebuilding Indexes

When indexes become fragmented:

```sql
-- Rebuild specific index
REINDEX INDEX idx_ratings_leaderboard;

-- Rebuild all indexes on a table
REINDEX TABLE cat_name_ratings;

-- Rebuild all indexes (requires downtime)
REINDEX DATABASE postgres;
```

## Table Maintenance

### Checking Table Bloat

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS external_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Running VACUUM ANALYZE

```sql
-- Vacuum and analyze specific table
VACUUM ANALYZE cat_name_ratings;

-- Vacuum all tables
VACUUM ANALYZE;

-- Full vacuum (requires exclusive lock, use during maintenance window)
VACUUM FULL ANALYZE cat_name_ratings;
```

### Maintenance Schedule

| Operation | Frequency | Downtime | Notes |
|-----------|-----------|----------|-------|
| VACUUM ANALYZE | Weekly | None | Can run during normal operation |
| REINDEX | Monthly | Brief locks | Run during low-traffic periods |
| VACUUM FULL | Quarterly | Exclusive lock | Requires maintenance window |

## Performance Tuning

### Query Optimization Checklist

- [ ] Use appropriate indexes
- [ ] Limit result sets with WHERE clauses
- [ ] Use pagination for large datasets
- [ ] Avoid SELECT * when possible
- [ ] Use covering indexes to avoid table lookups
- [ ] Consider materialized views for complex aggregations
- [ ] Use prepared statements to reduce parsing overhead

### Index Optimization Checklist

- [ ] Create indexes on frequently filtered columns
- [ ] Use covering indexes for common queries
- [ ] Remove unused indexes
- [ ] Rebuild fragmented indexes
- [ ] Monitor index bloat
- [ ] Use partial indexes for subset queries

### Table Optimization Checklist

- [ ] Run VACUUM ANALYZE regularly
- [ ] Monitor table bloat
- [ ] Use appropriate data types
- [ ] Normalize data where appropriate
- [ ] Denormalize for performance when needed
- [ ] Archive old data

## Alerting and Notifications

### Critical Alerts

Set up alerts for:
- Query time > 200ms
- Database connection errors
- Table bloat > 30%
- Disk space < 20%
- Connection pool exhaustion

### Warning Alerts

Set up warnings for:
- Query time > 100ms
- Table bloat > 20%
- Unused indexes > 100MB
- Disk space < 40%
- High connection count

## Troubleshooting

### Slow Queries

**Symptom**: Queries taking longer than expected

**Diagnosis**:
1. Run EXPLAIN ANALYZE on the query
2. Check for sequential scans
3. Verify index usage
4. Check table statistics

**Solutions**:
- Add missing indexes
- Update table statistics with ANALYZE
- Optimize query structure
- Consider query caching

### High Database Load

**Symptom**: Overall database performance degradation

**Diagnosis**:
1. Check active connections
2. Review slow query log
3. Monitor CPU and memory usage
4. Check for lock contention

**Solutions**:
- Optimize slow queries
- Increase connection pool size
- Scale database resources
- Implement query caching

### Table Bloat

**Symptom**: Tables consuming excessive disk space

**Diagnosis**:
1. Run bloat check query
2. Check autovacuum settings
3. Review UPDATE/DELETE patterns

**Solutions**:
- Run VACUUM ANALYZE
- Schedule VACUUM FULL during maintenance window
- Adjust autovacuum settings
- Consider partitioning large tables

## Best Practices

1. **Regular Monitoring**
   - Run monitoring scripts daily
   - Review performance trends weekly
   - Conduct deep analysis monthly

2. **Proactive Maintenance**
   - Schedule regular VACUUM ANALYZE
   - Rebuild indexes periodically
   - Archive old data

3. **Performance Testing**
   - Benchmark before and after changes
   - Test with realistic data volumes
   - Simulate production load

4. **Documentation**
   - Document all schema changes
   - Record performance baselines
   - Track optimization efforts

5. **Continuous Improvement**
   - Review slow queries regularly
   - Optimize based on actual usage patterns
   - Stay updated on PostgreSQL best practices
