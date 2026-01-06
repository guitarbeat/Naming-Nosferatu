# 03 — Proposed Changes

> **Purpose**: Describe proposed changes at a conceptual level. No code. This is a plan, not an implementation.

---

## Component-Level Changes

### 1. Decompose CommonUI.tsx

**Before**: Single 807-line file containing:
- `Loading` component (spinner, suspense, skeleton variants)
- `ToastItem` and `ToastContainer` components
- `Toast` unified component
- `ErrorBoundaryFallback` component
- `Error`, `ErrorList`, `ErrorInline` components
- Utility hooks (`useReducedMotion`, `useScreenSize`)

**After**: Extract into focused modules:

```
shared/components/
├── Loading/
│   ├── Loading.tsx          # Loading variants
│   ├── Loading.module.css   # Extracted from CommonUI.module.css
│   └── index.ts
├── Toast/
│   ├── Toast.tsx            # Unified toast system
│   ├── ToastItem.tsx        # Individual toast item
│   ├── ToastContainer.tsx   # Toast stack container
│   ├── Toast.module.css     # Extracted styles
│   └── index.ts
├── Error/
│   ├── Error.tsx            # Error display variants
│   ├── ErrorBoundaryFallback.tsx
│   ├── Error.module.css     # Extracted styles
│   └── index.ts
```

**Hooks Relocation**:
```
shared/hooks/
├── useReducedMotion.ts      # Moved from CommonUI.tsx
├── useScreenSize.ts         # Moved from CommonUI.tsx
```

---

### 2. Split CommonUI.module.css

**Before**: 33KB monolithic CSS file

**After**: Distributed across component directories:
- `Loading/Loading.module.css` (loading spinner, skeleton, overlay styles)
- `Toast/Toast.module.css` (toast positioning, animations, variants)
- `Error/Error.module.css` (error display, retry buttons, lists)

**Estimated size reduction**: 33KB → 3 files × ~5-8KB each

---

### 3. Consolidate Type Definitions

**Before**:
- `src/shared/propTypes.ts` (2.4KB)
- `src/types/store.ts`
- Inline types in `App.tsx` (lines 48-103)

**After**:
- `src/types/store.ts` — all Zustand store types
- `src/types/common.ts` — shared component prop types
- Inline types in `App.tsx` → import from `types/`
- Delete `propTypes.ts` if redundant

---

### 4. Fix Inline Styles in App.tsx

**Before**:
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

Uses existing `.fullScreenCenter` class from `utilities.css`.

---

## Styling and Token Changes

### 1. Theme Token Consolidation

**Before**: Glass tokens defined in both files
- `design-tokens.css` lines 362-373: base glass values
- `themes.css` lines 61-70, 157-167: theme-specific overrides

**After**: Clear separation
- `design-tokens.css`: Remove glass tokens (they're theme-dependent)
- `themes.css`: Single source of truth for all theme-variant tokens

**Pattern**:
```css
/* design-tokens.css - NO theme-dependent values */
:root {
  --glass-blur: 20px;  /* Only universal defaults */
}

/* themes.css - ALL theme variations */
:root[data-theme="light"] {
  --glass-bg: rgb(241 245 249 / 60%);
  --glass-border: rgb(15 23 42 / 7%);
}
:root[data-theme="dark"] {
  --glass-bg: rgb(15 23 42 / 55%);
  --glass-border: rgb(255 255 255 / 12%);
}
```

---

### 2. Audit Large CSS Files (Document Only)

**Not implementing in this pass**, but documenting for future:

| File | Current Size | Action |
|------|--------------|--------|
| `TournamentSetup.module.css` | 67KB | Audit for dead code |
| `Tournament.module.css` | 35KB | Audit for dead code |

These files require careful analysis to identify unused selectors. This is documented for a separate cleanup pass.

---

## File and Folder Reorganizations

### 1. Remove CommonUI.tsx After Extraction

**Before**:
```
shared/components/
├── CommonUI.tsx              # 807 lines
├── CommonUI.module.css       # 33KB
├── ErrorBoundary/            # Separate from CommonUI
```

**After**:
```
shared/components/
├── Loading/                  # Extracted
├── Toast/                    # Extracted
├── Error/                    # Extracted (merged with ErrorBoundary/)
├── ErrorBoundary/            # Keep (class component boundary)
```

---

### 2. Verify ErrorBoundary Relationship

`ErrorBoundary/` directory already exists. Confirm relationship:
- `ErrorBoundary/ErrorBoundary.tsx` — React error boundary (class component)
- `CommonUI.tsx` → `ErrorBoundaryFallback` — Fallback UI component

**Decision**: Keep both:
- `ErrorBoundary/` for the class component boundary
- `Error/` for error display components (including fallback)

---

## What This Pass Does NOT Change

| Area | Status |
|------|--------|
| Tournament feature files | Untouched (too large for this pass) |
| Supabase integration | Untouched |
| `TournamentSetup.module.css` | Documented only, not refactored |
| `Tournament.module.css` | Documented only, not refactored |
| Test files | Out of scope |
| HeroUI components | Untouched |
| Animation system | Untouched |

---

## Migration Strategy

### Phase 1: Extract Components
1. Create new directories (`Loading/`, `Toast/`, `Error/`)
2. Move code into new files
3. Extract relevant CSS into new module files
4. Add `index.ts` re-exports

### Phase 2: Update Imports
1. Update `App.tsx` imports
2. Update any other files importing from `CommonUI`
3. Run type checker to catch missing imports

### Phase 3: Cleanup
1. Delete `CommonUI.tsx` if fully emptied
2. Delete `CommonUI.module.css` if fully extracted
3. Run build to verify no breaking changes

### Phase 4: Token Consolidation
1. Remove duplicate glass tokens from `design-tokens.css`
2. Verify themes still work correctly
3. Run visual inspection

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| CommonUI decomposition | Medium (import paths change) | Grep for all imports before deletion |
| Token consolidation | Low (theme testing) | Manual visual inspection of light/dark modes |
| Type consolidation | Low (TypeScript catches issues) | Run `npm run lint:types` |
| Inline style fix | Very Low | One-line change using existing utility |
