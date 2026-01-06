# 04 — Evidence-Based Changes (V2)

> **Justify changes with evidence, not taste.**

---

## Changes Already Made (First Pass)

### Change 1: CommonUI.tsx Decomposition

**Before**:
```
CommonUI.tsx: 807 lines
├── Loading component
├── Toast components (3)
├── Error components (4)
├── useReducedMotion hook
└── useScreenSize hook
```

**After**:
```
Loading/Loading.tsx: 110 lines
Toast/Toast.tsx: 250 lines
Error/Error.tsx: 363 lines
shared/hooks/useReducedMotion.ts: 33 lines
shared/hooks/useScreenSize.ts: 45 lines
CommonUI.tsx: 33 lines (re-exports only)
```

**Measurable improvement**:
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Largest file | 807 lines | 363 lines | -55% |
| Files to understand | 1 | 5 | +400% (but each is focused) |
| Import specificity | All or nothing | Granular | ✅ |
| Test isolation | Impossible | Possible | ✅ |

**Tradeoff accepted**: More files to navigate. Worth it for isolation.

---

### Change 2: Inline Style Removal

**Before** (App.tsx):
```tsx
<div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  width: "100vw",
}}>
```

**After**:
```tsx
<div className="fullScreenCenter">
```

**Measurable improvement**:
| Metric | Before | After |
|--------|--------|-------|
| Inline styles in App.tsx | 1 | 0 |
| Uses design system | No | Yes |
| Consistent with codebase | No | Yes |

**Tradeoff accepted**: None. Pure improvement.

---

### Change 3: Glass Token Consolidation

**Before**:
```
design-tokens.css: Glass tokens defined (lines 362-373)
themes.css: Glass tokens redefined (lines 61-70, 157-167)
```

**After**:
```
design-tokens.css: No glass tokens
themes.css: Single source of truth for glass tokens
```

**Measurable improvement**:
| Metric | Before | After |
|--------|--------|-------|
| Token definitions | 2 locations | 1 location |
| Risk of drift | High | None |
| Theme consistency | Uncertain | Guaranteed |

**Tradeoff accepted**: None. Pure improvement.

---

## Changes Proposed (This Pass)

### Proposed Change 1: Delete CommonUI.module.css

**Current state**:
- File exists: 1865 lines, 33KB
- Imports: 0 (verified via grep)
- Purpose: None (orphaned after decomposition)

**Evidence it's unused**:
```bash
$ grep -r "CommonUI\.module" src/
# No results
```

**Measurable improvement**:
| Metric | Before | After |
|--------|--------|-------|
| Dead CSS in repo | 1865 lines | 0 lines |
| Repo size | +33KB | -33KB |
| Developer confusion | Possible | Eliminated |

**Risk**: Zero. File is not imported anywhere.

**Tradeoff accepted**: None. Pure improvement.

---

### Proposed Change 2: Split nameManagementCore.tsx

**Current state**:
- 876 lines
- Handles 3 modes: tournament, profile, analysis
- Contains: types, context, hooks, utilities

**Evidence it should be split**:
1. **Mode coupling**: Changes to tournament mode risk breaking profile mode
2. **Test difficulty**: Cannot test modes in isolation
3. **Cognitive load**: 876 lines requires scrolling to understand
4. **Violation**: Exceeds 400-line limit by 119%

**Proposed structure**:
```
NameManagement/
├── TournamentMode.tsx (~200 lines)
├── ProfileMode.tsx (~200 lines)
├── AnalysisMode.tsx (~200 lines)
├── shared/
│   ├── useNameSelection.ts (~150 lines)
│   ├── useNameData.ts (~100 lines)
│   └── types.ts (~50 lines)
└── index.tsx (~50 lines, mode router)
```

**Measurable improvement**:
| Metric | Before | After |
|--------|--------|-------|
| Largest file | 876 lines | ~200 lines |
| Mode isolation | None | Complete |
| Testability | Low | High |
| Lazy-loadable modes | No | Yes |

**Risk**: Medium. Requires careful extraction to preserve behavior.

**Tradeoff accepted**: More files, more imports. Worth it for isolation.

---

### Proposed Change 3: Split useAppStore.ts

**Current state**:
- 483 lines
- Contains: tournament, user, UI, errors, siteSettings
- All state in one object, all actions in one object

**Evidence it should be split**:
1. **Monolith**: Single file owns all app state
2. **Testing**: Must mock entire store to test any slice
3. **Performance**: Any state change notifies all subscribers
4. **Violation**: Exceeds 200-line slice guideline by 141%

**Proposed structure**:
```
stores/
├── useTournamentStore.ts (~150 lines)
├── useUserStore.ts (~100 lines)
├── useUIStore.ts (~80 lines)
├── useErrorStore.ts (~50 lines)
├── useSiteSettingsStore.ts (~50 lines)
└── index.ts (re-exports)
```

**Measurable improvement**:
| Metric | Before | After |
|--------|--------|-------|
| Largest store file | 483 lines | ~150 lines |
| Slice isolation | None | Complete |
| Test setup | Mock everything | Mock one slice |
| Subscriber efficiency | All notified | Only relevant notified |

**Risk**: Medium. Requires updating all store consumers.

**Tradeoff accepted**: Migration effort. Worth it for maintainability.

---

### Proposed Change 4: Audit TournamentSetup.module.css

**Current state**:
- 3371 lines, 67KB
- Unknown % dead code
- No organization visible

**Evidence it needs audit**:
1. **Size**: 6.7x over 500-line limit
2. **Age**: Accumulated over time without cleanup
3. **Risk**: Specificity conflicts likely

**Audit approach**:
1. Run PurgeCSS to identify unused selectors
2. Group remaining selectors by component
3. Extract to component-specific modules
4. Delete original file

**Expected outcome**:
| Metric | Before | After (estimated) |
|--------|--------|-------------------|
| Total lines | 3371 | ~1200 (across multiple files) |
| Dead code | Unknown | 0 |
| Organization | None | By component |

**Risk**: High. May break styles if selectors are incorrectly identified as unused.

**Tradeoff accepted**: Audit time. Worth it to prevent further growth.

---

## What Remains Uncomfortable

### 1. Button.tsx at 562 lines

This file contains many button variants. Splitting it is possible but may reduce discoverability. **Decision**: Accept for now. Revisit if it grows past 600.

### 2. Tournament feature folder is messy

```
features/tournament/
├── 67KB of CSS
├── 12 component subdirectories
├── 4 hook files
├── 6 top-level component files
```

**Decision**: Address after core splits are done. This is structural debt, not compounding debt.

### 3. No automated dead code detection

We can delete `CommonUI.module.css` because we verified manually. We don't have tooling to catch future orphaned files.

**Decision**: Add `knip` or similar to CI. Defer to Phase 3.

### 4. Type definitions still scattered

Even after deleting `propTypes.ts`, types exist in:
- `src/types/` (correct location)
- `src/integrations/supabase/types.ts` (acceptable, external)
- Inline in components (acceptable for single-use)

**Decision**: Accept current state. Enforce rule for new code.

---

## Before/After Summary

| Area | Before (First Pass) | After (This Pass) |
|------|---------------------|-------------------|
| CommonUI.tsx | 807 → 33 lines | ✅ Done |
| CommonUI.module.css | 1865 lines (orphaned) | 🔴 Delete now |
| nameManagementCore.tsx | 876 lines | 🔴 Split to ~200 each |
| useAppStore.ts | 483 lines | 🔴 Split to ~100 each |
| TournamentSetup.module.css | 3371 lines | 🟡 Audit, target 1200 |
| File size enforcement | Guidelines | 🔴 CI rules |
| Type locations | Scattered | 🟡 Consolidating |

---

## Evidence Standards Going Forward

Every proposed change must include:

1. **Current state**: What exists now (with line counts)
2. **Evidence**: Why change is needed (not opinion)
3. **Measurable improvement**: Before/after metrics
4. **Risk assessment**: What could go wrong
5. **Tradeoff accepted**: What we're giving up

Changes without evidence are rejected. "It feels cleaner" is not evidence.
