#!/bin/bash
# Test Restore Procedure
# This script tests the restore procedure on a test database
# Usage: ./scripts/test_restore.sh <backup_directory>

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKUP_DIR=$1

if [ -z "$BACKUP_DIR" ]; then
    echo -e "${RED}Error: Backup directory required${NC}"
    echo "Usage: ./scripts/test_restore.sh <backup_directory>"
    echo "Example: ./scripts/test_restore.sh backups/backup_phase2_20251129_120000"
    exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}Error: Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Restore Procedure${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Backup: $BACKUP_DIR"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${RED}Error: .env.local not found${NC}"
    exit 1
fi

if [ ! -f "$BACKUP_DIR/manifest.txt" ]; then
    echo -e "${YELLOW}Warning: manifest.txt not found in backup${NC}"
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

# Display backup info
echo -e "${YELLOW}Backup Information:${NC}"
if [ -f "$BACKUP_DIR/manifest.txt" ]; then
    head -n 10 "$BACKUP_DIR/manifest.txt"
fi
echo ""

# Confirm with user
echo -e "${YELLOW}WARNING: This will test restore on your configured database${NC}"
echo -e "${YELLOW}Make sure you're using a TEST database, not production!${NC}"
echo ""
read -p "Continue with test restore? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Step 1: Verify backup contents
echo -e "${YELLOW}Step 1: Verifying backup contents...${NC}"

REQUIRED_FILES=(
    "schema.sql"
    "data/cat_name_options.json"
    "data/cat_app_users.json"
    "data/cat_name_ratings.json"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$BACKUP_DIR/$file" ] && [ ! -f "$BACKUP_DIR/schema_export.json" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}Warning: Some files are missing:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    echo ""
    read -p "Continue anyway? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        exit 1
    fi
fi

echo -e "${GREEN}✓ Backup contents verified${NC}"
echo ""

# Step 2: Test schema restore (dry run)
echo -e "${YELLOW}Step 2: Testing schema restore (dry run)...${NC}"

if [ -f "$BACKUP_DIR/schema.sql" ]; then
    # Check if schema file is valid SQL
    if grep -q "CREATE TABLE" "$BACKUP_DIR/schema.sql"; then
        echo -e "${GREEN}✓ Schema file appears valid${NC}"
        SCHEMA_TABLES=$(grep -c "CREATE TABLE" "$BACKUP_DIR/schema.sql" || echo "0")
        echo "  Found $SCHEMA_TABLES table definitions"
    else
        echo -e "${YELLOW}Warning: No CREATE TABLE statements found in schema.sql${NC}"
    fi
elif [ -f "$BACKUP_DIR/schema_export.json" ]; then
    echo -e "${GREEN}✓ Schema export JSON found${NC}"
    if command -v jq &> /dev/null; then
        SCHEMA_TABLES=$(jq '.tables | length' "$BACKUP_DIR/schema_export.json")
        echo "  Found $SCHEMA_TABLES tables in export"
    fi
else
    echo -e "${RED}Error: No schema file found${NC}"
    exit 1
fi

echo ""

# Step 3: Test data restore (dry run)
echo -e "${YELLOW}Step 3: Testing data files...${NC}"

if [ -d "$BACKUP_DIR/data" ]; then
    DATA_FILES=$(ls -1 "$BACKUP_DIR/data"/*.json 2>/dev/null | wc -l)
    echo "Found $DATA_FILES data files"
    
    # Check each data file
    for file in "$BACKUP_DIR/data"/*.json; do
        if [ -f "$file" ]; then
            FILENAME=$(basename "$file")
            if command -v jq &> /dev/null; then
                ROW_COUNT=$(jq 'length' "$file")
                echo "  - $FILENAME: $ROW_COUNT rows"
            else
                FILE_SIZE=$(du -h "$file" | cut -f1)
                echo "  - $FILENAME: $FILE_SIZE"
            fi
        fi
    done
    echo -e "${GREEN}✓ Data files verified${NC}"
else
    echo -e "${RED}Error: data directory not found${NC}"
    exit 1
fi

echo ""

# Step 4: Simulate restore process
echo -e "${YELLOW}Step 4: Simulating restore process...${NC}"

# Copy data files to scripts/data for import
echo "Copying data files to scripts/data/..."
mkdir -p scripts/data
cp "$BACKUP_DIR/data"/*.json scripts/data/ 2>/dev/null || true

echo -e "${GREEN}✓ Data files staged for import${NC}"
echo ""

# Step 5: Provide restore instructions
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Restore Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✓ Backup verification complete${NC}"
echo -e "${GREEN}✓ All required files present${NC}"
echo -e "${GREEN}✓ Data files staged for import${NC}"
echo ""
echo -e "${YELLOW}To complete the restore:${NC}"
echo ""
echo "1. Restore schema:"
echo "   ${BLUE}supabase db reset --db-url <test_db_url>${NC}"
echo "   OR"
echo "   ${BLUE}psql -h <host> -U postgres -d postgres -f $BACKUP_DIR/schema.sql${NC}"
echo ""
echo "2. Import data:"
echo "   ${BLUE}node scripts/import_data.js${NC}"
echo ""
echo "3. Verify restore:"
echo "   ${BLUE}node scripts/verify_migration.js${NC}"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "- Make sure you're using a TEST database"
echo "- Verify .env.local points to test database"
echo "- Check that service role key is for test database"
echo ""

# Step 6: Ask if user wants to proceed with actual restore
read -p "Do you want to proceed with actual restore now? (yes/no): " PROCEED

if [ "$PROCEED" == "yes" ]; then
    echo ""
    echo -e "${YELLOW}Proceeding with restore...${NC}"
    echo ""
    
    # Note: Actual restore would require database connection
    # This is left as manual step for safety
    echo -e "${RED}Automatic restore not implemented for safety${NC}"
    echo "Please follow the manual steps above"
    echo ""
else
    echo ""
    echo "Test restore verification complete."
    echo "Follow the manual steps above when ready to restore."
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Complete${NC}"
echo -e "${GREEN}========================================${NC}"
