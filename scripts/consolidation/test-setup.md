# Test Environment Setup for Component Consolidation

## Overview

This document describes the test environment configuration for verifying component consolidation operations.

## Current Test Strategy

Since the project doesn't have a test framework configured yet, the consolidation verification relies on:

1. **TypeScript Type Checking** - Ensures no type errors after consolidation
2. **Build Verification** - Ensures the project builds successfully
3. **Import Validation** - Ensures all imports can be resolved

## Available Verification Commands

### 1. Type Checking

```bash
pnpm run lint:types
```

This runs `tsc --noEmit` to check for TypeScript errors without generating output files.

### 2. Build Verification

```bash
pnpm run build:dev
```

This builds the project in development mode to verify all modules can be bundled.

### 3. Linting

```bash
pnpm run lint:full
```

This runs Biome to check for code quality issues.

## Using the Test Runner

The test runner (`test-runner.ts`) wraps these commands and provides a unified interface:

```bash
# Run type check
pnpm exec tsx scripts/consolidation/test-runner.ts type-check

# Run build
pnpm exec tsx scripts/consolidation/test-runner.ts build

# Verify imports
pnpm exec tsx scripts/consolidation/test-runner.ts verify-imports

# Run full suite
pnpm exec tsx scripts/consolidation/test-runner.ts full
```

## Future Test Setup

When implementing property-based tests (as specified in the design document), you'll need to:

### 1. Install fast-check

```bash
pnpm add -D fast-check vitest @vitest/ui
```

### 2. Create vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./scripts/consolidation/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './source'),
    },
  },
});
```

### 3. Add test script to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run"
  }
}
```

### 4. Create property-based tests

Example property test for import update consistency:

```typescript
import { test } from 'vitest';
import fc from 'fast-check';
import { batchUpdateImports } from './update-imports';

// Feature: component-consolidation, Property 1: Import Update Consistency
test('all imports updated after consolidation', () => {
  fc.assert(
    fc.property(
      fc.record({
        sourceComponent: fc.constantFrom(
          'layout/Button',
          'layout/Card',
          'layout/Loading'
        ),
        targetComponent: fc.constantFrom(
          'layout/ui/Button',
          'layout/ui/Card',
          'layout/ui/Loading'
        ),
      }),
      ({ sourceComponent, targetComponent }) => {
        // Test that consolidation updates all imports
        const result = batchUpdateImports('./source', sourceComponent, targetComponent);
        return result.success;
      }
    ),
    { numRuns: 100 }
  );
});
```

## Verification Workflow

For each consolidation step:

1. **Pre-consolidation baseline**
   ```bash
   pnpm exec tsx scripts/consolidation/test-runner.ts full
   ```

2. **Perform consolidation**
   ```bash
   pnpm exec tsx scripts/consolidation/index.ts execute plan.json
   ```

3. **Post-consolidation verification**
   ```bash
   pnpm exec tsx scripts/consolidation/test-runner.ts full
   ```

4. **Compare results**
   - Check that type checking still passes
   - Verify build completes successfully
   - Ensure no new errors introduced

## Manual Verification

After automated tests pass, perform manual checks:

1. **Visual inspection** - Check consolidated components render correctly
2. **Browser console** - Verify no runtime errors
3. **Component variants** - Test all variant props work as expected
4. **Accessibility** - Ensure a11y features still work

## Rollback Procedure

If verification fails:

1. **Restore from backup**
   ```bash
   pnpm exec tsx scripts/consolidation/index.ts restore
   ```

2. **Verify restoration**
   ```bash
   pnpm exec tsx scripts/consolidation/test-runner.ts full
   ```

3. **Investigate issues**
   - Review error messages
   - Check import paths
   - Verify component APIs

## Notes

- Always run verification after each consolidation step
- Keep backups until verification passes
- Document any issues encountered
- Update this guide as the test setup evolves
