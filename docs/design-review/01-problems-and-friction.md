# 01 — Problems and Friction

> **Purpose**: Identify what is *not working well* and rank problems by leverage.

---

## Problem 1: CSS File Bloat and Fragmentation

### Description
Three CSS module files are disproportionately large, suggesting accumulated styles without pruning:
- `TournamentSetup.module.css` — **67KB** (2,200+ lines estimated)
- `Tournament.module.css` — **35KB**
- `CommonUI.module.css` — **33KB**

### Why It Matters
| Impact | Severity |
|--------|----------|
| **DX** | Difficult to locate and modify styles; high cognitive load |
| **Maintainability** | Dead code accumulates; conflicting selectors likely |
| **Performance** | Larger CSS bundles (though modules help with tree-shaking) |

### Evidence
- File sizes are 3-6× larger than typical component-scoped modules
- Multiple past conversations reference "cleanup" and "consolidation" efforts
- Token system exists but large files suggest ad-hoc values alongside tokens

### Leverage
🟢 **High** — Reducing CSS entropy directly improves maintainability and DX. One pass could yield significant simplification.

---

## Problem 2: CommonUI.tsx is a Monolith

### Description
`CommonUI.tsx` consolidates Loading, Toast, and Error components into **807 lines**. While consolidation can be good, this file:
- Contains multiple unrelated components (Loading, Toast, ToastContainer, Error, ErrorList, ErrorBoundaryFallback)
- Includes internal hooks (`useReducedMotion`, `useScreenSize`)
- Mixes presentation and utility logic

### Why It Matters
| Impact | Severity |
|--------|----------|
| **DX** | Hard to navigate; imports from one file get all components |
| **Testability** | Testing individual components requires importing 800 lines |
| **Tree-shaking** | All components bundled together |

### Evidence
- Outline shows 35+ items (functions, interfaces) in a single file
- Related CSS file (`CommonUI.module.css`) is 33KB
- Pattern deviates from other components (e.g., `Button/Button.tsx`)

### Leverage
🟢 **High** — Splitting into focused modules (e.g., `Loading/`, `Toast/`, `Error/`) aligns with existing folder structure and improves isolation.

---

## Problem 3: Inline Styles in App.tsx

### Description
The root `App.tsx` uses inline styles for the loading state:

```tsx
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    width: "100vw",
  }}
>
```

### Why It Matters
| Impact | Severity |
|--------|----------|
| **Consistency** | Violates the established pattern of using CSS variables/utilities |
| **Maintainability** | One-off styles that won't benefit from design system updates |

### Evidence
- `utilities.css` already has `.fullScreenCenter` class with identical styles
- Token system provides `--space-*` and flex utilities

### Leverage
🟡 **Medium** — Small fix, but demonstrates pattern drift that should be corrected.

---

## Problem 4: Duplicate or Ambiguous Type Definitions

### Description
Both `src/shared/propTypes.ts` and `src/types/` exist for type definitions. This creates ambiguity:
- `propTypes.ts` (2.4KB) — likely legacy PropTypes or shared interfaces
- `types/store.ts` — Zustand store types
- Inline interfaces in components (e.g., `StoreSlice` in `App.tsx`)

### Why It Matters
| Impact | Severity |
|--------|----------|
| **DX** | Unclear where to define or find types |
| **Type Safety** | Inline types may drift from source of truth |

### Evidence
- `App.tsx` defines `UserState`, `TournamentState`, `StoreSlice` inline (lines 48-103)
- These likely duplicate or extend types in `types/store.ts`

### Leverage
🟡 **Medium** — Consolidating types improves discoverability and consistency.

---

## Problem 5: Inconsistent Component Folder Structure

### Description
Component organization lacks consistency:
- Some components are directories with index files (`Button/Button.tsx`)
- Some are flat files (`CommonUI.tsx`)
- Some have co-located CSS modules, some don't

### Why It Matters
| Impact | Severity |
|--------|----------|
| **DX** | New contributors must learn multiple patterns |
| **Maintainability** | No predictable location for tests, stories, or styles |

### Evidence
```
shared/components/
├── Button/                     # Directory pattern ✓
│   └── Button.tsx
├── Card/                       # Directory pattern ✓
│   ├── Card.tsx
│   ├── Card.module.css
│   └── components/
├── CommonUI.tsx                # Flat file ✗
├── CommonUI.module.css         # Orphaned alongside flat file
├── ErrorBoundary/              # Directory pattern ✓
│   └── ErrorBoundary.tsx
```

### Leverage
🟡 **Medium** — Establishing consistent patterns reduces friction for future development.

---

## Problem 6: Missing Unit Tests

### Description
The `test/` directory contains only documentation files:
- `clean-code.mdc`
- `code-quality.mdc`
- `create-prd.md`
- `generate-tasks.md`

No actual test files (`.test.tsx`, `.spec.ts`) were found.

### Why It Matters
| Impact | Severity |
|--------|----------|
| **Quality** | No regression protection |
| **CI/CD** | `npm run test` may pass vacuously |
| **Refactoring** | High-risk changes without safety net |

### Evidence
- `README.md` claims 85% test coverage
- Vitest configured in `config/vitest.config.mjs`
- No test files found in `src/` or `test/`

### Leverage
🔴 **Highest (but out of scope)** — Critical gap, but addressing it is a separate initiative, not part of this design refinement pass.

---

## Problem 7: Theme Token Duplication

### Description
`themes.css` duplicates token values already defined in `design-tokens.css`:
- `--glass-bg`, `--glass-border`, `--glass-blur` appear in both files
- Theme file overrides tokens rather than extending them

### Why It Matters
| Impact | Severity |
|--------|----------|
| **Maintainability** | Two places to update the same value |
| **Clarity** | Unclear which file is source of truth for theming |

### Evidence
- `design-tokens.css` lines 362-373: glass token definitions
- `themes.css` lines 61-70 (light), 157-167 (dark): identical token names with theme-specific values

### Leverage
🟢 **High** — Refactoring to a single pattern (tokens define defaults, themes override) reduces entropy.

---

## Summary: Ranked by Leverage

| Rank | Problem | Leverage | Effort |
|------|---------|----------|--------|
| 1 | CSS File Bloat | 🟢 High | Medium |
| 2 | CommonUI.tsx Monolith | 🟢 High | Low-Medium |
| 3 | Theme Token Duplication | 🟢 High | Low |
| 4 | Inline Styles in App.tsx | 🟡 Medium | Very Low |
| 5 | Type Definition Ambiguity | 🟡 Medium | Low |
| 6 | Inconsistent Folder Structure | 🟡 Medium | Low |
| 7 | Missing Unit Tests | 🔴 Critical | High (out of scope) |
