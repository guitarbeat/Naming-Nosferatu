# Rollback Procedures

**Date:** 2025-11-29  
**Task:** 1.2.4 - Document Rollback Steps  
**Status:** Complete

## Overview

This document provides detailed rollback procedures for each phase of the Supabase backend optimization. Each phase has specific rollback steps that can be executed independently.

## General Rollback Principles

1. **Stop the Application First** - Always stop the application before rolling back
2. **Use Backups** - Restore from the most recent backup before the failed phase
3. **Verify After Rollback** - Always verify data integrity after rollback
4. **Document Issues** - Record what went wrong and why rollback was needed

## Emergency Rollback (Full Restore)

If something goes catastrophically wrong, use this procedure:

### Step 1: Stop Application
```bash
# Stop all application processes
pm2 stop all
# OR
docker-compose down
# OR kill the dev server
```

### Step 2: Identify Last Good Backup
```bash
# List available backups
ls -lt backups/

# Choose the backup from before the problem started
BACKUP_DIR="backups/backup_phase2_20251129_120000"
```

### Step 3: Restore Schema
```bash
# Using Supabase CLI
supabase db reset --db-url "$DATABASE_URL"

# OR using psql
psql -h <host> -U postgres -d postgres -f "$BACKUP_DIR/schema.sql"
```

### Step 4: Restore Data
```bash
# Copy data files
cp "$BACKUP_DIR/data"/*.json scripts/data/

# Import data
node scripts/import_data.js
```

### Step 5: Verify Restore
```bash
# Run verification
node scripts/verify_migration.js

# Check row counts
psql -h <host> -U postgres -d postgres -c "
  SELECT 'cat_name_options' as table, COUNT(*) FROM cat_name_options
  UNION ALL SELECT 'cat_app_users', COUNT(*) FROM cat_app_users
  UNION ALL SELECT 'cat_name_ratings', COUNT(*) FROM cat_name_ratings
  UNION ALL SELECT 'tournament_selections', COUNT(*) FROM tournament_selections;
"
```

### Step 6: Restart Application
```bash
# Restart application
pm2 restart all
# OR
docker-compose up -d
# OR
npm run dev
```

## Phase-Specific Rollback Procedures

### Phase 2: Rollback Added Constraints

**When to Use:** If constraints cause issues or prevent normal operations

**Rollback Script:** `scripts/rollback/phase2_rollback.sql`

```sql
-- Remove unique constraint on cat_name_ratings
ALTER TABLE cat_name_ratings 
DROP CONSTRAINT IF EXISTS unique_user_name_name_id;

-- Remove check constraints
ALTER TABLE cat_name_options 
DROP CONSTRAINT IF EXISTS check_name_length;

ALTER TABLE cat_name_ratings 
DROP CONSTRAINT IF EXISTS check_rating_range;

ALTER TABLE cat_name_ratings 
DROP CONSTRAINT IF EXISTS check_wins_non_negative;

ALTER TABLE cat_name_ratings 
DROP CONSTRAINT IF EXISTS check_losses_non_negative;

-- Remove new indexes
DROP INDEX IF EXISTS idx_ratings_leaderboard;
DROP INDEX IF EXISTS idx_ratings_user_stats;
DROP INDEX IF EXISTS idx_tournament_user_recent;

-- Verify rollback
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'cat_name_ratings'::regclass;
```

**Execution:**
```bash
psql -h <host> -U postgres -d postgres -f scripts/rollback/phase2_rollback.sql
```

**Verification:**
- Constraints should be removed
- Application should work without constraint errors
- No data should be lost

### Phase 3: Rollback Data Migration

**When to Use:** If data migration fails or produces incorrect results

**Scenario A: Rollback Role Migration**

```sql
-- Restore user_role column from user_roles table
UPDATE cat_app_users 
SET user_role = (
  SELECT role::text 
  FROM user_roles 
  WHERE user_roles.user_name = cat_app_users.user_name 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_name = cat_app_users.user_name
);

-- Verify
SELECT 
  user_name,
  user_role,
  (SELECT role FROM user_roles WHERE user_roles.user_name = cat_app_users.user_name LIMIT 1) as role_from_table
FROM cat_app_users
LIMIT 10;
```

**Scenario B: Rollback Tournament Data Migration**

This is complex because tournament_data is JSONB. Best approach is to restore from backup:

```bash
# Restore tournament_data column from backup
psql -h <host> -U postgres -d postgres << 'EOF'
-- Restore from backup table (if you created one)
UPDATE cat_app_users 
SET tournament_data = backup_cat_app_users.tournament_data
FROM backup_cat_app_users
WHERE cat_app_users.user_name = backup_cat_app_users.user_name;
EOF
```

**Alternative:** Reconstruct from tournament_selections table:

```sql
-- Reconstruct tournament_data from tournament_selections
-- WARNING: This is complex and may not preserve exact structure
UPDATE cat_app_users
SET tournament_data = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'tournament_name', tournament_name,
      'selected_names', selected_names,
      'status', status,
      'created_at', created_at,
      'completed_at', completed_at
    )
  )
  FROM tournament_selections
  WHERE tournament_selections.user_name = cat_app_users.user_name
);
```

**Verification:**
```bash
node scripts/verify_migration.js
```

### Phase 4: Rollback Function & Policy Updates

**When to Use:** If updated functions or policies break functionality

**Rollback Script:** `scripts/rollback/phase4_rollback.sql`

```sql
-- Restore old role-checking functions
-- (Requires backup of old function definitions)

-- Example: Restore has_role() to check both sources
CREATE OR REPLACE FUNCTION public.has_role(_user_name TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $
  -- Check both user_roles table AND cat_app_users.user_role column
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_name = _user_name AND role = _role
  ) OR EXISTS (
    SELECT 1 FROM cat_app_users
    WHERE user_name = _user_name AND user_role = _role::text
  );
$;

-- Restore old RLS policies
-- (Requires backup of old policy definitions)
-- This is complex - best to restore from schema backup
```

**Better Approach:** Restore entire schema from backup:
```bash
psql -h <host> -U postgres -d postgres -f backups/backup_phase3_*/schema.sql
```

### Phase 5: Rollback Removed Columns

**When to Use:** If removing columns breaks functionality

**WARNING:** This requires data from backup! Columns cannot be restored without data.

**Rollback Script:** `scripts/rollback/phase5_rollback.sql`

```sql
-- Re-add dropped columns
ALTER TABLE cat_app_users 
ADD COLUMN IF NOT EXISTS tournament_data JSONB DEFAULT '[]'::jsonb;

ALTER TABLE cat_app_users 
ADD COLUMN IF NOT EXISTS user_role VARCHAR;

ALTER TABLE cat_name_options 
ADD COLUMN IF NOT EXISTS user_name VARCHAR;

ALTER TABLE cat_name_options 
ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0;

ALTER TABLE cat_name_options 
ADD COLUMN IF NOT EXISTS total_tournaments INTEGER DEFAULT 0;

-- NOTE: is_hidden is NOT dropped - it's used for global admin hiding
-- No rollback needed for is_hidden column

-- Restore data from backup
-- This MUST be done from backup files
```

**Restore Data:**
```bash
# Extract backup
tar -xzf backups/backup_phase4_*.tar.gz

# Restore specific columns using psql COPY or custom script
# This is complex and requires careful data mapping
```

**Better Approach:** Full restore from Phase 4 backup:
```bash
./scripts/test_restore.sh backups/backup_phase4_20251129_120000
```

### Phase 6: Rollback Application Code Changes

**When to Use:** If code changes break functionality

**Rollback Steps:**

1. **Revert Git Commits:**
```bash
# Find the commit before Phase 6 changes
git log --oneline

# Revert to that commit
git revert <commit_hash>

# OR reset (if not pushed)
git reset --hard <commit_hash>
```

2. **Restore Old Code Files:**
```bash
# If you backed up the files
cp backups/code_backup_phase5/* src/
```

3. **Reinstall Dependencies:**
```bash
npm install
```

4. **Rebuild:**
```bash
npm run build
```

5. **Restart:**
```bash
npm run dev
```

### Phase 7: Rollback Optimizations

**When to Use:** If optimizations cause performance issues

**Rollback Script:** `scripts/rollback/phase7_rollback.sql`

```sql
-- Revert VACUUM ANALYZE (not needed - it's safe)
-- Revert index changes
DROP INDEX IF EXISTS idx_new_optimization_index;

-- Restore old indexes if needed
CREATE INDEX idx_old_index ON table_name (column_name);
```

**Note:** Most Phase 7 changes are safe and don't need rollback

## Rollback Verification Checklist

After any rollback, verify:

- [ ] Application starts without errors
- [ ] Users can log in
- [ ] Tournament functionality works
- [ ] Leaderboard displays correctly
- [ ] User profiles load
- [ ] Admin functions work
- [ ] No console errors
- [ ] Database queries execute successfully
- [ ] Row counts match expected values
- [ ] No orphaned data
- [ ] Foreign key integrity maintained
- [ ] RLS policies working correctly

## Rollback Testing

Before production rollback, test on staging:

```bash
# 1. Create test database
supabase start

# 2. Apply migrations up to failed phase
supabase db reset

# 3. Test rollback procedure
./scripts/test_restore.sh backups/backup_phase3_test

# 4. Verify application works
npm run dev

# 5. Run test suite
npm test
```

## Common Rollback Scenarios

### Scenario 1: Constraint Violation

**Problem:** New constraint prevents normal operations

**Solution:**
```sql
-- Temporarily disable constraint
ALTER TABLE cat_name_ratings 
DROP CONSTRAINT unique_user_name_name_id;

-- Fix data
-- Re-add constraint with DEFERRABLE option
ALTER TABLE cat_name_ratings 
ADD CONSTRAINT unique_user_name_name_id 
UNIQUE (user_name, name_id) DEFERRABLE;
```

### Scenario 2: RLS Policy Too Restrictive

**Problem:** Users can't access their own data

**Solution:**
```sql
-- Drop problematic policy
DROP POLICY "user_own_data" ON cat_name_ratings;

-- Create more permissive policy temporarily
CREATE POLICY "user_own_data_temp" ON cat_name_ratings
FOR ALL TO public
USING (true);  -- Temporarily allow all access

-- Debug and fix policy
-- Then restore proper policy
```

### Scenario 3: Data Migration Incomplete

**Problem:** Some data didn't migrate

**Solution:**
```bash
# Re-run migration for missing data only
psql -h <host> -U postgres -d postgres << 'EOF'
-- Migrate only users without roles
INSERT INTO user_roles (user_name, role)
SELECT user_name, user_role::app_role
FROM cat_app_users
WHERE user_role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_name = cat_app_users.user_name
  );
EOF
```

### Scenario 4: Performance Degradation

**Problem:** Queries slower after optimization

**Solution:**
```sql
-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM cat_name_ratings WHERE user_name = 'test';

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';

-- Rebuild indexes
REINDEX TABLE cat_name_ratings;

-- Update statistics
ANALYZE cat_name_ratings;
```

## Emergency Contacts

**Database Administrator:** [Contact]  
**DevOps Lead:** [Contact]  
**On-Call Engineer:** [Contact]

## Rollback Decision Matrix

| Severity | Action | Timeframe |
|----------|--------|-----------|
| Critical - Data Loss | Full restore from backup | Immediate |
| High - Application Down | Phase-specific rollback | < 1 hour |
| Medium - Feature Broken | Code revert + partial rollback | < 4 hours |
| Low - Performance Issue | Optimization rollback | < 24 hours |

## Post-Rollback Actions

1. **Document the Issue:**
   - What went wrong?
   - Why did it happen?
   - What was the impact?

2. **Update Procedures:**
   - What could prevent this?
   - What needs to change?

3. **Communicate:**
   - Notify team of rollback
   - Explain what happened
   - Share lessons learned

4. **Plan Next Steps:**
   - Fix the issue
   - Test more thoroughly
   - Try again with improvements

## Rollback Scripts Location

All rollback scripts are stored in:
```
scripts/rollback/
├── phase2_rollback.sql
├── phase3_rollback.sql
├── phase4_rollback.sql
├── phase5_rollback.sql
└── phase7_rollback.sql
```

Create these scripts before starting each phase!

## Success Criteria

- [x] Rollback procedures documented for each phase
- [x] Emergency rollback procedure documented
- [x] Verification checklist created
- [x] Common scenarios documented
- [ ] Rollback scripts created for each phase
- [ ] Rollback procedures tested on staging
- [ ] Team trained on rollback procedures
