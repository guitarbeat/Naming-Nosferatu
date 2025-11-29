# Supabase Backend Optimization - Implementation Tasks

## Phase 1: Analysis & Preparation (2-3 hours)

### Task 1.1: Audit Current Usage
- [x] Run query to find all tournament_data JSONB usage
- [x] Identify all code referencing user_role column
- [x] List all queries using removed columns
- [x] Document current query performance baselines

### Task 1.2: Create Backup Strategy
- [x] Export full database schema
- [x] Export all data using existing scripts
- [x] Test restore procedure
- [x] Document rollback steps

### Task 1.3: Set Up Testing Environment
- [x] Create test database with production data copy
- [x] Set up performance monitoring
- [x] Create test user accounts with different roles
- [x] Prepare test queries

## Phase 2: Add Constraints (Non-Breaking) (2-3 hours)

### Task 2.1: Add Unique Constraints
- [x] Create migration: Add unique constraint on `cat_name_ratings(user_name, name_id)`
- [x] Test constraint with existing data
- [x] Handle any duplicate data found
- [x] Apply to production

### Task 2.2: Add Check Constraints
- [x] Add constraint: `cat_name_options.name` length 1-100
- [x] Add constraint: rating range validation
- [x] Add constraint: wins/losses non-negative
- [x] Test all constraints

### Task 2.3: Add New Indexes
- [x] Create `idx_ratings_leaderboard` covering index
- [x] Create `idx_ratings_user_stats` covering index
- [x] Create `idx_tournament_user_recent` index
- [x] Analyze index usage with EXPLAIN

## Phase 3: Data Migration (3-4 hours)

### Task 3.1: Migrate Role Data
- [x] Create migration script to copy `cat_app_users.user_role` → `user_roles`
- [x] Handle users with no role (default to 'user')
- [x] Verify all users have roles in new table
- [x] Test role-checking functions with new data

### Task 3.2: Migrate Tournament Data
- [x] Create script to extract JSONB tournaments → `tournament_selections`
- [x] Handle missing fields (use defaults)
- [x] Verify row counts match
- [x] Test tournament queries with new data

### Task 3.3: Data Validation
- [x] Compare old vs new data for consistency
- [x] Run integrity checks (foreign keys, constraints)
- [x] Verify no data loss
- [x] Document any data transformations

## Phase 4: Update Functions & Policies (3-4 hours)

### Task 4.1: Update Role Functions
- [x] Update `has_role()` to use `user_roles` table only
- [x] Update `is_admin()` to use `user_roles` table
- [x] Update `get_current_user_role()` function
- [x] Test all role functions

### Task 4.2: Simplify RLS Policies
- [x] Drop all existing policies on `cat_name_options`
- [x] Create new simplified policies
- [x] Repeat for `cat_name_ratings`
- [x] Repeat for `cat_app_users`
- [x] Repeat for `tournament_selections`

### Task 4.3: Test Security
- [x] Test as anonymous user
- [x] Test as regular user
- [x] Test as admin user
- [x] Verify users can't access others' data
- [x] Verify admins can access all data

## Phase 5: Remove Legacy Code (2-3 hours)

### Task 5.1: Remove Unused Columns
- [x] Drop `cat_app_users.tournament_data` column
- [x] Drop `cat_app_users.user_role` column
- [x] Drop `cat_name_options.user_name` column
- [x] Drop `cat_name_options.popularity_score` column
- [x] Drop `cat_name_options.total_tournaments` column
- [x] Drop `cat_name_options.is_hidden` column (use is_active)

### Task 5.2: Remove Unused Database Objects
- [x] Drop `leaderboard_stats` materialized view
- [x] Drop `increment_selection` function
- [x] Drop unused indexes
- [x] Drop unused triggers

### Task 5.3: Update TypeScript Types
- [x] Regenerate types from new schema
- [x] Update all TypeScript files using old types
- [x] Fix type errors
- [x] Test type safety

## Phase 6: Update Application Code (4-6 hours)

### Task 6.1: Update Tournament Queries
- [x] Replace JSONB queries with table queries
- [x] Update `tournamentsAPI.getUserTournaments()`
- [x] Update `saveTournamentSelections()`
- [x] Update `profileStats.js` calculations
- [x] Test all tournament features

### Task 6.2: Update Role Checks
- [x] Update all `user_role` column references
- [x] Use `user_roles` table queries
- [x] Update admin checks
- [x] Test role-based features

### Task 6.3: Remove Dead Code
- [x] Remove `increment_selection` RPC calls
- [ ] Remove materialized view refresh code
- [ ] Remove unused API functions
- [ ] Clean up imports

## Phase 7: Optimization (2-3 hours)

### Task 7.1: Database Maintenance
- [ ] Run VACUUM ANALYZE on all tables
- [ ] Update table statistics
- [ ] Rebuild indexes
- [ ] Check for bloat

### Task 7.2: Performance Testing
- [ ] Benchmark tournament queries (target: <100ms)
- [ ] Benchmark leaderboard queries (target: <150ms)
- [ ] Benchmark user stats queries (target: <50ms)
- [ ] Compare with baseline metrics

### Task 7.3: Monitor & Tune
- [ ] Enable slow query logging
- [ ] Monitor index usage
- [ ] Identify missing indexes
- [ ] Adjust as needed

## Phase 8: Documentation & Cleanup (2-3 hours)

### Task 8.1: Update Documentation
- [ ] Update README with new schema
- [ ] Update MIGRATION_GUIDE.md
- [ ] Document new RLS policies
- [ ] Add performance tuning guide

### Task 8.2: Create Migration Scripts
- [ ] Package all migrations into single script
- [ ] Create rollback script
- [ ] Test on fresh database
- [ ] Document migration procedure

### Task 8.3: Final Testing
- [ ] Run full test suite
- [ ] Test all user flows
- [ ] Verify data integrity
- [ ] Load test with realistic data

## Estimated Timeline
- **Total**: 20-29 hours
- **Phases 1-3**: Can be done in parallel with production
- **Phases 4-6**: Require downtime or careful deployment
- **Phases 7-8**: Post-deployment optimization

## Risk Mitigation
- Test each phase on staging before production
- Keep backups at each phase
- Have rollback scripts ready
- Monitor error rates during deployment
- Plan for maintenance window

## Success Criteria
- [ ] All tests passing
- [ ] Query performance improved 50%+
- [ ] Database size reduced 30%+
- [ ] Zero data loss
- [ ] All features working
- [ ] Documentation updated
