#!/bin/bash

# Iterative Workflow Automation Script
# Usage: ./workflow.sh [--fix]
#   --fix: Attempt to auto-fix issues before checking

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
if ! command_exists pnpm; then
    print_error "pnpm is not installed or not in PATH"
    exit 2
fi

# Parse arguments
AUTO_FIX=false
if [[ "$1" == "--fix" ]]; then
    AUTO_FIX=true
fi

echo "🔍 Running iterative workflow check..."

# Step 1: Attempt auto-fix if requested
if [ "$AUTO_FIX" = true ]; then
    echo ""
    echo "🔧 Attempting auto-fixes..."
    if pnpm run lint:fix; then
        print_status "Auto-fixes applied"
    else
        print_warning "Some issues could not be auto-fixed"
    fi
    echo ""
fi

# Step 2: Run comprehensive checks
echo "📘 Running linting and type checks..."
if pnpm run lint; then
    print_status "All lint checks passed"
else
    print_error "Lint errors found (BLOCKING)"
    echo ""
    echo "Run './workflow.sh --fix' to attempt auto-fixes, or fix manually."
    exit 1
fi

# Step 3: Run dependency and unused code checks
echo ""
echo "🔍 Checking dependencies and unused code..."
if pnpm run check; then
    print_status "Dependency and unused code checks passed"
else
    print_warning "Some dependency or unused code issues found"
    echo ""
    echo "Review the output above and fix manually if needed."
fi

# All checks passed
echo ""
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "Ready for:"
echo "  - Code commits"
echo "  - Usability testing"
echo "  - Further development"
exit 0

