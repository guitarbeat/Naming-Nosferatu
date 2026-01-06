# 02 — Design and Architecture Strategy

> **Purpose**: Define the improvement strategy before touching code.

---

## What Stays the Same (Explicitly Preserved)

These decisions are intentional and will **not** be changed in this pass:

| Decision | Rationale |
|----------|-----------|
| **TailwindCSS + CSS Modules hybrid** | Provides both utility-first speed and scoped component styles |
| **Zustand for global state** | Lightweight, performant, well-integrated |
| **HeroUI component library** | Used for select components; not enough value to migrate away |
| **design-tokens.css as source of truth** | Well-structured token system worth preserving |
| **Framer Motion for animations** | Mature library, deeply integrated |
| **Supabase backend** | Core dependency, out of scope for this pass |
| **File naming conventions** | PascalCase for components, camelCase for utilities |

---

## What Evolves (Patterns to Be Tightened)

### 1. CSS Token Usage
**Current**: Tokens exist but large CSS files contain many ad-hoc values
**Evolution**: 
- All color, spacing, and typography values should reference tokens
- Theme-specific tokens should only appear in `themes.css`
- Component CSS should only use semantic tokens

### 2. Component File Structure
**Current**: Mix of flat files and directory structures
**Evolution**:
```
ComponentName/
├── ComponentName.tsx         # Main component
├── ComponentName.module.css  # Scoped styles
├── index.ts                  # Re-export
└── ComponentName.test.tsx    # (future: tests)
```

### 3. CommonUI Decomposition
**Current**: 807-line monolith with Loading, Toast, Error, hooks
**Evolution**:
- Extract into focused modules within existing folder structure
- Each component gets its own directory
- Shared hooks move to `shared/hooks/`

### 4. Type Definitions
**Current**: Types scattered across `propTypes.ts`, `types/`, and inline
**Evolution**:
- All shared types in `src/types/`
- Component-specific types co-located with component
- Remove `propTypes.ts` if it only contains TypeScript interfaces

---

## Constraints to Introduce

### Spacing Constraint
> All margin, padding, and gap values MUST use `--space-*` tokens.

**Enforcement**: Lint rule (future) or code review
**Allowed values**: `--space-0` through `--space-48`
**Exception**: None in new code

### Typography Constraint
> All font-size values MUST use `--text-*` tokens.

**Allowed values**: `--text-xs` through `--text-5xl`, `--text-responsive-*` for fluid sizing
**Exception**: None in new code

### Color Constraint
> All color values MUST reference color tokens.

**Allowed values**:
- Semantic: `--text-primary`, `--text-secondary`, `--border-color`, `--surface-*`
- Brand: `--neon-cyan`, `--hot-pink`, `--fire-red`
- Status: `--color-success`, `--color-error`, `--color-warning`

**Exception**: `transparent`, `currentColor`, `inherit`

### Component Boundary Constraint
> Components with more than 300 lines should be split.

**Rationale**: 300 lines is a reasonable threshold for maintainability
**Exception**: Complex data visualization components

---

## Design Principles Guiding Decisions

### 1. Clarity over Cleverness
Prefer explicit, readable code over abstractions that obscure intent.

### 2. Reduce Degrees of Freedom
Fewer choices = more consistency. Token system exists to constrain decisions.

### 3. Colocation over Centralization
Styles, types, and tests should live near the code they support.

### 4. Delete Before Abstract
If code is unused or duplicated, remove it. Only abstract when three or more instances exist.

### 5. Accessibility is Non-Negotiable
Focus states, touch targets, and screen reader support are not optional.

---

## What is Intentionally NOT Addressed

| Topic | Why Not Now |
|-------|-------------|
| **Test coverage** | Requires dedicated effort; this pass focuses on structural clarity |
| **Bundle optimization** | Already at 391KB (excellent); no immediate need |
| **Supabase schema changes** | Backend is out of scope |
| **HeroUI replacement** | Low ROI; components work fine |
| **Animation refactoring** | Framer Motion integration is stable |
| **Dark mode fixes** | Theme system works; only token organization changes |
| **New features** | This is a refinement pass, not feature work |

---

## Success Criteria

After this pass, the codebase should:

1. ✅ Have no CSS files over 25KB
2. ✅ Have no component files over 400 lines
3. ✅ Use tokens exclusively (no hardcoded colors, spacing, or font sizes in new/modified code)
4. ✅ Follow consistent folder structure for shared components
5. ✅ Have clear type definition locations
6. ✅ Be easier to navigate for new contributors
