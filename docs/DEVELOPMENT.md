# Development Guide & Standards

**Last Updated:** January 2026
**Status:** Primary Reference for Developers

This document provides a comprehensive guide for setting up, developing, maintaining, and optimizing the Naming Nosferatu application.

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

## 📦 Dependency Management & Optimization

### Current Bundle Status
- **Bundle Size**: 391KB total (48% optimized)
- **Goal**: Reduce bundle while maintaining functionality
- **Target**: <368KB total through systematic optimization

### Production Dependencies Analysis

#### ✅ Core Dependencies (Keep)
- **React 19.2.3** - Framework core
- **@supabase/supabase-js 2.90.0** - Backend
- **@tanstack/react-query 5.90.16** - Server state
- **zustand 5.0.9** - Client state
- **zod 4.3.5** - Schema validation
- **react-router-dom 6.21.3** - Routing
- **tailwindcss 4.1.18** - Styling

#### 🔄 Consolidation Opportunities

**Icon Libraries (2 packages - 15KB estimated)**
```
@heroicons/react    2.2.0  - HeroIcons (React components)
lucide-react       0.562.0 - Lucide icons (SVG-based)
```
**Recommendation:** Consolidate to `lucide-react` only
- Lucide is more comprehensive (1,000+ icons vs HeroIcons 200+)
- Tree-shakeable and smaller bundle impact
- Consistent API across the app
**Savings:** ~8KB, 1 package removed

**Form Handling (3 packages - 25KB estimated)**
```
react-hook-form     7.49.3  - Form state management
@hookform/resolvers 5.2.2   - Validation resolvers
zod                 4.3.5   - Schema validation (already kept)
```
**Recommendation:** Keep all - they're complementary
- RHF handles form state, resolvers integrate Zod
- Together they provide excellent DX and performance

**Animation & Interaction (2 packages - 35KB estimated)**
```
framer-motion       12.24.10 - Animation library
@hello-pangea/dnd   18.0.1   - Drag and drop
```
**Recommendation:** Keep both - distinct use cases
- Framer Motion for UI animations/transitions
- DND for tournament bracket reordering

#### ❌ Safe Removals (10KB estimated savings)

**Questionable Dependencies**
```
prop-types        15.8.1  - Runtime prop validation
immer             11.1.3  - Immutable state updates
lovable-tagger    1.1.13  - Unknown purpose (check usage)
```
**Recommendations:**
- **prop-types:** Remove if using TypeScript consistently (you are)
- **immer:** Remove if Zustand's immer middleware isn't used
- **lovable-tagger:** Audit usage - may be dev tooling

### Dev Dependencies Optimization

#### ✅ Essential Tooling (Keep)
- **@biomejs/biome 2.3.11** - Linter/formatter
- **typescript 5.9.3** - Type checking
- **vitest 4.0.16** - Testing
- **@testing-library/react 16.3.1** - Component testing
- **knip 5.80.0** - Dead code detection

#### ❌ Legacy/Unused Dev Tools (5KB estimated savings)
```
babel-plugin-transform-react-remove-prop-types 0.4.24
stylelint                                      16.26.1
stylelint-config-standard                      39.0.1
```
**Recommendations:**
- **babel-plugin:** Remove if not using Babel (you're using SWC)
- **stylelint:** Remove if Biome handles CSS linting adequately

### Dependency Optimization Phases

#### Phase 1: Safe Removals (Immediate - ~10KB savings)
```bash
pnpm remove prop-types immer lovable-tagger
pnpm remove babel-plugin-transform-react-remove-prop-types
```

**Verification Steps:**
1. Run `pnpm run build` - ensure no build errors
2. Run `pnpm run test` - ensure tests pass
3. Check bundle size reduction

#### Phase 2: Icon Consolidation (Week 2 - ~8KB savings)
1. **Audit current icon usage:**
   ```bash
   grep -r "@heroicons/react" src/ | wc -l
   grep -r "lucide-react" src/ | wc -l
   ```

2. **Migration plan:**
   - Map HeroIcons to Lucide equivalents
   - Update imports systematically
   - Test all icon usage

3. **Remove @heroicons/react**

#### Phase 3: Dev Tool Cleanup (Week 3 - ~5KB savings)
1. **Verify Biome handles your CSS needs**
2. **Remove stylelint** if coverage is adequate
3. **Update build scripts** if needed

### Bundle Size Projections
- **Current:** 391KB total
- **After Phase 1:** ~381KB (-10KB, -2.5%)
- **After Phase 2:** ~373KB (-8KB, -2%)
- **After Phase 3:** ~368KB (-5KB, -1.5%)
- **Total Savings:** ~23KB (-6% of bundle)

### Maintenance Benefits
- **Fewer dependencies** = fewer security updates
- **Single icon system** = consistent API
- **Cleaner dev experience** = faster installs

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
- `.dev/`: Development configuration, workflows, and rules.