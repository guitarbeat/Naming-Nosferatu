#!/bin/bash
# Setup Test Environment for Supabase Backend Optimization
# This script creates a test database with production data copy
# Usage: ./scripts/setup_test_environment.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Environment Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${RED}Error: .env.local not found${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

# Step 1: Create backup of production data
echo -e "${YELLOW}Step 1: Creating backup of production data...${NC}"
./scripts/create_backup.sh test_env_setup

LATEST_BACKUP=$(ls -t backups/backup_test_env_setup_* | head -1)
echo -e "${GREEN}✓ Backup created: $LATEST_BACKUP${NC}"
echo ""

# Step 2: Setup test database configuration
echo -e "${YELLOW}Step 2: Setting up test database configuration...${NC}"

# Check if test environment variables exist
if [ -z "$TEST_SUPABASE_URL" ]; then
    echo -e "${YELLOW}Test database URL not configured${NC}"
    echo ""
    echo "To set up a test database, you have two options:"
    echo ""
    echo "Option 1: Use Supabase Local Development"
    echo "  ${BLUE}supabase start${NC}"
    echo "  This creates a local Supabase instance"
    echo ""
    echo "Option 2: Create a separate Supabase project"
    echo "  1. Go to https://supabase.com"
    echo "  2. Create a new project (e.g., 'naming-nosferatu-test')"
    echo "  3. Add to .env.local:"
    echo "     TEST_SUPABASE_URL=https://your-test-project.supabase.co"
    echo "     TEST_SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key"
    echo ""
    read -p "Have you set up a test database? (yes/no): " HAS_TEST_DB
    
    if [ "$HAS_TEST_DB" != "yes" ]; then
        echo ""
        echo -e "${YELLOW}Setting up local Supabase instance...${NC}"
        
        if command -v supabase &> /dev/null; then
            echo "Starting local Supabase..."
            supabase start
            
            # Get local connection details
            echo ""
            echo "Local Supabase started. Connection details:"
            supabase status
            
            echo ""
            echo "Add these to your .env.local as TEST_* variables"
        else
            echo -e "${RED}Supabase CLI not found${NC}"
            echo "Install with: npm install -g supabase"
            echo "Or: brew install supabase/tap/supabase"
            exit 1
        fi
    fi
fi

echo -e "${GREEN}✓ Test database configured${NC}"
echo ""

# Step 3: Create test environment config file
echo -e "${YELLOW}Step 3: Creating test environment config...${NC}"

cat > .env.test << 'EOF'
# Test Environment Configuration
# This file is used for testing the backend optimization

# Test Database (use local Supabase or separate test project)
TEST_SUPABASE_URL=${TEST_SUPABASE_URL:-http://localhost:54321}
TEST_SUPABASE_ANON_KEY=${TEST_SUPABASE_ANON_KEY}
TEST_SUPABASE_SERVICE_ROLE_KEY=${TEST_SUPABASE_SERVICE_ROLE_KEY}

# Test Users
TEST_USER_REGULAR=test_user
TEST_USER_ADMIN=test_admin
TEST_USER_MODERATOR=test_moderator

# Test Data
TEST_DATA_SIZE=small  # small, medium, large
TEST_ENABLE_PERFORMANCE_MONITORING=true
EOF

echo -e "${GREEN}✓ Test config created: .env.test${NC}"
echo ""

# Step 4: Load schema into test database
echo -e "${YELLOW}Step 4: Loading schema into test database...${NC}"

if [ -f "$LATEST_BACKUP/schema.sql" ]; then
    echo "Schema file found: $LATEST_BACKUP/schema.sql"
    echo ""
    echo "To load schema into test database:"
    echo "  ${BLUE}supabase db reset${NC} (for local)"
    echo "  OR"
    echo "  ${BLUE}psql -h <test-host> -U postgres -d postgres -f $LATEST_BACKUP/schema.sql${NC}"
    echo ""
    read -p "Load schema now? (yes/no): " LOAD_SCHEMA
    
    if [ "$LOAD_SCHEMA" == "yes" ]; then
        if command -v supabase &> /dev/null; then
            echo "Loading schema via Supabase CLI..."
            supabase db reset
            echo -e "${GREEN}✓ Schema loaded${NC}"
        else
            echo -e "${YELLOW}Please load schema manually${NC}"
        fi
    fi
else
    echo -e "${YELLOW}No schema file found in backup${NC}"
fi

echo ""

# Step 5: Load data into test database
echo -e "${YELLOW}Step 5: Loading data into test database...${NC}"

if [ -d "$LATEST_BACKUP/data" ]; then
    echo "Data files found in: $LATEST_BACKUP/data"
    echo ""
    echo "Copying data files to scripts/data/..."
    cp -r "$LATEST_BACKUP/data"/* scripts/data/ 2>/dev/null || true
    
    echo ""
    echo "To load data into test database:"
    echo "  ${BLUE}node scripts/import_data.js${NC}"
    echo ""
    echo "Make sure .env.local points to test database first!"
    echo ""
    read -p "Load data now? (yes/no): " LOAD_DATA
    
    if [ "$LOAD_DATA" == "yes" ]; then
        echo "Loading data..."
        node scripts/import_data.js
        echo -e "${GREEN}✓ Data loaded${NC}"
    fi
else
    echo -e "${YELLOW}No data files found in backup${NC}"
fi

echo ""

# Step 6: Create test users
echo -e "${YELLOW}Step 6: Creating test users...${NC}"

cat > scripts/create_test_users.sql << 'EOF'
-- Create Test Users for Testing Environment

-- Insert test users
INSERT INTO cat_app_users (user_name, created_at, updated_at)
VALUES 
  ('test_user', NOW(), NOW()),
  ('test_admin', NOW(), NOW()),
  ('test_moderator', NOW(), NOW())
ON CONFLICT (user_name) DO NOTHING;

-- Assign roles
INSERT INTO user_roles (user_name, role)
VALUES 
  ('test_user', 'user'),
  ('test_admin', 'admin'),
  ('test_moderator', 'moderator')
ON CONFLICT (user_name, role) DO NOTHING;

-- Create some test ratings for test_user
INSERT INTO cat_name_ratings (user_name, name_id, rating, wins, losses)
SELECT 
  'test_user',
  id,
  1500 + (random() * 200 - 100)::int,
  (random() * 10)::int,
  (random() * 10)::int
FROM cat_name_options
WHERE is_active = true
LIMIT 20
ON CONFLICT DO NOTHING;

-- Verify test users
SELECT 
  u.user_name,
  ur.role,
  COUNT(r.id) as rating_count
FROM cat_app_users u
LEFT JOIN user_roles ur ON u.user_name = ur.user_name
LEFT JOIN cat_name_ratings r ON u.user_name = r.user_name
WHERE u.user_name LIKE 'test_%'
GROUP BY u.user_name, ur.role;
EOF

echo "Test user creation script: scripts/create_test_users.sql"
echo ""
echo "To create test users:"
echo "  ${BLUE}psql -h <test-host> -U postgres -d postgres -f scripts/create_test_users.sql${NC}"
echo "  OR"
echo "  ${BLUE}supabase db execute -f scripts/create_test_users.sql${NC}"
echo ""

echo -e "${GREEN}✓ Test user script created${NC}"
echo ""

# Step 7: Create test queries
echo -e "${YELLOW}Step 7: Creating test queries...${NC}"

cat > scripts/test_queries.sql << 'EOF'
-- Test Queries for Verification

-- 1. Check table row counts
SELECT 'cat_name_options' as table_name, COUNT(*) as row_count FROM cat_name_options
UNION ALL SELECT 'cat_app_users', COUNT(*) FROM cat_app_users
UNION ALL SELECT 'cat_name_ratings', COUNT(*) FROM cat_name_ratings
UNION ALL SELECT 'tournament_selections', COUNT(*) FROM tournament_selections
UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles;

-- 2. Check test users exist
SELECT user_name, created_at FROM cat_app_users WHERE user_name LIKE 'test_%';

-- 3. Check user roles
SELECT ur.user_name, ur.role 
FROM user_roles ur
WHERE ur.user_name LIKE 'test_%';

-- 4. Check test user ratings
SELECT 
  user_name,
  COUNT(*) as rating_count,
  AVG(rating)::int as avg_rating,
  SUM(wins) as total_wins,
  SUM(losses) as total_losses
FROM cat_name_ratings
WHERE user_name LIKE 'test_%'
GROUP BY user_name;

-- 5. Test tournament query
SELECT 
  user_name,
  tournament_name,
  status,
  created_at
FROM tournament_selections
WHERE user_name LIKE 'test_%'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Test leaderboard query
SELECT 
  cno.name,
  COUNT(cnr.id) as rating_count,
  AVG(cnr.rating)::int as avg_rating,
  SUM(cnr.wins) as total_wins
FROM cat_name_options cno
LEFT JOIN cat_name_ratings cnr ON cno.id = cnr.name_id
WHERE cno.is_active = true
GROUP BY cno.id, cno.name
ORDER BY avg_rating DESC NULLS LAST
LIMIT 10;

-- 7. Test RLS policies (should work for test users)
SET LOCAL request.jwt.claims = '{"user_name": "test_user"}';
SELECT COUNT(*) as my_ratings FROM cat_name_ratings WHERE user_name = 'test_user';
EOF

echo "Test queries created: scripts/test_queries.sql"
echo ""
echo "To run test queries:"
echo "  ${BLUE}psql -h <test-host> -U postgres -d postgres -f scripts/test_queries.sql${NC}"
echo ""

echo -e "${GREEN}✓ Test queries created${NC}"
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Environment Setup Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Created:"
echo "  ✓ Production data backup"
echo "  ✓ Test environment config (.env.test)"
echo "  ✓ Test user creation script"
echo "  ✓ Test queries"
echo ""
echo "Next steps:"
echo "  1. Verify test database is running"
echo "  2. Load schema: ${BLUE}supabase db reset${NC}"
echo "  3. Load data: ${BLUE}node scripts/import_data.js${NC}"
echo "  4. Create test users: ${BLUE}psql -f scripts/create_test_users.sql${NC}"
echo "  5. Run test queries: ${BLUE}psql -f scripts/test_queries.sql${NC}"
echo "  6. Start application: ${BLUE}npm run dev${NC}"
echo ""
echo "Test users created:"
echo "  - test_user (regular user)"
echo "  - test_admin (admin)"
echo "  - test_moderator (moderator)"
echo ""
echo -e "${YELLOW}Important: Always test on test database before production!${NC}"
