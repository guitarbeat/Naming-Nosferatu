# Iterative Workflow Guide

## Automation

This workflow can be automated using the provided scripts:

- **Quick check**: `npm run workflow:check` - Returns exit code 0 if clean, non-zero if issues found
- **Full automation**: `./workflow.sh` - Runs complete workflow with error reporting
- **CI/CD friendly**: All commands return proper exit codes for pipeline integration

## Workflow Steps

### 1. Lint Check (Required After Each Change)

**Command**: `npm run lint`  
**Exit Code**: 
- `0` = Success (all checks passed)
- `1` = Failure (errors found)

**Priority Order**:
1. TypeScript errors (blocking) - `npm run lint:types`
2. ESLint errors - `npm run lint:eslint`
3. Stylelint errors - `npm run lint:style`

**Automation**:
```bash
npm run lint || exit 1
```

### 2. TypeScript Validation (Blocking)

**Command**: `npm run lint:types`  
**Exit Code**: 
- `0` = No TypeScript errors
- `1` = TypeScript errors found (BLOCKING)

**Rule**: Do not proceed to UI/browser checks until TypeScript errors are cleared.

**Automation**:
```bash
npm run lint:types || {
  echo "❌ TypeScript errors found - blocking"
  exit 1
}
```

### 3. Auto-Fix Attempts

**Command**: `npm run lint:fix`  
**Exit Code**: 
- `0` = Fixes applied (or no fixes needed)
- `1` = Some issues could not be auto-fixed

**Note**: Run this before manual fixes. Re-run `npm run lint` after to verify.

**Automation**:
```bash
npm run lint:fix && npm run lint
```

### 4. Usability Tests (On Request Only)

**Prerequisites**: 
- Lint must pass: `npm run lint` returns exit code 0
- TypeScript must be clean: `npm run lint:types` returns exit code 0

**Manual Steps** (not automatable):
1. Select two names
2. Start a tournament
3. Play through to completion
4. View the results page
5. Verify the reordering feature

**Automation Check**:
```bash
npm run lint && npm run lint:types && echo "✅ Ready for usability testing"
```

## Error Handling

### If Lint Fails

**Automation Response**:
1. Capture output: `npm run lint 2>&1 | tee lint-errors.log`
2. Report failing files and diagnostics
3. Exit with code 1 to stop workflow
4. Apply minimal fixes, then re-run

**Script Example**:
```bash
if ! npm run lint; then
  echo "❌ Lint failed - see lint-errors.log"
  exit 1
fi
```

### If Usability Test Requested While Lint Fails

**Automation Response**:
1. Check lint status first: `npm run workflow:check`
2. If exit code != 0, report blocking issues
3. Do not proceed to browser tests
4. Return exit code 1

## Automation Scripts

### `npm run workflow:check`
Quick validation that returns exit code 0 only if all checks pass.

### `./workflow.sh [--fix]`
Complete workflow automation:
- `./workflow.sh` - Check only (exits on failure)
- `./workflow.sh --fix` - Attempt auto-fixes, then check

### Exit Codes
- `0` = Success
- `1` = Lint/TypeScript errors
- `2` = Script error

## CI/CD Integration

```yaml
# Example GitHub Actions
- name: Check workflow
  run: npm run workflow:check

# Or with auto-fix attempt
- name: Lint and fix
  run: |
    npm run lint:fix || true
    npm run workflow:check
```
