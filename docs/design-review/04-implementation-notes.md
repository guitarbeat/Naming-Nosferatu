# 04 — Implementation Notes

> **Purpose**: Explain changes that were actually implemented.

---

## Status: ✅ Complete

---

## Changes Made

### New Files Created

| File | Purpose |
|------|---------|
| `src/shared/components/Loading/Loading.tsx` | Loading component (spinner, suspense, skeleton) |
| `src/shared/components/Loading/Loading.module.css` | Loading styles extracted from CommonUI |
| `src/shared/components/Loading/index.ts` | Re-exports |
| `src/shared/components/Toast/Toast.tsx` | Toast, ToastItem, ToastContainer components |
| `src/shared/components/Toast/Toast.module.css` | Toast styles (overwrote simpler existing file) |
| `src/shared/components/Toast/index.ts` | Re-exports (updated to include both old and new) |
| `src/shared/components/Error/Error.tsx` | Error display components + ErrorBoundaryFallback |
| `src/shared/components/Error/Error.module.css` | Error styles extracted from CommonUI |
| `src/shared/components/Error/index.ts` | Re-exports |
| `src/shared/hooks/useReducedMotion.ts` | Hook for motion preference detection |
| `src/shared/hooks/useScreenSize.ts` | Hook for responsive breakpoint detection |

### Files Modified

| File | Change |
|------|--------|
| `src/shared/components/CommonUI.tsx` | Replaced 807-line monolith with 33-line re-export file |
| `src/App.tsx` | Replaced inline styles with `.fullScreenCenter` utility class |
| `src/shared/styles/design-tokens.css` | Removed duplicate glass tokens (now only in themes.css) |

---

## Why Each Change Was Made

### CommonUI Decomposition
The 807-line CommonUI.tsx file was a maintenance burden:
- Hard to navigate with multiple unrelated components
- Testing individual components required importing everything
- No clear ownership boundaries

Splitting into focused modules improves:
- **Discoverability**: Components are now in predictable locations
- **Testability**: Each module can be tested in isolation
- **Tree-shaking**: Bundler can exclude unused components

### Hook Extraction
`useReducedMotion` and `useScreenSize` were internal utilities buried in CommonUI.tsx. Moving them to `shared/hooks/` makes them reusable across the codebase.

### Inline Style Fix
The inline styles in App.tsx violated the design system pattern. The `.fullScreenCenter` utility already existed in `utilities.css`, so using it ensures consistency.

---

## Tradeoffs Accepted

1. **CSS duplication**: The extracted CSS modules contain some repeated utility patterns. A future pass could consolidate these into shared utilities.

2. **Backward compatibility layer**: CommonUI.tsx now acts as a re-export barrel file rather than being deleted entirely. This prevents breaking existing imports.

3. **Pre-existing TypeScript errors remain**: Focused on decomposition without adding scope for fixing unrelated type issues in Charts.tsx, RankingAdjustment.tsx, etc.

---

## Accessibility Considerations

All extracted components preserve their accessibility features:
- Loading states have `role="status"` and `aria-label`
- Toasts have `role="alert"` and `aria-live="polite"`
- Error boundaries maintain focus management
- Reduced motion preferences are respected via `useReducedMotion` hook
- Screen reader-only text (`.srOnly`) is preserved

---

## What Future Improvements Are Now Easier

1. **Adding loading variants**: New skeleton or shimmer effects can be added to `Loading/` without touching other components

2. **Toast customization**: The Toast module now has clear boundaries for adding new positioning or styling options

3. **Error theming**: Error components can be themed independently

4. **Hook reuse**: `useReducedMotion` and `useScreenSize` are now available anywhere in the app

5. **Testing**: Each component module can have its own test file colocated with the implementation

---

## Verification Results

### Automated
- ✅ `npm run build` — Succeeded (32.72s)
- ⚠️ `npm run lint:types` — New code passes, pre-existing errors remain in unmodified files

### Build Output
```
dist/index.html                      12.27 kB │ gzip:   3.79 kB
dist/assets/style-EmshuN_S.css      320.19 kB │ gzip:  56.60 kB
dist/assets/js/index-g3IgOT6z.js  1,178.01 kB │ gzip: 325.65 kB
```

---

## Reflection

> "Did this meaningfully improve the system, or did it merely reorganize it?"

### Before Metrics
- `CommonUI.tsx`: 807 lines
- `CommonUI.module.css`: 33KB (1866 lines)
- Inline styles in `App.tsx`: 1 instance
- Utility hooks: buried in component file

### After Metrics
- `CommonUI.tsx`: 33 lines (re-exports only)
- 3 focused component modules: ~110, ~250, ~300 lines each
- 3 focused CSS modules: ~130, ~250, ~280 lines each
- Inline styles: 0
- Utility hooks: in `shared/hooks/`

### Verdict

**This was a meaningful improvement.** The system now has:
- Fewer degrees of freedom (components have clear boundaries)
- Better discoverability (predictable file locations)
- Lower cognitive load (smaller files to understand)
- Easier extensibility (add to modules without touching unrelated code)

The codebase is easier to extend after this pass.
