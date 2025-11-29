# Supabase Backend Optimization - Design

## Architecture Overview

### Current State Issues
1. **Dual Tournament Storage**: Data in both `tournament_selections` table and `cat_app_users.tournament_data` JSONB
2. **Dual Role Systems**: Both `user_roles` table and `cat_app_users.user_role` column
3. **Overly Permissive RLS**: Multiple "Anyone can X" policies bypass security
4. **Missing Constraints**: No unique constraints on natural keys
5. **Unused Materialized View**: `leaderboard_stats` never refreshed
6. **Dead Code**: `increment_selection` RPC does nothing

### Proposed Architecture

#### Data Model Changes

**1. Tournament Data Consolidation**
- **Decision**: Keep `tournament_selections` table, remove `cat_app_users.tournament_data`
- **Rationale**: 
  - Relational data easier to query and index
  - Better for analytics and reporting
  - Easier to migrate
  - JSONB makes complex queries slow
- **Migration**: Extract all tournaments from JSONB, insert into table, drop column

**2. Role System Consolidation**
- **Decision**: Use `user_roles` table only, remove `cat_app_users.user_role`
- **Rationale**:
  - Prevents privilege escalation (separate table with strict RLS)
  - Supports multiple roles per user
  - Already has proper enum type
- **Migration**: Copy existing roles to `user_roles`, drop column

**3. Add Composite Primary Key to cat_name_ratings**
```sql
ALTER TABLE cat_name_ratings 
  DROP CONSTRAINT cat_name_ratings_pkey,
  ADD PRIMARY KEY (user_name, name_id);
```
- Removes need for UUID `id` column
- Natural key is more efficient
- Prevents duplicate ratings

**4. Remove Unused Columns**
From `cat_name_options`:
- `user_name` (not used, names are global)
- `popularity_score` (calculated, not stored)
- `total_tournaments` (calculated, not stored)
- ~~`is_hidden`~~ - KEPT: used for global admin hiding (different from `is_active`)

**5. Materialized View Strategy**
- Option A: Remove `leaderboard_stats` and use regular view
- Option B: Add scheduled refresh (pg_cron)
- **Recommendation**: Remove it, use indexed queries instead

#### RLS Policy Simplification

**Current Problem**: Overlapping policies like:
- "Anyone can insert ratings" + "Users can insert own ratings"
- "Public can view user data" + "Users can view own data"

**Proposed Policies**:

```sql
-- cat_name_options
DROP POLICY ALL;
CREATE POLICY "public_read" ON cat_name_options FOR SELECT TO public USING (is_active = true);
CREATE POLICY "admin_all" ON cat_name_options FOR ALL TO public USING (is_admin());
CREATE POLICY "user_suggest" ON cat_name_options FOR INSERT TO public WITH CHECK (true);

-- cat_name_ratings  
DROP POLICY ALL;
CREATE POLICY "user_own_data" ON cat_name_ratings FOR ALL TO public 
  USING (user_name = get_current_user_name());
CREATE POLICY "admin_all" ON cat_name_ratings FOR ALL TO public USING (is_admin());

-- cat_app_users
DROP POLICY ALL;
CREATE POLICY "user_own_data" ON cat_app_users FOR ALL TO public
  USING (user_name = get_current_user_name());
CREATE POLICY "admin_all" ON cat_app_users FOR ALL TO public USING (is_admin());

-- tournament_selections
DROP POLICY ALL;
CREATE POLICY "user_own_data" ON tournament_selections FOR ALL TO public
  USING (user_name = get_current_user_name());
CREATE POLICY "admin_all" ON tournament_selections FOR ALL TO public USING (is_admin());
```

#### Index Optimization

**Remove Unused Indexes**:
- `idx_cat_name_options_active` (partial index rarely used)
- `idx_cat_name_ratings_leaderboard` (materialized view removed)
- `idx_cat_app_users_tournament_data` (JSONB column removed)

**Add Covering Indexes**:
```sql
-- For leaderboard queries
CREATE INDEX idx_ratings_leaderboard ON cat_name_ratings (name_id, rating DESC, wins DESC) 
  WHERE rating IS NOT NULL;

-- For user stats
CREATE INDEX idx_ratings_user_stats ON cat_name_ratings (user_name, rating, wins, losses)
  WHERE rating IS NOT NULL;

-- For tournament history
CREATE INDEX idx_tournament_user_recent ON tournament_selections (user_name, selected_at DESC);
```

#### Schema Changes Summary

**Tables to Modify**:
1. `cat_name_options` - Remove 4 columns
2. `cat_name_ratings` - Change PK to composite, remove id column
3. `cat_app_users` - Remove tournament_data and user_role columns
4. `tournament_selections` - Keep as-is (becomes primary tournament storage)

**Tables to Remove**:
- None (all tables serve a purpose)

**Views to Remove**:
- `leaderboard_stats` (materialized view)

**Functions to Remove**:
- `increment_selection` (no-op)

**Functions to Update**:
- All role-checking functions to use `user_roles` table only

## Migration Strategy

### Phase 1: Add New Constraints (Non-Breaking)
1. Add unique constraint to `cat_name_ratings(user_name, name_id)`
2. Add check constraints for validation
3. Add new indexes

### Phase 2: Migrate Data
1. Copy `cat_app_users.user_role` → `user_roles` table
2. Extract `cat_app_users.tournament_data` → `tournament_selections` table
3. Verify data integrity

### Phase 3: Update Functions & Policies
1. Update all role-checking functions
2. Simplify RLS policies
3. Test with existing data

### Phase 4: Remove Legacy (Breaking)
1. Drop unused columns
2. Drop materialized view
3. Drop no-op functions
4. Update TypeScript types

### Phase 5: Optimize
1. Run VACUUM ANALYZE
2. Update statistics
3. Monitor query performance

## Rollback Plan
- Keep migration SQL in separate files
- Create reverse migration for each phase
- Test rollback on staging before production
- Keep backups for 30 days

## Performance Expectations

**Before**:
- Tournament query: ~500ms (JSONB scan)
- Leaderboard query: ~300ms (no materialized view refresh)
- User stats: ~200ms (multiple table scans)

**After**:
- Tournament query: ~50ms (indexed table scan)
- Leaderboard query: ~100ms (covering index)
- User stats: ~50ms (covering index)

## Security Considerations

**Improvements**:
- Stricter RLS policies (no more "Anyone can X")
- Role system in separate table (prevents privilege escalation)
- Proper constraints prevent data corruption

**Risks**:
- Must ensure all helper functions work correctly
- Test thoroughly with different user roles
- Verify anon vs authenticated access

## Testing Strategy

1. **Unit Tests**: Test each RPC function
2. **Integration Tests**: Test RLS policies with different users
3. **Performance Tests**: Benchmark before/after
4. **Migration Tests**: Test on copy of production data
5. **Rollback Tests**: Verify rollback procedures work

## Documentation Updates

- Update README with new schema
- Update API documentation
- Update migration guide
- Add performance tuning guide
