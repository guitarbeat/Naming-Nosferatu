# Development Guide & Standards

**Last Updated:** 2026-01-07
**Status:** Primary Reference for Developers

This document provides a single source of truth for setting up, developing, and maintain the Naming Nosferatu application.

---

## 🚀 Quick Start

### 📦 Prerequisites
- **Node.js**: >= 20.0.0
- **pnpm**: >= 10.0.0
- **Supabase CLI**: (Optional, for local development)

### 🛠️ Commands
| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start Vite dev server with HMR |
| `pnpm run build` | Production build |
| `pnpm run lint` | Run Biome linter and TypeScript checks |
| `pnpm run fix` | Auto-fix linting issues |
| `pnpm run test` | Run Vitest suite |
| `pnpm run check` | Run all checks (lint, types, limits, deps) |

---

## 🏗️ Coding Standards

### 1. File Size Limits
To prevent "Mega-files," we enforce limits in `scripts/enforce-limits.js`:
- **Components (.tsx/.ts)**: Max **400 lines**.
- **CSS Modules (.css)**: Max **750 lines**.
- **Scripts (.js)**: Max **200 lines**.

*If you hit a limit: Extract sub-components or custom hooks.*

### 2. Naming Conventions
We use **camelCase** for JS/TS identifiers, with specific exceptions:

#### ✅ Standard
- **Variables & Functions**: `camelCase`
- **Classes & Components**: `PascalCase`
- **Constants**: `UPPER_CASE`
- **TypeScript Types**: `PascalCase`

#### ⚠️ Exceptions (When to use snake_case)
- **Database Columns**: Must match PostgreSQL (`is_hidden`, `avg_rating`).
- **Supabase Generated Types**: Auto-generated fields.
- **API Contracts**: When external services require it.
- **CSS Classes**: Used for consistency in complex identifiers.

#### 🔇 Linting Suppressions
If you must use `snake_case` in a file:
```typescript
// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
const { user_name } = user;
```

---

## ✍️ Copywriting & Tone

### Tone of Voice
- **Elite/Scientific**: We use terms like "Optimal pairings," "Analytics," "Elo Ratings."
- **Playful/Cat-Focused**: Keep it light, but precise.
- **Friendly**: Error messages should be helpful, not technical jargon.

### Writing Guidelines
- **Capitalization**: Use Sentence case for headings and buttons (e.g., "Start tournament").
- **Buttons**: Use action verbs (e.g., "Vote," "Skip," "Export CSV").
- **Dates**: Use relative dates ("2 days ago") for recent events, absolute ("Jan 15, 2026") for history.
- **Placeholders**: Use `{variableName}` format consistently.

---

## 🔄 Development Workflow

### 1. Iterative Development
Working with AI agents works best in small, verifiable cycles:
1. **Plan**: Define the specific component or fix.
2. **Build**: Create the file or logic.
3. **Verify**: Run `pnpm run check` to ensure no lint/type/size violations.
4. **Iterate**: Polish and move to the next feature.

### 2. PR Checklist
- [ ] Code follows naming conventions.
- [ ] File size limits are not exceeded.
- [ ] `pnpm run check` passes with zero errors.
- [ ] Documentation (if applicable) is updated in `docs/`.

---

## 🗑️ Dead Code Analysis

### Cleanup Completed (Last Updated: 2026-01-07)

#### Removed Dead Code
- **`test/test-supabase-credentials.js`**: ✅ REMOVED - Security validation script that was a one-time verification tool with no references in package.json scripts or CI/CD.

#### Removed Unused Dependencies
- **`@heroui/react`**: ✅ REMOVED - Unused dependency identified by knip
- **`clsx`**: ✅ REMOVED - Unused dependency identified by knip  
- **`ts-pattern`**: ✅ REMOVED - Unused dependency identified by knip
- **`@testing-library/user-event`**: ✅ REMOVED - Unused dev dependency identified by knip

#### Components Verified as Active
- **`src/shared/components/Navigation/Breadcrumbs.tsx`**: ✅ CONFIRMED ACTIVE - Imported and used in `App.tsx` on line 300, displays when user is logged in.

#### Remaining Cleanup Opportunities
The codebase has several unused exports and types identified by knip, but these are intentionally kept for:
- API compatibility and future features
- Type safety and documentation
- Component interfaces that may be used by external consumers

#### Maintenance Notes
- All exports are marked with `// ts-prune-ignore-next` comments to prevent false positives from automated dead code detection
- The codebase appears well-maintained with minimal actual dead code
- Most "unused" code is either:
  - Intentionally kept for API compatibility
  - Part of planned features
  - Required by external systems (Vite, testing frameworks)

### Dead Code Prevention
- Use `pnpm run check:deps` to catch unused dependencies and exports
- Review `// ts-prune-ignore-next` comments periodically
- Remove TODO/FIXME comments after addressing issues
- Consider using tools like `ts-prune` or `knip` for automated detection

---

## 📂 Directory Structure
- `src/core/`: Global singletons (Store, API clients).
- `src/features/`: Domain-specific modules (Auth, Tournament, Profile).
- `src/shared/`: Reusable UI, hooks, and utils.
- `src/types/`: Shared TypeScript definitions.
- `docs/`: Strategic hubs for project documentation.
