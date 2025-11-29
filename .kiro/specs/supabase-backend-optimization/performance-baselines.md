# Query Performance Baselines

**Date**: November 29, 2025  
**Purpose**: Document current query performance before optimization to measure improvements

## Overview

This document establishes performance baselines for key database queries in the cat name tournament application. These metrics will be used to validate the 50%+ performance improvement goal after optimization.

## Key Queries Analyzed

### 1. Tournament Data Queries

#### 1.1 Get User Tournaments
**Location**: `tournamentsAPI.getUserTournaments()`  
**Current Implementation**: JSONB scan on `cat_app_users.tournament_data`

```sql
SELECT tournament_data 
FROM cat_app_users 
WHERE user_name = $1
```

**Performance Characteristics**:
- **Query Type**: JSONB column scan
- **Expected Baseline**: ~300-500ms for users with 10+ tournaments
- **Bottleneck**: Full JSONB deserialization required
- **Index Usage**: Primary key on user_name (efficient)
- **Data Volume**: Entire tournament history loaded at once

**Issues**:
- JSONB parsing overhead increases with tournament count
- No ability to filter/paginate at database level
- All tournament data must be transferred to client
- Sorting happens in application code after fetch

#### 1.2 Save Tournament Selections
**Location**: `tournamentsAPI.saveTournamentSelections()`  
**Current Implementation**: Read entire JSONB, modify, write back

```sql
-- Read current data
SELECT tournament_data FROM cat_app_users WHERE user_name = $1;

-- Update with modified array (via RPC)
SELECT update_user_tournament_data($1, $2);
```

**Performance Characteristics**:
- **Query Type**: Read-modify-write on JSONB
- **Expected Baseline**: ~200-400ms
- **Bottleneck**: Full JSONB serialization/deserialization
- **Concurrency**: Potential race conditions with concurrent updates
- **Data Volume**: Entire tournament history read and written

**Issues**:
- Read-modify-write pattern is inefficient
- No atomic operations on individual tournaments
- Risk of data loss with concurrent updates
- Network overhead transferring full JSONB

### 2. Leaderboard Queries

#### 2.1 Get Leaderboard
**Location**: `catNamesAPI.getLeaderboard()`  
**Current Implementation**: Materialized view (never refreshed)

```sql
SELECT * 
FROM leaderboard_stats 
WHERE total_ratings >= $1 
ORDER BY avg_rating DESC 
LIMIT $2
```

**Performance Characteristics**:
- **Query Type**: Materialized view scan
- **Expected Baseline**: ~100-300ms (stale data)
- **Bottleneck**: View never refreshed, data is stale
- **Index Usage**: Likely sequential scan on materialized view
- **Data Accuracy**: Unknown staleness

**Issues**:
- Materialized view is never refreshed (stale data)
- No refresh schedule or trigger
- Users see outdated rankings
- View may not reflect recent ratings

#### 2.2 Get Leaderboard by Category
**Location**: `catNamesAPI.getLeaderboard()` with category filter  
**Current Implementation**: RPC function `get_top_names_by_category`

```sql
SELECT * FROM get_top_names_by_category($1, $2)
```

**Performance Characteristics**:
- **Query Type**: RPC function (implementation unknown)
- **Expected Baseline**: ~200-400ms
- **Bottleneck**: Likely joins categories and aggregates ratings
- **Index Usage**: Unknown

### 3. User Statistics Queries

#### 3.1 Get User Stats (Database Function)
**Location**: `catNamesAPI.getUserStats()`  
**Current Implementation**: RPC function `get_user_stats`

```sql
SELECT * FROM get_user_stats($1)
```

**Performance Characteristics**:
- **Query Type**: RPC function with aggregations
- **Expected Baseline**: ~100-200ms
- **Bottleneck**: Multiple table scans and aggregations
- **Tables Accessed**: 
  - `cat_name_ratings` (user's ratings)
  - `tournament_selections` (user's selections)
  - Possibly `cat_app_users.tournament_data` (JSONB)

**Issues**:
- Function implementation may be inefficient
- Likely performs multiple sequential queries
- No covering indexes for common aggregations

#### 3.2 Calculate Selection Stats (Application)
**Location**: `profileStats.calculateSelectionStats()`  
**Current Implementation**: Fetch all tournaments, process in JavaScript

```javascript
// 1. Fetch all tournaments from JSONB
const tournaments = await tournamentsAPI.getUserTournaments(userName);

// 2. Flatten selections in application code
const selections = tournaments.flatMap(t => 
  (t.selected_names || []).map(n => ({...}))
);

// 3. Calculate stats in JavaScript
// - Count selections, tournaments, unique names
// - Find most selected name
// - Calculate streaks
// - Generate insights
```

**Performance Characteristics**:
- **Query Type**: Single JSONB fetch + client-side processing
- **Expected Baseline**: ~300-500ms (query) + 50-200ms (processing)
- **Bottleneck**: 
  - JSONB deserialization
  - Client-side array operations
  - Multiple passes over data
- **Network**: Full tournament history transferred

**Issues**:
- All processing happens in browser/client
- No database-level aggregations
- Inefficient for users with many tournaments
- Repeated calculations on every page load

### 4. Name Queries

#### 4.1 Get Names with Descriptions
**Location**: `catNamesAPI.getNamesWithDescriptions()`  
**Current Implementation**: Table scan with hidden name filter

```sql
-- Get hidden names
SELECT name_id FROM cat_name_ratings WHERE is_hidden = true;

-- Get active names (excluding hidden)
SELECT id, name, description, created_at, avg_rating, 
       popularity_score, total_tournaments, is_active
FROM cat_name_options
WHERE is_active = true
  AND id NOT IN (...)
ORDER BY avg_rating DESC
```

**Performance Characteristics**:
- **Query Type**: Two queries (hidden names + active names)
- **Expected Baseline**: ~50-150ms
- **Index Usage**: 
  - `idx_cat_name_options_active` (partial index on is_active)
  - Primary key for NOT IN filter
- **Bottleneck**: NOT IN clause with large hidden list

**Issues**:
- Two round trips to database
- NOT IN can be slow with many hidden names
- Partial index may not be optimal

#### 4.2 Get Names with User Ratings
**Location**: `catNamesAPI.getNamesWithUserRatings()`  
**Current Implementation**: Left join with ratings table

```sql
SELECT 
  cno.id, cno.name, cno.description, cno.created_at,
  cno.avg_rating, cno.popularity_score, cno.total_tournaments, cno.is_active,
  cnr.user_name, cnr.rating, cnr.wins, cnr.losses, 
  cnr.is_hidden, cnr.updated_at
FROM cat_name_options cno
LEFT JOIN cat_name_ratings cnr ON cno.id = cnr.name_id
WHERE cno.is_active = true
ORDER BY cno.name
```

**Performance Characteristics**:
- **Query Type**: Left join with filtering
- **Expected Baseline**: ~100-200ms
- **Index Usage**: 
  - Primary key on cat_name_options
  - Foreign key on cat_name_ratings.name_id
- **Data Volume**: All names + all ratings (large result set)

**Issues**:
- Returns all ratings for all users (not filtered by user)
- Client-side filtering to find user's ratings
- Large result set transferred over network
- Inefficient for single-user queries

### 5. Role Check Queries

#### 5.1 Check User Role
**Location**: Various (admin checks throughout app)  
**Current Implementation**: Dual system (table + column)

```sql
-- Option 1: Check user_roles table
SELECT role FROM user_roles WHERE user_name = $1;

-- Option 2: Check cat_app_users.user_role column
SELECT user_role FROM cat_app_users WHERE user_name = $1;
```

**Performance Characteristics**:
- **Query Type**: Primary key lookup
- **Expected Baseline**: ~10-50ms
- **Index Usage**: Primary key (efficient)
- **Bottleneck**: Dual system causes confusion

**Issues**:
- Two sources of truth for roles
- Inconsistency risk
- RLS policies may check wrong source
- Type mismatch (enum vs VARCHAR)

## Performance Targets (Post-Optimization)

Based on the design document, here are the target improvements:

| Query Type | Current Baseline | Target | Improvement |
|------------|------------------|--------|-------------|
| Tournament query | ~500ms | ~50ms | 90% faster |
| Leaderboard query | ~300ms | ~100ms | 67% faster |
| User stats | ~200ms | ~50ms | 75% faster |
| Name queries | ~150ms | ~75ms | 50% faster |
| Role checks | ~50ms | ~10ms | 80% faster |

**Overall Target**: 50%+ improvement across all query types

## Optimization Strategies

### 1. Tournament Data
- **Strategy**: Migrate from JSONB to `tournament_selections` table
- **Expected Impact**: 90% improvement (500ms → 50ms)
- **Mechanism**: 
  - Indexed table scans instead of JSONB deserialization
  - Ability to filter/paginate at database level
  - Covering indexes for common queries

### 2. Leaderboard
- **Strategy**: Remove materialized view, use covering indexes
- **Expected Impact**: 67% improvement (300ms → 100ms)
- **Mechanism**:
  - Covering index: `(name_id, rating DESC, wins DESC) WHERE rating IS NOT NULL`
  - Real-time data instead of stale view
  - Index-only scans

### 3. User Stats
- **Strategy**: Optimize RPC function, add covering indexes
- **Expected Impact**: 75% improvement (200ms → 50ms)
- **Mechanism**:
  - Covering index: `(user_name, rating, wins, losses) WHERE rating IS NOT NULL`
  - Single query instead of multiple
  - Database-level aggregations

### 4. Role Checks
- **Strategy**: Consolidate to `user_roles` table only
- **Expected Impact**: 80% improvement (50ms → 10ms)
- **Mechanism**:
  - Single source of truth
  - Simpler RLS policies
  - Cached in application layer

## Measurement Methodology

### How to Measure

1. **Database Query Time**:
   ```sql
   EXPLAIN ANALYZE <query>;
   ```
   Look for "Execution Time" in output

2. **Application-Level Timing**:
   ```javascript
   const start = performance.now();
   await query();
   const duration = performance.now() - start;
   console.log(`Query took ${duration}ms`);
   ```

3. **Supabase Dashboard**:
   - Use Supabase Studio's "Database" → "Query Performance" tab
   - Monitor slow query log
   - Check index usage statistics

### Test Conditions

- **Data Volume**: Test with realistic data (100+ names, 50+ users, 500+ tournaments)
- **Network**: Measure from same region as database
- **Load**: Test under normal load (not peak traffic)
- **Cache**: Clear query cache between tests
- **Consistency**: Run each query 5 times, take median

### Baseline Collection Script

```javascript
// scripts/measure-performance.js
import { supabase } from './supabase-client.js';

async function measureQuery(name, queryFn) {
  const times = [];
  
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await queryFn();
    const duration = performance.now() - start;
    times.push(duration);
  }
  
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  
  console.log(`${name}: ${median.toFixed(2)}ms (median of 5 runs)`);
  return median;
}

async function runBaselines() {
  console.log('=== Query Performance Baselines ===\n');
  
  // Tournament queries
  await measureQuery('Get User Tournaments', async () => {
    const { data } = await supabase
      .from('cat_app_users')
      .select('tournament_data')
      .eq('user_name', 'aaron')
      .single();
  });
  
  // Leaderboard queries
  await measureQuery('Get Leaderboard', async () => {
    const { data } = await supabase
      .from('leaderboard_stats')
      .select('*')
      .gte('total_ratings', 3)
      .order('avg_rating', { ascending: false })
      .limit(50);
  });
  
  // User stats
  await measureQuery('Get User Stats', async () => {
    const { data } = await supabase
      .rpc('get_user_stats', { p_user_name: 'aaron' });
  });
  
  // Name queries
  await measureQuery('Get Names with Descriptions', async () => {
    const { data } = await supabase
      .from('cat_name_options')
      .select('*')
      .eq('is_active', true)
      .order('avg_rating', { ascending: false });
  });
  
  console.log('\n=== Baseline Collection Complete ===');
}

runBaselines().catch(console.error);
```

## Notes

- These baselines are estimates based on code analysis
- Actual measurements should be taken on production-like data
- Network latency not included in estimates
- Client-side processing time included where applicable
- Measurements should be repeated after optimization to validate improvements

## Next Steps

1. Run baseline measurement script on production data
2. Document actual measurements in this file
3. Proceed with optimization tasks
4. Re-measure after each optimization phase
5. Validate 50%+ improvement target achieved
