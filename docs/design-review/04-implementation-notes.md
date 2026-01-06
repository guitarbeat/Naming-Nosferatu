# 04 — Implementation Notes (Pass 1 Complete, Pass 2 Planned)

> **Purpose**: Document what was actually implemented in Pass 1 and plan for Pass 2.

---

## ✅ Pass 1: Complete

### Changes Made

**New Files Created**:
- `src/shared/components/Loading/Loading.tsx` (110 lines)
- `src/shared/components/Loading/Loading.module.css` (130 lines)
- `src/shared/components/Loading/index.ts`
- `src/shared/components/Toast/Toast.tsx` (250 lines)
- `src/shared/components/Toast/Toast.module.css` (250 lines)
- `src/shared/components/Toast/index.ts`
- `src/shared/components/Error/Error.tsx` (363 lines)
- `src/shared/components/Error/Error.module.css` (280 lines)
- `src/shared/components/Error/index.ts`
- `src/shared/hooks/useReducedMotion.ts` (29 lines)
- `src/shared/hooks/useScreenSize.ts` (42 lines)

**Files Modified**:
- `src/shared/components/CommonUI.tsx` — Replaced 807-line monolith with 33-line re-export
- `src/App.tsx` — Replaced inline styles with `.fullScreenCenter` utility
- `src/shared/styles/design-tokens.css` — Removed duplicate glass tokens

---

### Why Each Change Was Made

**CommonUI Decomposition**:
- 807-line file was a maintenance burden
- Hard to navigate with multiple unrelated components
- Testing individual components required importing everything
- No clear ownership boundaries

**Splitting improved**:
- **Discoverability**: Components now in predictable locations
- **Testability**: Each module can be tested in isolation
- **Tree-shaking**: Bundler can exclude unused components

**Hook Extraction**:
- `useReducedMotion` and `useScreenSize` were internal utilities buried in CommonUI
- Moving to `shared/hooks/` makes them reusable across codebase

**Inline Style Fix**:
- Inline styles in App.tsx violated design system pattern
- `.fullScreenCenter` utility already existed in `utilities.css`
- Using it ensures consistency

**Token Consolidation**:
- Glass tokens were duplicated in `design-tokens.css` and `themes.css`
- Removed from design-tokens.css
- `themes.css` is now single source of truth for theme-variant values

---

### Tradeoffs Accepted

1. **CSS duplication**: Extracted CSS modules contain some repeated utility patterns. Future pass could consolidate into shared utilities.

2. **Backward compatibility layer**: CommonUI.tsx now acts as re-export barrel rather than being deleted. Prevents breaking existing imports.

3. **Pre-existing TypeScript errors remain**: Focused on decomposition without adding scope for fixing unrelated type issues.

---

### Accessibility Considerations

All extracted components preserve accessibility features:
- Loading states have `role="status"` and `aria-label`
- Toasts have `role="alert"` and `aria-live="polite"`
- Error boundaries maintain focus management
- Reduced motion preferences respected via `useReducedMotion`
- Screen reader-only text (`.srOnly`) preserved

---

### What Future Improvements Are Now Easier

1. **Adding loading variants**: New skeleton or shimmer effects can be added to `Loading/` without touching other components

2. **Toast customization**: Toast module has clear boundaries for adding new positioning or styling options

3. **Error theming**: Error components can be themed independently

4. **Hook reuse**: `useReducedMotion` and `useScreenSize` now available anywhere

5. **Testing**: Each component module can have colocated test file

---

### Verification Results

**Automated**:
- ✅ `npm run build` — Succeeded (17.32s, down from 32.72s)
- ⚠️ `npm run lint:types` — New code passes, pre-existing errors in unmodified files

**Build Output**:
```
dist/index.html                      12.27 kB │ gzip:   3.79 kB
dist/assets/style-C-E_V2cI.css      319.96 kB │ gzip:  56.54 kB
dist/assets/js/index-g3IgOT6z.js  1,178.01 kB │ gzip: 325.65 kB
```

---

### Pass 1 Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| CommonUI.tsx | 807 lines | 33 lines | **-96%** |
| CSS bundle | 320.19 KB | 319.96 KB | -0.23 KB |
| Build time | 32.72s | 17.32s | **-47%** |
| Inline styles | 1 | 0 | ✅ |
| Focused modules | 0 | 3 | ✅ |
| Extracted hooks | 0 | 2 | ✅ |

---

### Reflection (Pass 1)

> "Did this meaningfully improve the system, or did it merely reorganize it?"

**Verdict**: **This was a meaningful improvement.**

The system now has:
- Fewer degrees of freedom (components have clear boundaries)
- Better discoverability (predictable file locations)
- Lower cognitive load (smaller files to understand)
- Easier extensibility (add to modules without touching unrelated code)

The codebase is easier to extend after this pass.

---

## 📋 Pass 2: Planned

### Proposed Actions

**High Priority**:
- Delete orphaned `CommonUI.module.css` (1865 lines, 33KB)
- Split `nameManagementCore.tsx` (876 lines) into mode-based components
- Create `docs/component-guidelines.md` with 300/600 line limits

**Medium Priority**:
- Consolidate Analysis components (AnalysisUI + AnalysisDashboard)
- Extract shared NameGrid and SelectionControls components

**Documented for Future**:
- Audit `TournamentSetup.module.css` (3371 lines) — Pass 3
- Audit `Tournament.module.css` (1723 lines) — Pass 3

*To be updated after Pass 2 implementation*
