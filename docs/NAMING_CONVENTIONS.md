# Naming Conventions & Linting Suppressions

**Last Updated**: January 2025  
**Purpose**: Guidelines for handling naming conventions and when to suppress linting warnings

---

## Overview

This codebase uses **camelCase** as the standard naming convention for TypeScript/JavaScript identifiers. However, there are legitimate cases where **snake_case** or **UPPER_CASE** must be used to match external systems (databases, APIs, generated code). This document explains when and how to properly handle these exceptions.

---

## Standard Naming Conventions

### TypeScript/JavaScript Code
- **Variables & Functions**: `camelCase`
- **Classes & Components**: `PascalCase`
- **Constants**: `UPPER_CASE` (for true constants)
- **Type/Interface Names**: `PascalCase`

### When to Use Exceptions

#### ✅ **snake_case is Required For:**

1. **Database Column Names**
   - Must match PostgreSQL schema exactly
   - Examples: `is_hidden`, `avg_rating`, `user_name`, `created_at`

2. **Supabase Generated Types**
   - Auto-generated from database schema
   - Files: `src/integrations/supabase/types.ts`, `src/shared/services/supabase/types.ts`
   - Must match database schema exactly

3. **API Request/Response Fields**
   - When external APIs require snake_case
   - Examples: `user_rating`, `user_wins`, `user_losses` in export/import operations

4. **String Keys Used as Identifiers**
   - When snake_case keys are used as string literals throughout the codebase
   - Examples: `top_rated`, `trending_up`, `most_selected` (insight tag strings)

5. **CSS Class Names**
   - When CSS classes use snake_case for consistency
   - Examples: `.performance-badge-top_rated`, `.performance-badge-trending_up`

#### ✅ **UPPER_CASE is Required For:**

1. **True Constants**
   - Values that never change
   - Examples: `USER_ROLES.USER`, `STORAGE_KEYS.THEME`

2. **Enum-like Objects**
   - When using `as const` for type safety
   - Examples: `FILTER_OPTIONS`, `ELO_RATING`

---

## Suppressing Linting Warnings

### File-Level Suppressions

Use `biome-ignore-file` for entire files that are auto-generated or must match external schemas:

```typescript
/**
 * Auto-generated Supabase types file.
 * All snake_case field names match database column names exactly and cannot be changed.
 */
/* biome-ignore-file lint/style/useNamingConvention: Generated Supabase types must match database schema exactly */

type Json = string | number | boolean | null;
export type Database = {
  // ... snake_case fields required
};
```

**When to Use:**
- Auto-generated files (Supabase types, API clients)
- Files where the majority of identifiers must use non-standard naming
- Files that are external dependencies or generated code

**Files Using This:**
- `src/integrations/supabase/types.ts`
- `src/shared/services/supabase/types.ts`

### Line-Level Suppressions

Use `biome-ignore` for specific identifiers that must match external systems:

```typescript
export interface NameItem {
  name: string;
  // biome-ignore lint/style/useNamingConvention: Database column names must match exactly
  is_hidden?: boolean;
  // biome-ignore lint/style/useNamingConvention: Database column names must match exactly
  avg_rating?: number;
}
```

**When to Use:**
- Individual properties that must match database columns
- Individual properties that must match API contracts
- Individual string keys used as identifiers

### Const Declaration Suppressions

For objects where all keys must use snake_case:

```typescript
// Category keys use snake_case to match insight tag strings used throughout the codebase
// biome-ignore lint/style/useNamingConvention: Keys must match insight tag strings exactly
const INSIGHT_CATEGORIES: Record<string, InsightCategory> = {
  top_rated: { /* ... */ },
  trending_up: { /* ... */ },
  // ... all keys use snake_case
};
```

**When to Use:**
- Objects where all keys must match external string identifiers
- Objects used as lookup tables with string keys

---

## Examples from Codebase

### Database Column Names

```typescript
// src/types/components.ts
export interface NameItem {
  // biome-ignore lint/style/useNamingConvention: Database column names must match exactly
  is_hidden?: boolean;
  // biome-ignore lint/style/useNamingConvention: Database column names must match exactly
  avg_rating?: number;
  // biome-ignore lint/style/useNamingConvention: Database column names must match exactly
  popularity_score?: number;
}
```

### Export/Import Data Structures

```typescript
// src/shared/utils/core/export.ts
export interface ExportNameItem {
  name: string;
  // biome-ignore lint/style/useNamingConvention: Database column names must match exactly
  user_rating?: number;
  // biome-ignore lint/style/useNamingConvention: Database column names must match exactly
  avg_rating?: number;
  // biome-ignore lint/style/useNamingConvention: Database column names must match exactly
  user_wins?: number;
  // biome-ignore lint/style/useNamingConvention: Database column names must match exactly
  user_losses?: number;
}
```

### Insight Tag Strings

```typescript
// src/shared/utils/core/metrics.ts
// Category keys use snake_case to match insight tag strings used throughout the codebase
// biome-ignore lint/style/useNamingConvention: Keys must match insight tag strings exactly
const INSIGHT_CATEGORIES: Record<string, InsightCategory> = {
  top_rated: {
    label: "Top Rated",
    // ...
  },
  trending_up: {
    label: "Trending Up",
    // ...
  },
  // ...
};
```

### Constants

```typescript
// src/core/constants/index.ts
// Constants use UPPER_CASE keys (intentional for role constants)
const USER_ROLES = {
  // biome-ignore lint/style/useNamingConvention: Role constants use UPPER_CASE convention
  USER: "user",
  // biome-ignore lint/style/useNamingConvention: Role constants use UPPER_CASE convention
  MODERATOR: "moderator",
  // biome-ignore lint/style/useNamingConvention: Role constants use UPPER_CASE convention
  ADMIN: "admin",
} as const;
```

---

## Best Practices

### ✅ Do

1. **Always add a comment explaining WHY** the suppression is needed
   ```typescript
   // biome-ignore lint/style/useNamingConvention: Database column names must match exactly
   ```

2. **Use file-level suppressions** for generated files or files where most identifiers need exceptions

3. **Use line-level suppressions** for individual properties that must match external systems

4. **Document the reason** in the comment - future developers need to understand why

5. **Group related suppressions** with a comment explaining the pattern

### ❌ Don't

1. **Don't suppress warnings** just because you prefer a different naming style
   - Only suppress when there's a technical requirement (database, API, etc.)

2. **Don't use blanket suppressions** without understanding what you're suppressing

3. **Don't remove suppressions** without verifying the external system still requires that naming

4. **Don't convert database column names** to camelCase - they must match the schema

5. **Don't suppress warnings** for code you control - fix the naming instead

---

## Maintenance

### When Adding New Code

1. **Check if the identifier** must match an external system (database, API, etc.)
2. **If yes**: Add appropriate suppression with explanation
3. **If no**: Use standard camelCase naming

### When Reviewing Code

1. **Verify suppressions** have explanatory comments
2. **Confirm the external requirement** still exists
3. **Check if the suppression** is at the right level (file vs line)

### When Updating Database Schema

1. **Update TypeScript types** to match new column names
2. **Update suppression comments** if naming changes
3. **Update all references** to the changed identifiers

---

## Current Statistics

- **Total Warnings**: ~797 (mostly intentional snake_case/UPPER_CASE)
- **Files with File-Level Suppressions**: 2 (Supabase generated types)
- **Common Suppression Reasons**:
  - Database column names: ~60%
  - Generated types: ~20%
  - String identifier keys: ~15%
  - Constants: ~5%

---

## Related Documentation

- [Development Guide](./DEVELOPMENT.md) - General coding standards
- [Architecture Overview](./ARCHITECTURE.md) - System design principles
- [Maintainability Review](./MAINTAINABILITY_REVIEW.md) - Code quality guidelines

---

## Questions?

If you're unsure whether to suppress a naming convention warning:

1. **Check if it matches an external system** (database, API, generated code)
2. **Look for similar patterns** in the codebase
3. **Ask in code review** - better to ask than suppress incorrectly
4. **Document your decision** - future you will thank present you
