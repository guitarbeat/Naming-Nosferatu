#!/bin/bash
# Comprehensive Backup Script for Supabase Backend Optimization
# Usage: ./scripts/create_backup.sh [phase_name]

set -e  # Exit on error

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PHASE_NAME=${1:-"manual"}
BACKUP_DIR="backups/backup_${PHASE_NAME}_${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Supabase Backup Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo "Phase: $PHASE_NAME"
echo "Timestamp: $TIMESTAMP"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Create backup directory
echo -e "${YELLOW}Creating backup directory...${NC}"
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/data"
mkdir -p "$BACKUP_DIR/migrations"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}Error: .env.local not found${NC}"
    echo "Please create .env.local with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# 1. Export Schema
echo -e "${YELLOW}Step 1: Exporting database schema...${NC}"
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    supabase db dump --schema public > "$BACKUP_DIR/schema.sql" 2>/dev/null || {
        echo -e "${RED}Warning: Supabase CLI dump failed. Trying alternative method...${NC}"
        node scripts/export_schema.js
        if [ -f "scripts/data/schema_export.json" ]; then
            cp scripts/data/schema_export.json "$BACKUP_DIR/schema_export.json"
        fi
    }
else
    echo "Supabase CLI not found. Using Node.js script..."
    node scripts/export_schema.js
    if [ -f "scripts/data/schema_export.json" ]; then
        cp scripts/data/schema_export.json "$BACKUP_DIR/schema_export.json"
    fi
fi
echo -e "${GREEN}✓ Schema exported${NC}"

# 2. Export Data
echo -e "${YELLOW}Step 2: Exporting table data...${NC}"
node scripts/export_data.js
if [ -d "scripts/data" ]; then
    cp scripts/data/*.json "$BACKUP_DIR/data/" 2>/dev/null || echo "No JSON files to copy"
fi
echo -e "${GREEN}✓ Data exported${NC}"

# 3. Backup Migrations
echo -e "${YELLOW}Step 3: Backing up migration files...${NC}"
if [ -d "supabase/migrations" ]; then
    cp -r supabase/migrations/* "$BACKUP_DIR/migrations/" 2>/dev/null || echo "No migrations to copy"
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    echo "Backed up $MIGRATION_COUNT migration files"
fi
echo -e "${GREEN}✓ Migrations backed up${NC}"

# 4. Backup Configuration
echo -e "${YELLOW}Step 4: Backing up configuration files...${NC}"
cp .env.local "$BACKUP_DIR/.env.local" 2>/dev/null || echo "No .env.local found"
cp supabase/config.toml "$BACKUP_DIR/config.toml" 2>/dev/null || echo "No config.toml found"
echo -e "${GREEN}✓ Configuration backed up${NC}"

# 5. Get Row Counts (if possible)
echo -e "${YELLOW}Step 5: Recording database statistics...${NC}"
cat > "$BACKUP_DIR/manifest.txt" << EOF
Supabase Backup Manifest
========================
Created: $TIMESTAMP
Phase: $PHASE_NAME
Backup Directory: $BACKUP_DIR

Contents:
---------
- schema.sql (or schema_export.json)
- data/*.json (table exports)
- migrations/*.sql
- .env.local
- config.toml

Files:
------
EOF

# List all files in backup
find "$BACKUP_DIR" -type f | sed "s|$BACKUP_DIR/||" >> "$BACKUP_DIR/manifest.txt"

echo "" >> "$BACKUP_DIR/manifest.txt"
echo "Backup Size:" >> "$BACKUP_DIR/manifest.txt"
du -sh "$BACKUP_DIR" >> "$BACKUP_DIR/manifest.txt"

echo -e "${GREEN}✓ Manifest created${NC}"

# 6. Create README
cat > "$BACKUP_DIR/README.md" << 'EOF'
# Supabase Backup

This backup was created as part of the Supabase Backend Optimization project.

## Contents

- `schema.sql` - Complete database schema (DDL)
- `data/*.json` - Table data exports
- `migrations/*.sql` - Migration files
- `.env.local` - Environment configuration
- `config.toml` - Supabase configuration
- `manifest.txt` - Backup manifest with file listing

## Restore Instructions

### Full Restore

1. **Restore Schema:**
   ```bash
   supabase db reset --db-url <connection_string>
   # OR
   psql -h <host> -U postgres -d postgres -f schema.sql
   ```

2. **Restore Data:**
   ```bash
   node scripts/import_data.js
   ```

3. **Verify:**
   ```bash
   node scripts/verify_migration.js
   ```

### Partial Restore

To restore a specific table:
```bash
# Restore from JSON
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/cat_name_options.json'));
// Use Supabase client to insert data
"
```

## Rollback

If you need to rollback to this backup:

1. Stop the application
2. Follow restore instructions above
3. Restart the application
4. Verify functionality

## Support

For issues with restore, contact the database administrator.
EOF

echo -e "${GREEN}✓ README created${NC}"

# 7. Create compressed archive (optional)
echo -e "${YELLOW}Step 6: Creating compressed archive...${NC}"
tar -czf "${BACKUP_DIR}.tar.gz" -C backups "$(basename $BACKUP_DIR)"
ARCHIVE_SIZE=$(du -sh "${BACKUP_DIR}.tar.gz" | cut -f1)
echo -e "${GREEN}✓ Archive created: ${BACKUP_DIR}.tar.gz ($ARCHIVE_SIZE)${NC}"

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo "Location: $BACKUP_DIR"
echo "Archive: ${BACKUP_DIR}.tar.gz"
echo "Size: $ARCHIVE_SIZE"
echo ""
echo "To restore this backup:"
echo "  1. Extract: tar -xzf ${BACKUP_DIR}.tar.gz"
echo "  2. Follow instructions in $BACKUP_DIR/README.md"
echo ""
echo -e "${YELLOW}Important: Keep this backup until migration is verified!${NC}"
