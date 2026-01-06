# 00 — System Truths (V2)

> **What the first pass failed to say clearly.**

---

## What This System Is Actually Optimized For

The first pass described the tech stack. It did not describe what the system *rewards*.

### The system rewards:
1. **Adding features quickly** — The architecture makes it easy to add new views, new components, new CSS. There are no gates.
2. **Local autonomy** — Each feature folder can do whatever it wants. No shared contracts enforce consistency.
3. **Avoiding deletion** — Dead code persists because nothing enforces removal. The 1865-line `CommonUI.module.css` still exists despite being unused.

### The system punishes:
1. **Refactoring** — Changing shared code is risky because dependencies are implicit. The 876-line `nameManagementCore.tsx` persists because splitting it requires understanding all consumers.
2. **Consistency** — There's no enforcement mechanism. Component sizes range from 33 to 876 lines. CSS modules range from 30 to 3371 lines.
3. **New contributors** — The codebase has no discoverable rules. You learn by reading existing code, which teaches inconsistency.

---

## Implicit Design Decisions (Never Made Explicit)

The first pass listed technologies. It did not identify decisions that were made *by default*.

| Decision | How It Was Made | Consequence |
|----------|-----------------|-------------|
| **No component size limit** | Never discussed | 876-line components exist |
| **No CSS module size limit** | Never discussed | 3371-line CSS files exist |
| **Feature folders own everything** | Emerged organically | `tournament/` has 67KB of CSS, `shared/` has 33KB of orphaned CSS |
| **Zustand for all state** | Explicit choice | Good. But store is 483 lines with no slice boundaries |
| **CSS Modules + Tailwind hybrid** | Emerged organically | Unclear when to use which. Both are used inconsistently |
| **No barrel file policy** | Never discussed | Some folders have `index.ts`, some don't. Import paths are inconsistent |

---

## Where Defaults Act as Design Decisions

### React defaults:
- **No component boundaries** → Components grow until someone notices
- **No render optimization** → `useMemo` and `useCallback` are used inconsistently
- **No error boundary strategy** → One exists at root, but feature-level boundaries are ad-hoc

### Vite/Build defaults:
- **No bundle analysis** → 1.17MB JS bundle is accepted without question
- **No CSS purging** → 320KB CSS bundle includes dead code
- **No code splitting strategy** → Only `Dashboard` is lazy-loaded

### Supabase defaults:
- **Client-side queries everywhere** → No server-side rendering, no edge functions
- **No query caching strategy** → TanStack Query is used, but stale times are arbitrary (5 minutes everywhere)

---

## Fragile vs Resilient Parts

### Fragile (breaks easily, hard to fix):

| Area | Why It's Fragile |
|------|------------------|
| `nameManagementCore.tsx` | 876 lines, 3 modes interleaved, context + hooks + types in one file |
| `TournamentSetup.module.css` | 3371 lines, no organization, selectors likely conflict |
| `useAppStore.ts` | 483 lines, no slice separation, actions mixed with state |
| Theme system | Tokens in `design-tokens.css` AND `themes.css`, unclear which is source of truth |
| Type definitions | Split across `propTypes.ts`, `types/store.ts`, inline in `App.tsx` |

### Resilient (survives change):

| Area | Why It's Resilient |
|------|---------------------|
| `Loading/`, `Toast/`, `Error/` | Extracted, focused, single-purpose |
| Supabase client | Centralized in `services/supabase/`, clear API surface |
| Design tokens (spacing, typography) | Well-defined scale, consistently used |
| Error handling | `neverthrow` + `ErrorManager` provides consistent patterns |

---

## What the First Pass Failed to Question

### 1. Why does `CommonUI.module.css` still exist?
The first pass noted it was "orphaned" but didn't ask why it wasn't deleted. **Answer**: No one owns cleanup. The decomposition PR was merged without verifying all artifacts were removed.

### 2. Why is `nameManagementCore.tsx` 876 lines?
The first pass said "needs splitting" but didn't ask why it grew this large. **Answer**: It handles tournament mode, profile mode, and analysis mode in one file. The modes share some logic, so someone decided to keep them together. This was a mistake.

### 3. Why are there two 3000+ line CSS files?
The first pass documented sizes but didn't ask why. **Answer**: CSS was added incrementally. No one audited. No one owns CSS architecture. The files grew because nothing stopped them.

### 4. Why is the store 483 lines with no slices?
The first pass praised Zustand but didn't examine the implementation. **Answer**: All state was added to one store because it was convenient. There's no policy for when to create separate stores or slices.

### 5. Why are types scattered across 4+ locations?
The first pass mentioned "type consolidation" but didn't ask why types are scattered. **Answer**: Types were added where they were needed. No one decided where types should live. `propTypes.ts`, `types/store.ts`, `types/shims.d.ts`, and inline types in `App.tsx` all exist.

---

## The Hard Truth

**This codebase has no governance.**

It has good tools (Zustand, TanStack Query, Vite, TypeScript). It has good patterns in some places (extracted components, design tokens). But it has no rules that prevent drift.

The first pass was too polite. It described problems as "opportunities" and suggested "guidelines." Guidelines without enforcement are wishes.

**What's needed:**
1. Hard limits (not guidelines) on file sizes
2. Mandatory cleanup in the same PR as refactoring
3. Clear ownership of CSS architecture
4. A decision about where types live
5. A policy for when to create new stores vs. extend existing ones

The system will continue to degrade until these are enforced, not suggested.
