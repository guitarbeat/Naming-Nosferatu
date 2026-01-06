# 03 — Refined Strategy (V2)

> **A sharper, more confident evolution plan.**

---

## What We Keep from First Pass

| Recommendation | Status | Rationale |
|----------------|--------|-----------|
| Component decomposition pattern | ✅ Keep | `Loading/`, `Toast/`, `Error/` structure works |
| Token consolidation | ✅ Keep | Single source of truth is correct |
| Delete `CommonUI.module.css` | ✅ Keep | Still unused, still 1865 lines |
| Split `nameManagementCore.tsx` | ✅ Keep | Still 876 lines, still problematic |

---

## What We Discard from First Pass

| Recommendation | Status | Rationale |
|----------------|--------|-----------|
| "Audit TournamentSetup.module.css in Pass 3" | ❌ Discard | Deferral is avoidance. Do it now. |
| "Document component size guideline" | ❌ Discard | Documentation without enforcement is useless |
| "Consider analysis consolidation" | ❌ Discard | Vague. Either do it or don't. |
| "300-line soft limit" | ❌ Discard | Soft limits are ignored. Use hard limits. |

---

## What We Strengthen from First Pass

| Original | Strengthened |
|----------|--------------|
| "Guidelines exist but not enforced" | Hard limits with CI enforcement |
| "Split components over 600 lines" | Split components over 400 lines |
| "CSS modules over 500 lines should be audited" | CSS modules over 500 lines must be split |
| "Delete orphaned files in same PR" | Orphaned files block PR merge |

---

## Non-Negotiables (Cannot Be Compromised)

### 1. File size limits are enforced by CI

No PR merges with:
- Components > 400 lines
- CSS modules > 500 lines
- Store files > 200 lines per slice

**No exceptions.** If the limit is wrong, change the limit. Don't bypass it.

### 2. Dead code is deleted immediately

When refactoring:
- Verify no imports exist
- Delete in the same PR
- CI fails if orphaned files detected

**No "cleanup later" PRs.** Cleanup happens now.

### 3. Types live in `src/types/`

All shared types. No exceptions. Co-located types only for single-file use.

`propTypes.ts` is deleted. Its contents move to `src/types/components.ts`.

### 4. One mode per component

Multi-mode components are split. `nameManagementCore.tsx` becomes:
- `TournamentNameManagement.tsx`
- `ProfileNameManagement.tsx`
- `AnalysisNameManagement.tsx`
- `shared/useNameSelection.ts` (truly shared logic)

### 5. CSS architecture is documented and enforced

- CSS Modules for component styles
- Tailwind for layout utilities only
- Design tokens for all values
- Theme tokens in `themes.css` only

---

## Component Boundaries (Clear Ownership)

### Shared Components (`src/shared/components/`)

**Purpose**: Truly reusable UI primitives.

**Allowed**:
- `Button`, `Card`, `Loading`, `Toast`, `Error`
- Components used by 3+ features
- Components with no feature-specific logic

**Not Allowed**:
- Feature-specific components
- Components with business logic
- Components used by only 1-2 features

### Feature Components (`src/features/*/components/`)

**Purpose**: Feature-specific UI.

**Allowed**:
- Components used only within that feature
- Components with feature-specific business logic

**Not Allowed**:
- Components that should be shared
- Duplicated components across features

### Decision Tree

```
Is this component used by 3+ features?
├── Yes → src/shared/components/
└── No → Is it used by 2 features?
    ├── Yes → Keep in feature, consider promoting later
    └── No → src/features/[feature]/components/
```

---

## Store Architecture (Clear Slices)

### Current (Monolith)

```
useAppStore.ts (483 lines)
├── tournament state + actions
├── user state + actions
├── ui state + actions
├── errors state + actions
└── siteSettings state + actions
```

### Target (Sliced)

```
stores/
├── useTournamentStore.ts (~150 lines)
│   ├── names, ratings, isComplete, isLoading
│   └── setNames, setRatings, resetTournament
├── useUserStore.ts (~100 lines)
│   ├── name, isLoggedIn, isAdmin
│   └── login, logout, setAdminStatus
├── useUIStore.ts (~80 lines)
│   ├── theme, showGlobalAnalytics, matrixMode
│   └── setTheme, toggleAnalytics
├── useErrorStore.ts (~50 lines)
│   ├── current, history
│   └── setError, clearError
└── index.ts (re-exports)
```

**Migration**: Create slices first, then update consumers, then delete monolith.

---

## CSS Architecture (Clear Hierarchy)

### Global Styles (`src/shared/styles/`)

```
styles/
├── design-tokens.css   # Spacing, typography, timing (universal)
├── themes.css          # Colors, glass, shadows (theme-variant)
├── reset.css           # Browser normalization
├── utilities.css       # Tailwind-like utilities
└── index.css           # Import order
```

### Component Styles (Co-located)

```
components/Button/
├── Button.tsx
├── Button.module.css   # ≤500 lines
└── index.ts
```

### Feature Styles (Co-located)

```
features/tournament/
├── Tournament.tsx
├── Tournament.module.css   # ≤500 lines
└── components/
    ├── TournamentMatch/
    │   ├── TournamentMatch.tsx
    │   └── TournamentMatch.module.css
```

---

## Scaling to Future Features

### Adding a New Feature

1. Create feature folder with standard structure:
   ```
   features/[name]/
   ├── components/
   ├── hooks/
   ├── [Name].tsx
   ├── [Name].module.css
   └── index.ts
   ```

2. Add types to `src/types/` if shared, co-locate if not.

3. Create feature-specific store slice if needed.

4. CI enforces size limits automatically.

### Adding a New Shared Component

1. Verify it's used by 3+ features (or will be).

2. Create in `src/shared/components/[Name]/`:
   ```
   [Name]/
   ├── [Name].tsx
   ├── [Name].module.css
   └── index.ts
   ```

3. Export from `src/shared/components/index.ts`.

4. Add types to `src/types/components.ts`.

---

## Intentionally Deferred (And Why)

| Item | Why Deferred |
|------|--------------|
| Bundle optimization | 1.17MB is acceptable for now. Optimize when it causes problems. |
| Server-side rendering | Not needed for this app. Client-side is fine. |
| E2E testing | Unit/integration tests first. E2E is expensive. |
| Design system documentation | Rules first, documentation second. |
| Accessibility audit | Current WCAG AA compliance is adequate. Full audit later. |
| Performance monitoring | Basic monitoring exists. Advanced APM not needed yet. |

**Deferral is not avoidance.** These items are consciously deprioritized because other work has higher leverage.

---

## Execution Order

### Phase 1: Stop the Bleeding (Week 1)

1. **Delete `CommonUI.module.css`** — 5 minutes, zero risk
2. **Add file size linting** — 2 hours, prevents future violations
3. **Delete `propTypes.ts`** — 30 minutes, merge into `src/types/`

### Phase 2: Split Violations (Week 2-3)

4. **Split `nameManagementCore.tsx`** — 4 hours, high impact
5. **Split `useAppStore.ts`** — 3 hours, enables testing
6. **Audit `TournamentSetup.module.css`** — 4 hours, reduce by 50%+

### Phase 3: Enforce Standards (Week 4)

7. **Add CSS size linting** — 2 hours
8. **Document feature folder template** — 1 hour
9. **Update CI to block violations** — 2 hours

### Phase 4: Ongoing

- Every PR must pass size limits
- Every refactor must delete orphaned code
- Every new feature must follow template

---

## Success Criteria

After this strategy is executed:

1. **No file over limits** — All components ≤400 lines, all CSS ≤500 lines
2. **No orphaned code** — `CommonUI.module.css` deleted, no dead files
3. **Types consolidated** — All shared types in `src/types/`
4. **Store sliced** — No monolithic store file
5. **CI enforces rules** — Violations block merge

**Measurable outcomes**:
- Average component size < 200 lines
- Average CSS module size < 300 lines
- Zero TODO comments without issue links
- New contributor can find any file in < 30 seconds

---

## What the First Pass Got Wrong

The first pass was **too cautious**. It:
- Suggested guidelines instead of rules
- Deferred hard problems to "Pass 3"
- Prioritized politeness over clarity
- Avoided making decisions

This pass makes decisions. Some will be wrong. Wrong decisions can be corrected. Indecision compounds.
