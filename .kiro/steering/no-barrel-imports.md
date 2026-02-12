---
title: No Barrel Imports Rule
inclusion: auto
---

# No Barrel Imports

## Rule

**Do not use barrel imports (index.ts re-exports) in this codebase.**

## Rationale

Barrel imports (using `index.ts` files to re-export modules) can cause:
- Circular dependency issues
- Slower build times
- Harder to trace imports
- Increased bundle sizes
- TypeScript performance degradation

## What to Do Instead

Import directly from the source file:

### ❌ Bad (Barrel Import)
```typescript
import { myFunction } from '@/utils';
```

### ✅ Good (Direct Import)
```typescript
import { myFunction } from '@/utils/myFunction';
```

## Examples

### Instead of:
```typescript
// utils/index.ts
export * from './basic';
export * from './helpers';

// consumer.ts
import { cn, formatDate } from '@/utils';
```

### Do this:
```typescript
// consumer.ts
import { cn } from '@/utils/basic';
import { formatDate } from '@/utils/helpers';
```

## Exceptions

The following are acceptable:
- Path aliases that point directly to specific files (e.g., `@/icons` → `./utils/icons.ts`)
- Re-exports for external library compatibility (e.g., `@supabase/client`)

## Enforcement

- Biome linter rule `noNamespaceImport` is enabled
- Code reviews should catch barrel import patterns
- When refactoring, replace barrel imports with direct imports
