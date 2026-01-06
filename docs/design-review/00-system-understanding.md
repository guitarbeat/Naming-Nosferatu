# 00 — System Understanding (Pass 2)

> **Purpose**: Describe the application as it exists after the first improvement pass.

---

## Tech Stack and Tooling

### Core
- **React**: 19.2.3 (using latest features like `use` hook)
- **Build Tool**: Vite 7.3.0
- **Package Manager**: pnpm 10.17.1
- **TypeScript**: Configured with strict mode

### Styling
- **TailwindCSS**: 4.1.18
- **CSS Modules**: Widely used for component-scoped styles
- **HeroUI**: @heroui/react 2.8.7 (select components)
- **Framer Motion**: 12.24.7 (animations)

### State & Data
- **State Management**: Zustand 5.0.9
- **Data Fetching**: TanStack Query 5.90.16 (Supabase integration)
- **Validation**: Zod 4.3.5
- **Error Handling**: neverthrow 8.2.0
- **Pattern Matching**: ts-pattern 5.9.0

### Backend
- **Supabase**: PostgreSQL + Auth

### Quality Tools
- **Linter**: Biome 2.3.11
- **Testing**: Vitest 4.0.16 (configured but minimal test files)

---

## Component Architecture

### After First Pass Improvements

**Decomposed Components** (newly organized):
```
src/shared/components/
├── Loading/                    # ✅ Extracted from CommonUI
│   ├── Loading.tsx (110 lines)
│   ├── Loading.module.css (130 lines)
│   └── index.ts
├── Toast/                      # ✅ Extracted from CommonUI
│   ├── Toast.tsx (250 lines)
│   ├── Toast.module.css (250 lines)
│   ├── UnifiedToast.tsx (79 lines, pre-existing)
│   └── index.ts
├── Error/                      # ✅ Extracted from CommonUI
│   ├── Error.tsx (363 lines)
│   ├── Error.module.css (280 lines)
│   └── index.ts
└── CommonUI.tsx                # ✅ Now 33-line re-export barrel
```

**Extracted Hooks**:
```
src/shared/hooks/
├── useReducedMotion.ts         # ✅ Moved from CommonUI
└── useScreenSize.ts            # ✅ Moved from CommonUI
```

### Largest Components (by line count)

| Component | Lines | Status |
|-----------|-------|--------|
| `nameManagementCore.tsx` | 876 | 🔴 Needs review |
| `AnalysisUI.tsx` | 722 | 🔴 Needs review |
| `AnalysisDashboard.tsx` | 698 | 🔴 Needs review |
| `TournamentToolbar.tsx` | 601 | 🟡 Moderate |
| `Button.tsx` | 562 | 🟡 Moderate |
| `LiquidGlass.tsx` | 505 | 🟡 Moderate |
| `CombinedLoginTournamentSetup.tsx` | 405 | 🟡 Moderate |

---

## Styling Approach

### Design Token System
- **Location**: `src/shared/styles/design-tokens.css` (417 lines)
- **Status**: ✅ Cleaned up (glass tokens consolidated)
- **Coverage**: Spacing (4px base), typography, colors, shadows, transitions, border radius

### Theme System
- **Location**: `src/shared/styles/themes.css` (262 lines)
- **Modes**: Light, dark, high-contrast
- **Implementation**: `data-theme` attribute + media queries
- **Glass Tokens**: ✅ Now single source of truth for theme-variant values

### CSS Modules (22 total)

**Largest CSS Files**:
| File | Lines | Size | Status |
|------|-------|------|--------|
| `TournamentSetup.module.css` | 3371 | 67KB | 🔴 **Bloated** |
| `Tournament.module.css` | 1723 | 35KB | 🔴 **Bloated** |
| `CommonUI.module.css` | 1865 | 33KB | ⚠️ **Orphaned** (no longer used) |
| `AnalysisUI.module.css` | ~500 | ~10KB | 🟡 Moderate |

**Well-Sized CSS Files** (after decomposition):
- `Loading.module.css`: 130 lines ✅
- `Toast.module.css`: 250 lines ✅
- `Error.module.css`: 280 lines ✅

---

## Repeated UI Patterns

### Established Patterns
- **Glass Cards**: Glassmorphism with backdrop blur
- **Gradient Buttons**: Neon-cyan, hot-pink, fire-red
- **Toast Notifications**: Success, error, warning, info variants
- **Loading States**: Spinner, suspense, skeleton
- **Error Boundaries**: With retry and diagnostics
- **Form Inputs**: Validated with Zod schemas
- **Mosaic Grids**: Responsive card layouts
- **Accessibility**: Skip links, ARIA labels, focus management

### Pattern Consistency Issues
- **Inline Styles**: ✅ Fixed in App.tsx
- **Component Size**: Still inconsistent (876 lines vs 110 lines)
- **CSS Organization**: Improved but large files remain

---

## Constraints and Risks

### Technical Constraints
- **React 19 Dependency**: Using latest features (potential upgrade friction)
- **HeroUI Integration**: Third-party component library dependency
- **Supabase Lock-in**: Backend tightly coupled

### Current Risks
1. **CSS Bloat**: TournamentSetup.module.css (3371 lines) is unmaintainable
2. **Orphaned CSS**: CommonUI.module.css still exists but unused (33KB waste)
3. **Component Complexity**: nameManagementCore.tsx (876 lines) too large
4. **Missing Tests**: Test infrastructure exists but minimal coverage
5. **TODO Comments**: 3 found in codebase (potential tech debt)

---

## Areas of Uncertainty

### What We Know
- ✅ CommonUI decomposition successful
- ✅ Token consolidation working
- ✅ Build performance improved (32.72s → 17.32s)

### What Remains Unclear
1. **Dead CSS**: How much of TournamentSetup.module.css is actually used?
2. **Component Boundaries**: Should nameManagementCore.tsx be split?
3. **Test Coverage**: Actual vs claimed 85% coverage
4. **Performance Impact**: Does CSS bloat affect runtime performance?
5. **Refactoring Safety**: Can we safely remove CommonUI.module.css?

---

## Improvements Since Last Pass

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| CommonUI.tsx | 807 lines | 33 lines | **-96%** ✅ |
| CSS bundle | 320.19 KB | 319.96 KB | -0.23 KB ✅ |
| Build time | 32.72s | 17.32s | **-47%** ✅ |
| Inline styles | 1 | 0 | ✅ |
| Focused modules | 0 | 3 | ✅ |
| Extracted hooks | 0 | 2 | ✅ |

---

## Next Opportunities

Based on current analysis:
1. **Delete CommonUI.module.css** (1865 lines, 33KB unused)
2. **Audit TournamentSetup.module.css** (3371 lines, likely has dead code)
3. **Split nameManagementCore.tsx** (876 lines, violates 300-line guideline)
4. **Consolidate Analysis components** (AnalysisUI + AnalysisDashboard = 1420 lines)
