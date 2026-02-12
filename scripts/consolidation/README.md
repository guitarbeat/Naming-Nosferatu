# Component Consolidation Infrastructure

This directory contains utilities for safely consolidating duplicate and overlapping components in the codebase.

## Overview

The consolidation infrastructure provides three main capabilities:

1. **Dependency Analysis** - Identify re-export wrappers, thin wrappers, and duplicate components
2. **Import Update Automation** - Automatically update import statements using TypeScript compiler API
3. **Test Verification** - Verify functionality is preserved through type checking and builds

## Scripts

### analyze-dependencies.ts

Analyzes component files to identify consolidation opportunities.

**Features:**
- Detects re-export wrappers (files that only re-export)
- Identifies component dependencies and usage
- Finds potential duplicate components
- Generates detailed analysis report

**Usage:**
```bash
# Analyze components in source directory
pnpm exec tsx scripts/consolidation/analyze-dependencies.ts ./source

# Output: component-analysis-report.md
```

**Example Output:**
```
# Component Dependency Analysis Report

Total components analyzed: 45
Re-export wrappers found: 3
Duplicate candidates: 2

## Re-export Wrappers

- source/layout/Button/index.ts
  - Exports: Button
  - Used by 12 file(s)
```

### update-imports.ts

Automates import statement updates when components are moved or consolidated.

**Features:**
- Finds all files importing from a specific module
- Batch updates imports across the codebase
- Validates imports can be resolved
- Supports component renames

**Usage:**
```bash
# Find all files importing from a module
pnpm exec tsx scripts/consolidation/update-imports.ts find ./source "layout/Button"

# Update imports from old path to new path
pnpm exec tsx scripts/consolidation/update-imports.ts update ./source "layout/Button" "layout/ui/Button"

# Validate all imports can be resolved
pnpm exec tsx scripts/consolidation/update-imports.ts validate ./source
```

### test-runner.ts

Runs verification tests to ensure consolidation doesn't break functionality.

**Features:**
- TypeScript type checking
- Build verification
- Import validation
- Generates test reports

**Usage:**
```bash
# Run type check
pnpm exec tsx scripts/consolidation/test-runner.ts type-check

# Run build
pnpm exec tsx scripts/consolidation/test-runner.ts build

# Verify no broken imports
pnpm exec tsx scripts/consolidation/test-runner.ts verify-imports

# Run full test suite
pnpm exec tsx scripts/consolidation/test-runner.ts full

# Output: consolidation-test-report.md
```

### index.ts

Main consolidation utility that orchestrates the entire process.

**Features:**
- Executes complete consolidation plans
- Coordinates analysis, updates, and testing
- Supports dry-run mode
- Creates backups and rollback capability

**Usage:**
```bash
# Analyze components
pnpm exec tsx scripts/consolidation/index.ts analyze ./source

# Execute a consolidation plan (dry run)
pnpm exec tsx scripts/consolidation/index.ts execute plan.json . --dry-run

# Execute a consolidation plan (for real)
pnpm exec tsx scripts/consolidation/index.ts execute plan.json .

# Verify consolidation
pnpm exec tsx scripts/consolidation/index.ts verify .
```

## Consolidation Plan Format

Consolidation plans are JSON files that describe the consolidation operation:

```json
{
  "id": "remove-button-wrapper",
  "type": "remove",
  "sourceComponents": [
    "layout/Button/index.ts"
  ],
  "targetComponent": "layout/Button.tsx",
  "description": "Remove re-export wrapper for Button component"
}
```

**Plan Types:**
- `remove` - Remove wrapper files and update imports
- `merge` - Merge multiple components into one
- `standardize` - Standardize on a single implementation

## Workflow

### 1. Analysis Phase

```bash
# Analyze the codebase
pnpm exec tsx scripts/consolidation/index.ts analyze ./source

# Review the generated report
cat component-analysis-report.md
```

### 2. Planning Phase

Create a consolidation plan JSON file based on the analysis:

```json
{
  "id": "consolidate-loading",
  "type": "merge",
  "sourceComponents": [
    "layout/LoadingScreen.tsx",
    "layout/LoadingSpinner.tsx"
  ],
  "targetComponent": "layout/Loading.tsx",
  "description": "Merge LoadingScreen and LoadingSpinner into single Loading component"
}
```

### 3. Dry Run

```bash
# Test the plan without making changes
pnpm exec tsx scripts/consolidation/index.ts execute plan.json . --dry-run
```

### 4. Execution

```bash
# Execute the consolidation
pnpm exec tsx scripts/consolidation/index.ts execute plan.json .
```

### 5. Verification

```bash
# Verify everything still works
pnpm exec tsx scripts/consolidation/index.ts verify .

# Run full test suite
pnpm exec tsx scripts/consolidation/test-runner.ts full
```

## Safety Features

### Backup and Rollback

The utilities support creating backups before consolidation:

```typescript
import { createBackup, restoreBackup } from './index.js';

// Create backup
createBackup(['source/layout/Button.tsx'], './backup');

// Restore if needed
restoreBackup('./backup', './source/layout');
```

### Validation

Multiple validation steps ensure safety:

1. **Import Resolution** - Verifies all imports can be resolved
2. **Type Checking** - Runs TypeScript compiler to catch type errors
3. **Build Verification** - Ensures the project builds successfully
4. **Dry Run Mode** - Preview changes without modifying files

## Integration with Task Execution

These utilities support the component consolidation tasks defined in `.kiro/specs/component-consolidation/tasks.md`:

- **Task 1**: Set up consolidation infrastructure ✓
- **Task 2**: Identify and remove re-export wrappers (use analyze-dependencies.ts)
- **Task 4-10**: Component consolidations (use index.ts with plans)
- **Task 11**: Update test files (use update-imports.ts)
- **Task 12**: Final verification (use test-runner.ts)

## Requirements Validation

This infrastructure satisfies:

- **Requirement 7.1**: Import update automation using TypeScript compiler API ✓
- **Requirement 7.2**: Semantic rename tools for updating references ✓
- **Requirement 7.3**: Verification of no broken imports ✓
- **Requirement 7.4**: Build and test verification ✓

## Examples

### Example 1: Remove Re-export Wrapper

```bash
# 1. Find what imports the wrapper
pnpm exec tsx scripts/consolidation/update-imports.ts find ./source "layout/Button/index"

# 2. Update imports to actual implementation
pnpm exec tsx scripts/consolidation/update-imports.ts update ./source "layout/Button/index" "layout/Button"

# 3. Verify imports
pnpm exec tsx scripts/consolidation/update-imports.ts validate ./source

# 4. Remove the wrapper file
rm source/layout/Button/index.ts
```

### Example 2: Consolidate Components

```bash
# 1. Create consolidation plan
cat > consolidate-loading.json << EOF
{
  "id": "consolidate-loading",
  "type": "merge",
  "sourceComponents": ["layout/LoadingScreen.tsx", "layout/LoadingSpinner.tsx"],
  "targetComponent": "layout/Loading.tsx",
  "description": "Merge loading components"
}
EOF

# 2. Dry run
pnpm exec tsx scripts/consolidation/index.ts execute consolidate-loading.json . --dry-run

# 3. Execute
pnpm exec tsx scripts/consolidation/index.ts execute consolidate-loading.json .

# 4. Verify
pnpm exec tsx scripts/consolidation/index.ts verify .
```

## Troubleshooting

### Import Resolution Errors

If you see "Cannot find module" errors:

1. Check the import paths are correct
2. Verify the target file exists
3. Run `pnpm exec tsx scripts/consolidation/update-imports.ts validate ./source`

### Type Errors

If type checking fails:

1. Review the TypeScript errors
2. Ensure consolidated components have all required props
3. Update type definitions if needed

### Build Failures

If the build fails:

1. Check for circular dependencies
2. Verify all imports are resolved
3. Run `pnpm run lint:types` for detailed errors

## Notes

- Always run in dry-run mode first
- Create backups before major consolidations
- Verify after each consolidation step
- Keep old files until all imports are verified
- Use TypeScript compiler API for accurate refactoring
