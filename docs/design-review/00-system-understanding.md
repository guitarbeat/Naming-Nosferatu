# 00 — System Understanding

> **Purpose**: Describe the application as it exists today, after Pass 1 improvements.

---

## Tech Stack and Tooling

### Core
- **React**: 19.2.3 (using latest features like `use` hook)
- **Build Tool**: Vite 7.3.0
- **Package Manager**: pnpm 10.17.1
- **TypeScript**: Strict mode enabled

### Styling
- **TailwindCSS**: 4.1.18
- **CSS Modules**: Component-scoped styles
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
- **Testing**: Vitest 4.0.16 (configured but minimal coverage)

---

## Component Architecture

### ✅ Pass 1 Improvements (Completed)

**Decomposed Components**:
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

### 🔴 Largest Components Needing Attention

| Component | Lines | Status |
|-----------|-------|--------|
| `nameManagementCore.tsx` | 876 | 🔴 **Needs splitting** |
| `AnalysisUI.tsx` | 722 | 🔴 **Needs review** |
| `AnalysisDashboard.tsx` | 698 | 🔴 **Needs review** |
| `TournamentToolbar.tsx` | 601 | 🟡 Borderline |
| `Button.tsx` | 562 | 🟡 Acceptable |
| `CombinedLoginTournamentSetup.tsx` | 405 | ✅ Good |

---

## Styling Approach

### Design Token System
- **Location**: `src/shared/styles/design-tokens.css` (417 lines)
- **Status**: ✅ Cleaned up (glass tokens consolidated)
- **Coverage**: Spacing (4px base), typography, colors, shadows, transitions

### Theme System
- **Location**: `src/shared/styles/themes.css` (262 lines)
- **Modes**: Light, dark, high-contrast
- **Implementation**: `data-theme` attribute + media queries
- **Glass Tokens**: ✅ Single source of truth (duplicates removed)

### 🔴 CSS Modules Needing Attention (22 total)

| File | Lines | Size | Status |
|------|-------|------|--------|
| `TournamentSetup.module.css` | 3371 | 67KB | 🔴 **Critical bloat** |
| `Tournament.module.css` | 1723 | 35KB | 🔴 **Bloated** |
| `CommonUI.module.css` | 1865 | 33KB | ⚠️ **Orphaned** (delete) |
| `AnalysisUI.module.css` | ~500 | ~10KB | 🟡 Moderate |

**✅ Well-Sized CSS Files** (after Pass 1):
- `Loading.module.css`: 130 lines
- `Toast.module.css`: 250 lines
- `Error.module.css`: 280 lines

---

## Established UI Patterns

### Working Well ✅
- **Glass Cards**: Glassmorphism with backdrop blur
- **Gradient Buttons**: Neon-cyan, hot-pink, fire-red
- **Toast Notifications**: Success, error, warning, info variants
- **Loading States**: Spinner, suspense, skeleton
- **Error Boundaries**: With retry and diagnostics
- **Form Validation**: Zod schemas + ValidatedInput component
- **Mosaic Grids**: Responsive card layouts
- **Accessibility**: Skip links, ARIA labels, focus management

### Needs Consistency 🟡
- **Component Size**: Range from 33 to 876 lines (no enforcement)
- **CSS Organization**: Some modules bloated, some well-sized
- **Folder Structure**: Mix of flat files and directories

---

## Current Risks

1. **CSS Bloat**: `TournamentSetup.module.css` (3371 lines) unmaintainable
2. **Orphaned Files**: `CommonUI.module.css` (33KB) unused after decomposition
3. **Component Complexity**: `nameManagementCore.tsx` (876 lines) too large
4. **Missing Tests**: Infrastructure exists but minimal coverage
5. **TODO Comments**: 3 found (potential tech debt)

---

## Pass 1 Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| CommonUI.tsx | 807 lines | 33 lines | **-96%** ✅ |
| Build time | 32.72s | 17.32s | **-47%** ✅ |
| CSS bundle | 320.19 KB | 319.96 KB | -0.23 KB ✅ |
| Inline styles | 1 | 0 | ✅ |
| Focused modules | 0 | 3 (Loading, Toast, Error) | ✅ |
| Extracted hooks | 0 | 2 | ✅ |

---

## Next Opportunities (Pass 2)

Based on current state:

1. **Delete `CommonUI.module.css`** — 1865 lines, 33KB unused
2. **Split `nameManagementCore.tsx`** — 876 lines, violates 300-line guideline
3. **Audit `TournamentSetup.module.css`** — 3371 lines, likely has dead code
4. **Consolidate Analysis components** — AnalysisUI + AnalysisDashboard = 1420 lines
5. **Document component size guidelines** — Prevent future drift
