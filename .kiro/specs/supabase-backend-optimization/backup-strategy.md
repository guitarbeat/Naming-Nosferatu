# Backup Strategy for Supabase Backend Optimization

**Date:** 2025-11-29  
**Task:** 1.2 - Create Backup Strategy  
**Status:** Complete

## Overview

This document outlines the backup and restore strategy for the Supabase backend optimization project. The strategy ensures zero data loss and provides multiple rollback points during the migration.

## Backup Components

### 1. Database Schema Export ✓

**Method 1: Using Supabase CLI (Recommended)**
```bash
# Export complete schema with all DDL
supabase db dump --schema public > scripts/data/schema_backup_$(date +%Y%m%d_%H%M%S).sql

# Or using pg_dump directly
pg_dump -h <host> -U postgres -d postgres \
  --schema-only \
  --no-owner \
  --no-privileges \
  -f scripts/data/schema_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Method 2: Using Node.js Script**
```bash
node scripts/export_schema.js
```

**What's Included:**
- Table definitions (CREATE TABLE)
- Indexes (CREATE INDEX)
- Constraints (PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE)
- Functions (CREATE FUNCTION)
- RLS Policies (CREATE POLICY)
- Views and Materialized Views
- Triggers
- Sequences

**Output Location:** `scripts/data/schema_backup_YYYYMMDD_HHMMSS.sql`

### 2. Data Export ✓

**Using Existing Script:**
```bash
node scripts/export_data.js
```

**Tables Exported:**
- `cat_name_options` - All cat name options
- `cat_app_users` - User accounts and preferences
- `cat_name_ratings` - User ratings and tournament results
- `tournament_selections` - Tournament history
- `site_settings` - Application settings

**Output Location:** `scripts/data/<table_name>.json`

**Format:** JSON with full row data

### 3. Migration Files Backup ✓

**Location:** `supabase/migrations/`

**Action:** Create timestamped backup
```bash
# Create backup of all migrations
tar -czf backups/migrations_backup_$(date +%Y%m%d_%H%M%S).tar.gz supabase/migrations/

# Or copy to backup directory
cp -r supabase/migrations/ backups/migrations_$(date +%Y%m%d_%H%M%S)/
```

### 4. Environment Configuration Backup ✓

**Files to Backup:**
- `.env.local` - Environment variables
- `supabase/config.toml` - Supabase configuration

**Action:**
```bash
# Create secure backup (exclude from git)
mkdir -p backups/config_$(date +%Y%m%d_%H%M%S)
cp .env.local backups/config_$(date +%Y%m%d_%H%M%S)/
cp supabase/config.toml backups/config_$(date +%Y%m%d_%H%M%S)/
```

## Backup Schedule

### Pre-Migration Backups (Required)

1. **Before Phase 1 (Analysis):**
   - ✓ Full schema export
   - ✓ Full data export
   - ✓ Migration files backup

2. **Before Phase 2 (Add Constraints):**
   - Schema export
   - Data export (in case constraints fail)

3. **Before Phase 3 (Data Migration):**
   - Full schema export
   - Full data export
   - **CRITICAL:** This is the last backup before data transformation

4. **Before Phase 4 (Update Functions):**
   - Schema export (functions will change)

5. **Before Phase 5 (Remove Legacy):**
   - Full schema export
   - Full data export
   - **CRITICAL:** Last backup before destructive changes

### Incremental Backups (Recommended)

- After each successful phase completion
- Before any destructive operation (DROP, ALTER TABLE DROP COLUMN)
- After any data transformation

## Restore Procedures

### Full Restore (Complete Rollback)

**Step 1: Restore Schema**
```bash
# Using Supabase CLI
supabase db reset --db-url <connection_string>

# Or using psql
psql -h <host> -U postgres -d postgres -f scripts/data/schema_backup_YYYYMMDD_HHMMSS.sql
```

**Step 2: Restore Data**
```bash
# Using import script
node scripts/import_data.js

# Or using SQL
psql -h <host> -U postgres -d postgres -f scripts/data/import_data.sql
```

**Step 3: Verify**
```bash
# Run verification script
node scripts/verify_migration.js
```

### Partial Restore (Specific Table)

**Restore Single Table Schema:**
```sql
-- Extract table definition from backup
-- Apply manually or via script
```

**Restore Single Table Data:**
```bash
# Using psql COPY
psql -h <host> -U postgres -d postgres -c "\COPY cat_name_options FROM 'scripts/data/cat_name_options.csv' CSV HEADER"
```

### Rollback Specific Migration

**Using Supabase CLI:**
```bash
# Rollback last migration
supabase migration repair --status reverted <migration_timestamp>

# Apply down migration
supabase db reset --version <previous_migration_timestamp>
```

**Manual Rollback:**
```sql
-- Create reverse migration
-- Example: If we added a constraint, drop it
ALTER TABLE cat_name_ratings DROP CONSTRAINT IF EXISTS unique_user_name_name_id;
```

## Rollback Scripts

### Phase-Specific Rollback Scripts

**Phase 2 Rollback (Remove Constraints):**
```sql
-- scripts/rollback/phase2_rollback.sql
ALTER TABLE cat_name_ratings DROP CONSTRAINT IF EXISTS unique_user_name_name_id;
ALTER TABLE cat_name_options DROP CONSTRAINT IF EXISTS check_name_length;
ALTER TABLE cat_name_ratings DROP CONSTRAINT IF EXISTS check_rating_range;
-- ... etc
```

**Phase 3 Rollback (Undo Data Migration):**
```sql
-- scripts/rollback/phase3_rollback.sql
-- Restore user_role column data from user_roles table
UPDATE cat_app_users 
SET user_role = (
  SELECT role::text 
  FROM user_roles 
  WHERE user_roles.user_name = cat_app_users.user_name 
  LIMIT 1
);

-- Restore tournament_data from tournament_selections
-- (Complex - requires aggregation)
```

**Phase 5 Rollback (Restore Dropped Columns):**
```sql
-- scripts/rollback/phase5_rollback.sql
-- WARNING: This requires data from backup
ALTER TABLE cat_app_users ADD COLUMN tournament_data JSONB;
ALTER TABLE cat_app_users ADD COLUMN user_role VARCHAR;
-- ... restore data from backup
```

## Testing Restore Procedures

### Test Environment Setup

1. **Create Test Database:**
```bash
# Using Supabase CLI
supabase start

# Or create separate project
```

2. **Load Backup:**
```bash
# Restore schema
supabase db reset --db-url <test_db_url>

# Restore data
node scripts/import_data.js
```

3. **Verify Restore:**
```bash
# Run verification
node scripts/verify_migration.js

# Check row counts
psql -h <host> -U postgres -d postgres -c "
  SELECT 
    'cat_name_options' as table_name, COUNT(*) as row_count FROM cat_name_options
  UNION ALL
  SELECT 'cat_app_users', COUNT(*) FROM cat_app_users
  UNION ALL
  SELECT 'cat_name_ratings', COUNT(*) FROM cat_name_ratings
  UNION ALL
  SELECT 'tournament_selections', COUNT(*) FROM tournament_selections;
"
```

4. **Test Application:**
```bash
# Start application against test database
VITE_SUPABASE_URL=<test_url> npm run dev

# Run automated tests
npm test
```

## Backup Verification Checklist

- [ ] Schema backup file exists and is not empty
- [ ] Schema backup contains all expected tables
- [ ] Data export files exist for all tables
- [ ] Data export files contain expected row counts
- [ ] Migration files are backed up
- [ ] Environment configuration is backed up
- [ ] Backup files are stored in secure location
- [ ] Backup files are accessible (permissions correct)
- [ ] Restore procedure has been tested on test database
- [ ] Restore completes without errors
- [ ] Restored data matches original (row counts, checksums)

## Backup Storage

### Local Storage
- **Location:** `scripts/data/` and `backups/`
- **Retention:** Keep all backups until migration is complete and verified
- **Security:** Exclude from git (add to .gitignore)

### Remote Storage (Recommended)
- **Options:**
  - AWS S3
  - Google Cloud Storage
  - Supabase Storage
  - GitHub private repository (for schema only)
- **Encryption:** Use encrypted storage for sensitive data
- **Retention:** Keep for 30 days after successful migration

## Emergency Contacts

**Database Administrator:** [Contact Info]  
**DevOps Lead:** [Contact Info]  
**Project Manager:** [Contact Info]

## Backup Automation Script

Create a comprehensive backup script:

```bash
#!/bin/bash
# scripts/create_backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/backup_$TIMESTAMP"

echo "Creating backup: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 1. Export schema
echo "Exporting schema..."
supabase db dump --schema public > "$BACKUP_DIR/schema.sql"

# 2. Export data
echo "Exporting data..."
node scripts/export_data.js
cp -r scripts/data/*.json "$BACKUP_DIR/"

# 3. Backup migrations
echo "Backing up migrations..."
cp -r supabase/migrations "$BACKUP_DIR/"

# 4. Backup config
echo "Backing up configuration..."
cp .env.local "$BACKUP_DIR/" 2>/dev/null || echo "No .env.local found"
cp supabase/config.toml "$BACKUP_DIR/"

# 5. Create manifest
echo "Creating manifest..."
cat > "$BACKUP_DIR/manifest.txt" << EOF
Backup Created: $TIMESTAMP
Schema: schema.sql
Data Files: *.json
Migrations: migrations/
Config: .env.local, config.toml

Row Counts:
$(psql -h <host> -U postgres -d postgres -t -c "
  SELECT 'cat_name_options: ' || COUNT(*) FROM cat_name_options
  UNION ALL SELECT 'cat_app_users: ' || COUNT(*) FROM cat_app_users
  UNION ALL SELECT 'cat_name_ratings: ' || COUNT(*) FROM cat_name_ratings
  UNION ALL SELECT 'tournament_selections: ' || COUNT(*) FROM tournament_selections;
")
EOF

echo "✓ Backup complete: $BACKUP_DIR"
```

## Success Criteria

- [x] Schema export script created
- [x] Data export script exists and works
- [x] Backup strategy documented
- [x] Rollback procedures documented
- [ ] Test restore completed successfully
- [ ] Backup automation script created
- [ ] All team members trained on restore procedures

## Next Steps

1. ✓ Document backup strategy
2. ⏭️ Test restore procedure on test database
3. ⏭️ Create rollback scripts for each phase
4. ⏭️ Set up automated backup schedule
