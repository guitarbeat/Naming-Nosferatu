# Database Scripts

This directory contains scripts for managing database backups, exports, imports, and migrations.

## Backup & Export Scripts

### `create_backup.sh` - Comprehensive Backup
Creates a complete backup including schema, data, migrations, and configuration.

**Usage:**
```bash
./scripts/create_backup.sh [phase_name]
```

**Examples:**
```bash
# Create backup before Phase 2
./scripts/create_backup.sh phase2

# Create manual backup
./scripts/create_backup.sh manual
```

**Output:**
- `backups/backup_<phase>_<timestamp>/` - Backup directory
- `backups/backup_<phase>_<timestamp>.tar.gz` - Compressed archive

### `export_schema.js` - Schema Export
Exports database schema including tables, indexes, constraints, functions, and policies.

**Usage:**
```bash
node scripts/export_schema.js
```

**Output:**
- `scripts/data/schema_export.json` - Schema metadata
- `scripts/data/schema_summary.txt` - Human-readable summary

**Note:** For complete DDL export, use `supabase db dump` or `pg_dump` as shown in the script output.

### `export_data.js` - Data Export
Exports all table data to JSON files.

**Usage:**
```bash
node scripts/export_data.js
```

**Tables Exported:**
- `cat_name_options` - Cat name options
- `cat_app_users` - User accounts
- `cat_name_ratings` - User ratings
- `tournament_selections` - Tournament history
- `site_settings` - Application settings

**Output:**
- `scripts/data/<table_name>.json` - One file per table

**Features:**
- Handles large tables with pagination (1000 rows per page)
- Progress indicator
- Error handling

## Import & Restore Scripts

### `import_data.js` - Data Import
Imports data from JSON files back into the database.

**Usage:**
```bash
node scripts/import_data.js
```

**Requirements:**
- `.env.local` must contain `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Service role key required to bypass RLS
- JSON data files must exist in `scripts/data/`

**Note:** This script currently requires manual SQL execution. For production imports, use:
```bash
psql -h <host> -U postgres -d postgres -f scripts/import_data.sql
```

### `generate_migration_sql.js` - Generate Import SQL
Generates SQL INSERT statements from JSON data files.

**Usage:**
```bash
node scripts/generate_migration_sql.js
```

**Output:**
- `scripts/import_data.sql` - SQL file with INSERT statements

### `verify_migration.js` - Verify Data Integrity
Verifies that data was correctly migrated/restored.

**Usage:**
```bash
node scripts/verify_migration.js
```

**Checks:**
- Row counts match expected values
- Foreign key integrity
- Data consistency
- No orphaned records

## Migration Scripts

### `measure-performance-baselines.js` - Performance Benchmarks
Measures query performance for baseline comparison.

**Usage:**
```bash
node scripts/measure-performance-baselines.js
```

**Output:**
- `.kiro/specs/supabase-backend-optimization/performance-baselines.md`

**Metrics:**
- Tournament queries
- Leaderboard queries
- User stats queries
- Query execution times

## Directory Structure

```
scripts/
├── README.md                          # This file
├── create_backup.sh                   # Comprehensive backup script
├── export_schema.js                   # Schema export
├── export_data.js                     # Data export
├── import_data.js                     # Data import
├── generate_migration_sql.js          # Generate SQL from JSON
├── verify_migration.js                # Verify data integrity
├── measure-performance-baselines.js   # Performance benchmarks
└── data/                              # Export/import data directory
    ├── schema_export.json
    ├── schema_summary.txt
    ├── cat_name_options.json
    ├── cat_app_users.json
    ├── cat_name_ratings.json
    ├── tournament_selections.json
    └── site_settings.json
```

## Common Workflows

### Before Starting Migration

1. Create comprehensive backup:
   ```bash
   ./scripts/create_backup.sh pre_migration
   ```

2. Verify backup:
   ```bash
   ls -lh backups/backup_pre_migration_*/
   ```

### Before Each Phase

1. Create phase-specific backup:
   ```bash
   ./scripts/create_backup.sh phase2
   ```

### After Migration

1. Verify data integrity:
   ```bash
   node scripts/verify_migration.js
   ```

2. Compare performance:
   ```bash
   node scripts/measure-performance-baselines.js
   ```

### Restore from Backup

1. Extract backup:
   ```bash
   cd backups
   tar -xzf backup_phase2_20251129_120000.tar.gz
   ```

2. Restore schema:
   ```bash
   supabase db reset --db-url <connection_string>
   # OR
   psql -h <host> -U postgres -d postgres -f backup_phase2_20251129_120000/schema.sql
   ```

3. Restore data:
   ```bash
   # Copy JSON files to scripts/data/
   cp backup_phase2_20251129_120000/data/*.json scripts/data/
   
   # Import
   node scripts/import_data.js
   ```

4. Verify:
   ```bash
   node scripts/verify_migration.js
   ```

## Environment Variables

All scripts require `.env.local` with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Security Note:** Never commit `.env.local` to version control!

## Troubleshooting

### Export Fails

**Problem:** `export_data.js` fails with authentication error

**Solution:** 
- Check `.env.local` exists and has correct values
- Verify service role key has necessary permissions
- Check network connectivity to Supabase

### Import Fails

**Problem:** `import_data.js` fails with RLS policy error

**Solution:**
- Ensure using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Service role key bypasses RLS
- Check RLS policies are not blocking service role

### Schema Export Incomplete

**Problem:** `export_schema.js` doesn't capture all objects

**Solution:**
- Use `supabase db dump` or `pg_dump` for complete DDL
- Schema export script is for metadata only
- See script output for pg_dump instructions

### Backup Too Large

**Problem:** Backup archive is very large

**Solution:**
- Compress with higher compression: `tar -czf --best`
- Exclude unnecessary files
- Use incremental backups
- Store in cloud storage (S3, GCS)

## Best Practices

1. **Always backup before destructive operations**
   - Before dropping columns
   - Before dropping tables
   - Before data transformations

2. **Test restore procedures**
   - Verify backups can be restored
   - Test on staging/test database first
   - Document any issues

3. **Keep multiple backup versions**
   - Don't overwrite previous backups
   - Keep backups for 30 days after migration
   - Store critical backups off-site

4. **Automate backups**
   - Schedule regular backups
   - Use cron jobs or CI/CD
   - Monitor backup success/failure

5. **Document everything**
   - Record what was backed up
   - Note any issues or warnings
   - Keep backup manifests

## Support

For issues with these scripts, refer to:
- `.kiro/specs/supabase-backend-optimization/backup-strategy.md`
- `.kiro/specs/supabase-backend-optimization/design.md`
- Project documentation in `docs/`
