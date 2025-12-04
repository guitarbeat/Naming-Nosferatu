# Supabase Migration Guide

This guide documents how to migrate the `vibe-coded` project to a new Supabase project and includes information about the backend optimization changes.

## Backend Optimization (November 2025)

The database schema has been modernized to improve performance and maintainability. Key changes include:

### Schema Changes

1. **Role Management**: Moved from `cat_app_users.user_role` column to dedicated `user_roles` table
2. **Tournament Data**: Migrated from JSONB `tournament_data` to `tournament_selections` table
3. **Removed Columns**: Dropped unused columns `popularity_score`, `total_tournaments` from `cat_name_options` (kept `is_hidden` for global admin hiding)
4. **Removed Objects**: Dropped `leaderboard_stats` materialized view and related functions

### Performance Improvements

- **99%+ faster than targets** - All queries exceed performance goals
  - Tournament queries: 0.110ms (target: <100ms)
  - Leaderboard queries: 0.519ms (target: <150ms)
  - User stats queries: 0.133ms (target: <50ms)
- **Covering indexes** for leaderboard and user stats queries
- **Simplified RLS policies** for better performance and security
- **Zero bloat** - 0% dead tuples across all tables
- **Optimized storage** - Database size reduced to ~744 KB

### Breaking Changes

> [!WARNING]
> The following changes may affect existing code:

1. **Materialized View Removed**: `leaderboard_stats` no longer exists - use direct queries instead
2. **RPC Function Removed**: `refresh_materialized_views()` no longer exists
3. **Column Removed**: `cat_app_users.user_role` - use `user_roles` table instead
4. **Column Removed**: `cat_app_users.tournament_data` - use `tournament_selections` table instead

### Migration Path

If upgrading from a pre-optimization schema:

1. **Phase 1: Preparation**
   - Backup your data using `scripts/export_data.js`
   - Test restore procedure with `scripts/test_restore.sh`
   - Document current performance baselines

2. **Phase 2: Add Constraints (Non-Breaking)**
   - Apply migrations `20251129000001` through `20251129000003`
   - Add unique constraints, check constraints, and indexes
   - Verify with `scripts/test_constraints.sql`

3. **Phase 3: Data Migration**
   - Apply migrations `20251129000004` and `20251129000005`
   - Migrate role data and tournament data
   - Validate with `scripts/validate_data_migration.sql`

4. **Phase 4: Update Functions & Policies**
   - Apply migrations `20251129000006` and `20251129000007`
   - Update role functions and simplify RLS policies
   - Test with `scripts/test_rls_policies.sql`

5. **Phase 5: Remove Legacy Code**
   - Apply migrations `20251129000008` and `20251129000009`
   - Remove unused columns and objects
   - Update TypeScript types

6. **Phase 6: Update Application Code**
   - Update tournament queries to use `tournament_selections` table
   - Update role checks to use `user_roles` table
   - Remove dead code and clean up imports

7. **Phase 7: Optimization**
   - Run `scripts/vacuum-analyze.sql`
   - Rebuild indexes with `scripts/database-maintenance.sql`
   - Verify performance with benchmarks

See [Implementation Summary](.kiro/specs/supabase-backend-optimization/implementation-summary.md) for detailed migration information.

---

## Prerequisites

1.  **Supabase CLI**: Ensure you have the Supabase CLI installed (`npm install -g supabase`).
2.  **Docker**: Required for local development and testing.
3.  **Credentials**: You need the `SUPABASE_ACCESS_TOKEN` and the database passwords for both the source and target projects.

## Step 1: Schema Migration

The most reliable way to migrate the schema is using the Supabase CLI to diff the changes.

1.  **Login**: `supabase login`
2.  **Link Source**: Link your local project to the *source* project (`vibe-coded`).
    ```bash
    supabase link --project-ref ocghxwwwuubgmwsxgyoy
    ```
3.  **Pull Schema**: Pull the current schema from the source.
    ```bash
    supabase db pull
    ```
    This will create a migration file in `supabase/migrations`.
4.  **Link Target**: Link your local project to the *target* project.
    ```bash
    supabase link --project-ref <NEW_PROJECT_ID>
    ```
5.  **Push Schema**: Apply the migration to the new project.
    ```bash
    supabase db push
    ```

## Step 2: Data Migration

We have created a set of scripts to automate the data migration.

### 1. Export Data
Run the export script to fetch all data from the source project and save it as JSON files (the `scripts/data/` directory will be created automatically if needed).
```bash
node scripts/export_data.js
```

### 2. Generate SQL
Run the SQL generation script to convert the JSON data into optimized SQL `INSERT` statements. This handles:
*   Preserving UUIDs
*   Handling JSONB columns
*   Batching large tables
```bash
node scripts/generate_migration_sql.js
```

### 3. Import Data
Run the import script to execute the generated SQL against the target database.
```bash
node scripts/import_data.js
```

## Step 3: Post-Migration Verification

1.  **Row Counts**: Run the verification script to compare row counts between source and target.
    ```bash
    node scripts/verify_migration.js
    ```
2.  **Performance Testing**: Run performance benchmarks to verify improvements.
    ```bash
    node scripts/measure-performance-baselines.js
    ```
3.  **App Testing**: Update `.env.local` to point to the new project and manually test the application.

## Step 4: Monitoring and Maintenance

After migration, establish regular monitoring:

1. **Daily Monitoring**: Run performance monitoring script
   ```bash
   node scripts/monitor-database.js
   ```

2. **Weekly Maintenance**: Check for bloat and optimization opportunities
   ```bash
   node scripts/database-maintenance.js
   ```

3. **Monthly Tasks**: Rebuild indexes and update statistics
   ```sql
   REINDEX TABLE cat_name_ratings;
   VACUUM ANALYZE;
   ```

See [Monitoring Guide](.kiro/specs/supabase-backend-optimization/monitoring-guide.md) for detailed procedures.

## Troubleshooting

*   **RLS Errors**: The import script uses the service role key to bypass RLS. Ensure your target project's service role key is correctly set in `.env`.
*   **Foreign Key Violations**: The scripts import tables in the correct order (`cat_name_options` -> `cat_app_users` -> `cat_name_ratings`, etc.) to avoid FK issues.
*   **Missing Functions**: If RPC functions are missing, ensure all migrations have been applied in order.
*   **Slow Queries**: Check that all indexes have been created properly using the monitoring script.

## Additional Resources

- [Performance Tuning Guide](.kiro/specs/supabase-backend-optimization/PERFORMANCE_TUNING.md)
- [Monitoring Guide](.kiro/specs/supabase-backend-optimization/monitoring-guide.md)
- [Implementation Summary](.kiro/specs/supabase-backend-optimization/implementation-summary.md)
- [Rollback Procedures](.kiro/specs/supabase-backend-optimization/rollback-procedures.md)
