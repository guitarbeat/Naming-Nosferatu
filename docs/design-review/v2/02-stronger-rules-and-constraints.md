# 02 — Stronger Rules and Constraints (V2)

> **Replace flexibility with intention. This document is opinionated by design.**

---

## Philosophy

The first pass suggested "guidelines." Guidelines are ignored under pressure.

This document defines **rules**. Rules have consequences. If a rule can't be enforced, it's not a rule—it's a wish.

---

## File Size Rules (Enforced)

### Components: 400 lines hard limit

```
✅ ALLOWED: Components ≤ 400 lines
⚠️ WARNING: Components 300-400 lines (split soon)
❌ BLOCKED: Components > 400 lines (must split before merge)
```

**Enforcement**: ESLint rule or pre-commit hook.

**Why 400, not 300?** 
- 300 is aspirational. 400 is practical.
- A component with types, hooks, and JSX legitimately needs ~300 lines.
- 400 gives buffer without enabling 800-line monsters.

**Current violations** (must be split):
| File | Lines | Action |
|------|-------|--------|
| `nameManagementCore.tsx` | 876 | Split by mode |
| `AnalysisUI.tsx` | 722 | Extract sub-components |
| `AnalysisDashboard.tsx` | 698 | Extract sub-components |
| `Tournament.tsx` | 696 | Extract match logic |
| `useProfile.ts` | 624 | Split by concern |
| `TournamentToolbar.tsx` | 601 | Extract sections |
| `Button.tsx` | 562 | Extract variants |

---

### CSS Modules: 500 lines hard limit

```
✅ ALLOWED: CSS modules ≤ 500 lines
⚠️ WARNING: CSS modules 400-500 lines (audit for dead code)
❌ BLOCKED: CSS modules > 500 lines (must split or purge)
```

**Enforcement**: Stylelint rule or CI check.

**Current violations** (must be addressed):
| File | Lines | Action |
|------|-------|--------|
| `TournamentSetup.module.css` | 3371 | Audit + split |
| `Tournament.module.css` | 1723 | Audit + split |
| `CommonUI.module.css` | 1865 | **DELETE** (unused) |
| `CardName.module.css` | 1048 | Audit + split |
| `AnalysisUI.module.css` | 825 | Audit + split |

---

### Stores: 200 lines per slice

```
✅ ALLOWED: Store slices ≤ 200 lines
❌ BLOCKED: Monolithic stores > 400 lines
```

**Current violation**: `useAppStore.ts` at 483 lines must be split into slices.

---

## CSS Architecture Rules (Enforced)

### Rule 1: CSS Modules for component-specific styles

```css
/* ✅ CORRECT: Component-scoped styles */
.tournamentCard { ... }
.tournamentCard:hover { ... }

/* ❌ WRONG: Global styles in CSS Module */
body { ... }
.app { ... }
```

### Rule 2: Tailwind for layout utilities only

```jsx
/* ✅ CORRECT: Layout utilities */
<div className="flex items-center gap-4">

/* ❌ WRONG: Tailwind for component styling */
<button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-md">
```

**Why?** Tailwind classes for styling create inconsistency. Use design tokens in CSS Modules instead.

### Rule 3: Design tokens are the only source of truth

```css
/* ✅ CORRECT: Use tokens */
.button {
  padding: var(--spacing-button-padding-y) var(--spacing-button-padding-x);
  border-radius: var(--radius-button);
  transition: var(--transition-base);
}

/* ❌ WRONG: Magic numbers */
.button {
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}
```

### Rule 4: Theme tokens live in `themes.css` only

```
design-tokens.css → Universal values (spacing, typography, timing)
themes.css → Theme-variant values (colors, glass effects, shadows)
```

**No exceptions.** If a value changes between light/dark mode, it belongs in `themes.css`.

---

## Type Definition Rules (Enforced)

### Rule 1: Types live in predictable locations

```
src/types/
├── store.ts       # All Zustand store types
├── api.ts         # All API response types
├── components.ts  # Shared component prop types
└── index.ts       # Re-exports
```

### Rule 2: Co-located types for single-use

```tsx
/* ✅ CORRECT: Type used only in this file */
interface TournamentMatchProps {
  left: NameItem;
  right: NameItem;
  onVote: (winner: 'left' | 'right') => void;
}

export function TournamentMatch({ left, right, onVote }: TournamentMatchProps) { ... }
```

### Rule 3: Shared types must be exported from `src/types/`

```tsx
/* ❌ WRONG: Shared type defined in component file */
// In TournamentMatch.tsx
export interface NameItem { ... }

/* ✅ CORRECT: Shared type in types directory */
// In src/types/components.ts
export interface NameItem { ... }

// In TournamentMatch.tsx
import type { NameItem } from '@/types';
```

### Rule 4: Delete `propTypes.ts`

This file is a legacy artifact. Its contents should be merged into `src/types/components.ts`.

---

## Component Composition Rules (Enforced)

### Rule 1: One mode per component

```
/* ❌ WRONG: Multi-mode component */
function NameManagement({ mode }: { mode: 'tournament' | 'profile' | 'analysis' }) {
  if (mode === 'tournament') { ... }
  if (mode === 'profile') { ... }
  if (mode === 'analysis') { ... }
}

/* ✅ CORRECT: Mode-specific components */
function TournamentNameManagement() { ... }
function ProfileNameManagement() { ... }
function AnalysisNameManagement() { ... }

// Router decides which to render
function NameManagementRouter({ mode }) {
  const Component = {
    tournament: TournamentNameManagement,
    profile: ProfileNameManagement,
    analysis: AnalysisNameManagement,
  }[mode];
  return <Component />;
}
```

### Rule 2: Hooks return data, not JSX

```tsx
/* ❌ WRONG: Hook returns JSX */
function useTournament() {
  return {
    TournamentUI: () => <div>...</div>,
    ...
  };
}

/* ✅ CORRECT: Hook returns data */
function useTournament() {
  return {
    currentMatch,
    handleVote,
    progress,
  };
}
```

### Rule 3: Context for dependency injection, not state sharing

```tsx
/* ❌ WRONG: Context as global state */
const AppContext = createContext({ user, tournament, ui, ... });

/* ✅ CORRECT: Context for dependency injection */
const ToastContext = createContext({ showToast });
const ThemeContext = createContext({ theme, setTheme });
```

Use Zustand for state. Use Context for injecting services/callbacks.

---

## We Do NOT Do This (Explicit Prohibitions)

### ❌ Inline styles (except dynamic values)

```tsx
/* ❌ PROHIBITED */
<div style={{ padding: '16px', backgroundColor: '#f0f0f0' }}>

/* ✅ ALLOWED: Dynamic values only */
<div style={{ transform: `translateX(${offset}px)` }}>
```

### ❌ CSS-in-JS libraries

No styled-components, Emotion, or similar. CSS Modules + Tailwind is the stack.

### ❌ `any` type without comment

```tsx
/* ❌ PROHIBITED */
const data: any = response;

/* ✅ ALLOWED: With justification */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response; // Legacy API returns untyped data, TODO: add types
```

### ❌ Barrel files that re-export everything

```tsx
/* ❌ PROHIBITED */
// index.ts
export * from './ComponentA';
export * from './ComponentB';
export * from './ComponentC';

/* ✅ ALLOWED: Explicit exports */
// index.ts
export { ComponentA } from './ComponentA';
export { ComponentB } from './ComponentB';
export type { ComponentAProps } from './ComponentA';
```

### ❌ Feature folders without consistent structure

Every feature folder must have:
```
features/[name]/
├── components/     # Feature-specific components
├── hooks/          # Feature-specific hooks
├── [Name].tsx      # Main feature component
├── [Name].module.css  # Feature styles (≤500 lines)
└── index.ts        # Public exports
```

### ❌ TODO comments without issue links

```tsx
/* ❌ PROHIBITED */
// TODO: Fix this later

/* ✅ ALLOWED */
// TODO(#123): Fix race condition in vote handler
```

---

## Decisions Made Once (Never Revisit)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | Zustand | Already adopted, works well |
| Data fetching | TanStack Query | Already adopted, works well |
| Styling | CSS Modules + Tailwind utilities | Hybrid is fine, rules clarify usage |
| Build tool | Vite | No reason to change |
| Type checking | TypeScript strict mode | Already enabled |
| Linting | Biome | Already adopted |
| Component library | None (custom) | HeroUI used sparingly, no full adoption |

**These are closed decisions.** Don't propose alternatives. Improve what exists.

---

## Enforcement Mechanisms

| Rule | Enforcement | Consequence |
|------|-------------|-------------|
| File size limits | ESLint/CI | PR blocked |
| CSS size limits | Stylelint/CI | PR blocked |
| Type locations | Code review | PR blocked |
| No inline styles | ESLint | Auto-fix or PR blocked |
| No `any` without comment | TypeScript + ESLint | PR blocked |
| Feature folder structure | Code review | PR blocked |
| TODO format | ESLint | Warning (not blocking) |

---

## What Changed from First Pass

| First Pass Said | V2 Says |
|-----------------|---------|
| "300-line guideline" | 400-line hard limit, enforced |
| "Audit large CSS files" | 500-line hard limit, enforced |
| "Consider type consolidation" | Types live in `src/types/`, delete `propTypes.ts` |
| "Mode-based decomposition" | One mode per component, no exceptions |
| "Document guidelines" | Enforce rules via tooling |

The first pass was advisory. This pass is prescriptive.
