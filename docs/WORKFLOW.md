# Iterative Workflow Guide

## Automation

This workflow can be automated using the provided scripts:

- **Quick check**: `pnpm run check` - Returns exit code 0 if clean, non-zero if issues found
- **Full automation**: `./workflow.sh` - Runs complete workflow with error reporting
- **Dead code analysis**: `pnpm run check:deps` or `pnpm exec knip` - Find unused files, exports, and dependencies
- **CI/CD friendly**: All commands return proper exit codes for pipeline integration

## Workflow Steps

### 1. Lint Check (Required After Each Change)

**Command**: `pnpm run lint`  
**Exit Code**: 
- `0` = Success (all checks passed)
- `1` = Failure (errors found)

**What it checks**:
- Biome linter for `src/` and `scripts/` directories
- TypeScript type checking for `src/`, `config/`, and `scripts/`

**Priority Order**:
1. TypeScript errors (blocking) - `pnpm run lint:types`
2. Biome linting errors - `pnpm run lint:biome`

**Automation**:
```bash
pnpm run lint || exit 1
```

### 2. TypeScript Validation (Blocking)

**Command**: `pnpm run lint:types`  
**Exit Code**: 
- `0` = No TypeScript errors
- `1` = TypeScript errors found (BLOCKING)

**What it checks**:
- TypeScript compilation for `src/`, `config/`, and `scripts/` directories
- Strict mode enabled with enhanced type safety rules

**Rule**: Do not proceed to UI/browser checks until TypeScript errors are cleared.

**Automation**:
```bash
pnpm run lint:types || {
  echo "❌ TypeScript errors found - blocking"
  exit 1
}
```

### 3. Dead Code Analysis

**Command**: `pnpm run check:deps` or `pnpm exec knip`  
**Exit Code**:
- `0` = No unused code found
- `1` = Unused files, exports, or dependencies found

**What Knip Detects**:
- Unused files (not imported anywhere) in `src/`, `config/`, and `scripts/`
- Unused exports (exported but never imported)
- Unused dependencies (in package.json but not used)
- Duplicate exports (same thing exported with multiple names)

**Focused Commands**:
```bash
pnpm exec knip --files        # Only check for unused files
pnpm exec knip --exports      # Only check for unused exports
pnpm exec knip --dependencies # Only check for unused dependencies
```

**Configuration**: See `config/knip.json` for project-specific settings (includes `scripts/` directory).

### 4. Auto-Fix Attempts

**Command**: `pnpm run lint:fix`  
**Exit Code**: 
- `0` = Fixes applied (or no fixes needed)
- `1` = Some issues could not be auto-fixed

**What it fixes**:
- Biome auto-fixable issues in `src/` and `scripts/` directories
- Formatting, unused imports, and other auto-correctable problems

**Note**: Run this before manual fixes. Re-run `pnpm run lint` after to verify.

**Automation**:
```bash
pnpm run lint:fix && pnpm run lint
```

### 5. Build Verification

**Command**: `pnpm run build`  
**Exit Code**:
- `0` = Build successful
- `1` = Build failed

**Rule**: Run build after significant changes to catch:
- Missing imports
- Tree-shaking issues
- Bundle size regressions

### 6. Usability Tests (On Request Only)

**Prerequisites**: 
- Lint must pass: `pnpm run lint` returns exit code 0
- TypeScript must be clean: `pnpm run lint:types` returns exit code 0
- Build must pass: `pnpm run build` returns exit code 0

**Manual Steps** (not automatable):
1. Select two names
2. Start a tournament
3. Play through to completion
4. View the results page
5. Verify the reordering feature

**Automation Check**:
```bash
pnpm run lint && pnpm run build && echo "✅ Ready for usability testing"
```

## Error Handling

### If Lint Fails

**Automation Response**:
1. Capture output: `pnpm run lint 2>&1 | tee lint-errors.log`
2. Report failing files and diagnostics
3. Exit with code 1 to stop workflow
4. Apply minimal fixes, then re-run

**Script Example**:
```bash
if ! pnpm run lint; then
  echo "❌ Lint failed - see lint-errors.log"
  exit 1
fi
```

### If Knip Finds Unused Code

**Response**:
1. Review the list of unused files/exports
2. Verify they're truly unused (not dynamically imported)
3. Delete unused files or remove unused exports
4. Re-run `pnpm exec knip` to confirm

### If Usability Test Requested While Lint Fails

**Automation Response**:
1. Check lint status first: `pnpm run check`
2. If exit code != 0, report blocking issues
3. Do not proceed to browser tests
4. Return exit code 1

## Automation Scripts

### `pnpm run check`
Quick validation that returns exit code 0 only if all checks pass.

### `./workflow.sh [--fix]`
Complete workflow automation:
- `./workflow.sh` - Check only (exits on failure)
- `./workflow.sh --fix` - Attempt auto-fixes, then check

### Exit Codes
- `0` = Success
- `1` = Lint/TypeScript/Knip errors
- `2` = Script error

## CI/CD Integration

```yaml
# Example GitHub Actions
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint          # Biome + TypeScript (src + scripts)
      - run: pnpm run check:limits  # File size limits (src + scripts)
      - run: pnpm run build
      - run: pnpm run check:deps   # Knip dead code detection
```

## Recommended Workflow Order

1. **Before coding**: `pnpm run check:deps` — Know what's unused before adding more
2. **After changes**: `pnpm run lint:fix && pnpm run lint`
3. **Before commit**: `pnpm run build && pnpm run check:deps`
4. **Before PR**: Full `./workflow.sh` check
