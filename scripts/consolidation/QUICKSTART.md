# Component Consolidation Quick Start Guide

This guide will help you get started with the component consolidation infrastructure.

## Prerequisites

1. Install dependencies (including tsx):
   ```bash
   pnpm install
   ```

2. Ensure TypeScript is configured correctly:
   ```bash
   pnpm run lint:types
   ```

## Quick Start

### Step 1: Analyze Components

Run the analysis tool to identify consolidation opportunities:

```bash
pnpm run consolidate:analyze
```

This will generate a report at `component-analysis-report.md` showing:
- Re-export wrappers that can be removed
- Potential duplicate components
- Component dependencies and usage

### Step 2: Review the Report

Open `component-analysis-report.md` and review the findings:

```bash
cat component-analysis-report.md
```

Look for:
- **Re-export wrappers**: Files that only re-export from another file
- **Duplicate candidates**: Components with similar names that might be duplicates
- **Usage information**: How many files import each component

### Step 3: Verify Current State

Before making any changes, verify the current state:

```bash
pnpm run consolidate:verify
```

This runs:
- TypeScript type checking
- Build verification
- Generates a baseline report

### Step 4: Plan Your Consolidation

Based on the analysis, create a consolidation plan. For example, to remove a re-export wrapper:

```json
{
  "id": "remove-button-index",
  "type": "remove",
  "sourceComponents": ["layout/Button/index.ts"],
  "targetComponent": "layout/Button.tsx",
  "description": "Remove Button index.ts re-export wrapper"
}
```

Save this as `consolidation-plan.json`.

### Step 5: Test with Dry Run

Test your plan without making changes:

```bash
pnpm exec tsx scripts/consolidation/index.ts execute consolidation-plan.json . --dry-run
```

Review the output to see what would be changed.

### Step 6: Execute Consolidation

If the dry run looks good, execute the consolidation:

```bash
pnpm exec tsx scripts/consolidation/index.ts execute consolidation-plan.json .
```

### Step 7: Verify Changes

After consolidation, verify everything still works:

```bash
pnpm run consolidate:verify
```

Check that:
- ✓ Type checking passes
- ✓ Build completes successfully
- ✓ No broken imports

### Step 8: Manual Testing

Test the application manually:

```bash
pnpm run dev
```

Verify:
- Components render correctly
- No console errors
- All functionality works as expected

## Common Tasks

### Find All Imports of a Component

```bash
pnpm exec tsx scripts/consolidation/update-imports.ts find source "layout/Button"
```

### Update Imports

```bash
pnpm exec tsx scripts/consolidation/update-imports.ts update source "layout/Button/index" "layout/Button"
```

### Validate All Imports

```bash
pnpm exec tsx scripts/consolidation/update-imports.ts validate source
```

### Run Type Check Only

```bash
pnpm run consolidate:type-check
```

### Run Build Only

```bash
pnpm exec tsx scripts/consolidation/test-runner.ts build
```

## Example Workflow: Remove Re-export Wrapper

Let's walk through a complete example of removing a re-export wrapper:

1. **Identify the wrapper**:
   ```bash
   pnpm run consolidate:analyze
   # Review component-analysis-report.md
   ```

2. **Find what imports it**:
   ```bash
   pnpm exec tsx scripts/consolidation/update-imports.ts find source "layout/Button/index"
   ```

3. **Create a plan**:
   ```json
   {
     "id": "remove-button-wrapper",
     "type": "remove",
     "sourceComponents": ["layout/Button/index.ts"],
     "targetComponent": "layout/Button.tsx",
     "description": "Remove Button re-export wrapper"
   }
   ```

4. **Dry run**:
   ```bash
   pnpm exec tsx scripts/consolidation/index.ts execute plan.json . --dry-run
   ```

5. **Execute**:
   ```bash
   pnpm exec tsx scripts/consolidation/index.ts execute plan.json .
   ```

6. **Verify**:
   ```bash
   pnpm run consolidate:verify
   ```

7. **Test manually**:
   ```bash
   pnpm run dev
   ```

## Troubleshooting

### "tsx not found"

Install dependencies:
```bash
pnpm install
```

### Type Errors After Consolidation

1. Check the error messages:
   ```bash
   pnpm run lint:types
   ```

2. Review import paths in the affected files

3. Ensure the target component exists and exports the expected symbols

### Build Failures

1. Check for circular dependencies
2. Verify all imports are resolved
3. Review the build output for specific errors:
   ```bash
   pnpm run build:dev
   ```

### Import Resolution Errors

1. Validate imports:
   ```bash
   pnpm exec tsx scripts/consolidation/update-imports.ts validate source
   ```

2. Check tsconfig.json path mappings

3. Verify file extensions are correct

## Next Steps

After completing the infrastructure setup (Task 1), you can proceed to:

- **Task 2**: Identify and remove re-export wrappers
- **Task 4**: Consolidate Calendar components
- **Task 5**: Consolidate Loading components
- And so on...

Each task will use these tools to safely consolidate components while maintaining functionality.

## Tips

- Always run in dry-run mode first
- Verify after each consolidation step
- Keep the analysis report updated
- Document any issues you encounter
- Use version control to track changes
- Create backups before major consolidations

## Getting Help

If you encounter issues:

1. Check the README.md for detailed documentation
2. Review the test-setup.md for verification strategies
3. Examine the generated reports for insights
4. Use the dry-run mode to preview changes

## Summary

The consolidation infrastructure provides:

✓ **Analysis tools** - Identify consolidation opportunities  
✓ **Import automation** - Update imports automatically  
✓ **Verification tools** - Ensure functionality is preserved  
✓ **Safety features** - Dry-run mode and validation  

You're now ready to start consolidating components safely and efficiently!
