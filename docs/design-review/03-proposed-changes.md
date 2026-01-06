# 03 — Proposed Changes (Pass 2)

> **Purpose**: Describe proposed changes at a conceptual level for Pass 2.

---

## ✅ Pass 1 Changes (Completed)

- Decomposed CommonUI.tsx into Loading/, Toast/, Error/ modules
- Extracted hooks to shared/hooks/
- Consolidated glass tokens in themes.css
- Fixed inline styles in App.tsx
- Build time improved 47% (32.72s → 17.32s)

---

## Immediate Actions (Pass 2)

### 1. Delete Orphaned CommonUI.module.css

**Current State**:
```
src/shared/components/
├── CommonUI.tsx (33 lines, re-exports only)
├── CommonUI.module.css (1865 lines, 33KB) ← UNUSED
├── Loading/Loading.module.css (130 lines) ← Extracted styles
├── Toast/Toast.module.css (250 lines) ← Extracted styles
└── Error/Error.module.css (280 lines) ← Extracted styles
```

**Proposed Change**:
```
src/shared/components/
├── CommonUI.tsx (33 lines, re-exports only)
├── Loading/Loading.module.css (130 lines)
├── Toast/Toast.module.css (250 lines)
└── Error/Error.module.css (280 lines)
```

**Rationale**: File is completely orphaned after Pass 1 decomposition. No imports reference it.

**Risk**: None (verified no imports exist)

---

### 2. Split nameManagementCore.tsx by Mode

**Current State**:
- Single file: 876 lines
- Handles 3 modes: Tournament, Profile, Analysis
- Mixed concerns, hard to test

**Proposed Structure**:
```
src/shared/components/NameManagementView/
├── NameManagementView.tsx (orchestrator, ~150 lines)
├── modes/
│   ├── TournamentMode.tsx (~300 lines)
│   ├── ProfileMode.tsx (~250 lines)
│   └── AnalysisMode.tsx (~200 lines)
├── shared/
│   ├── NameGrid.tsx (shared grid logic)
│   └── SelectionControls.tsx (shared controls)
└── nameManagementCore.tsx (DEPRECATED, re-exports for compatibility)
```

**Before/After**:
| Metric | Before | After |
|--------|--------|-------|
| Largest file | 876 lines | ~300 lines |
| Testability | Monolithic | Mode-isolated |
| Discoverability | One file | Clear mode separation |

**Rationale**: 
- Each mode has distinct logic and UI
- Current code already has mode-based conditionals
- Easier to test individual modes

---

## Secondary Actions (Pass 2)

### 3. Consolidate Analysis Components

**Current State**:
```
src/shared/components/
├── AnalysisDashboard/
│   ├── AnalysisDashboard.tsx (698 lines)
│   ├── AnalysisUI.tsx (722 lines)
│   └── components/
│       └── AnalysisBulkActions.tsx
```

**Proposed Structure**:
```
src/shared/components/AnalysisDashboard/
├── AnalysisDashboard.tsx (orchestrator, ~200 lines)
├── components/
│   ├── AnalysisCharts.tsx (~300 lines)
│   ├── AnalysisStats.tsx (~250 lines)
│   ├── AnalysisBulkActions.tsx (existing)
│   └── AnalysisFilters.tsx (~150 lines)
└── AnalysisUI.tsx (DEPRECATED, re-exports for compatibility)
```

**Rationale**:
- Related functionality scattered across large files
- Clear sub-components already exist conceptually
- Improves discoverability

---

### 4. Document Component Size Guidelines

**Create**: `docs/component-guidelines.md`

**Content**:
- Soft limit: 300 lines
- Hard limit: 600 lines
- When to split: Multiple modes, distinct concerns
- How to split: Mode-based, feature-based, or UI/logic separation

**Rationale**: Prevent future drift, codify learnings from Pass 1 and 2

---

## What This Pass Does NOT Change

| Area | Status |
|------|--------|
| TournamentSetup.module.css (3371 lines) | Documented for Pass 3 audit |
| Tournament.module.css (1723 lines) | Documented for Pass 3 audit |
| Test coverage | Out of scope |
| TODO comments | Individual tasks, not system-level |
| Button.tsx (562 lines) | Under 600-line hard limit |

---

## Migration Strategy

### Phase 1: Delete Orphaned CSS
1. Verify no imports: `grep -r "CommonUI.module.css" src/`
2. Delete file
3. Run build to confirm
4. Commit immediately

### Phase 2: Split nameManagementCore
1. Create `modes/` directory
2. Extract TournamentMode logic
3. Extract ProfileMode logic
4. Extract AnalysisMode logic
5. Update NameManagementView to use modes
6. Keep nameManagementCore.tsx as re-export for compatibility
7. Update imports gradually
8. Run tests (when they exist)

### Phase 3: Consolidate Analysis
1. Create component sub-modules
2. Extract chart logic to AnalysisCharts
3. Extract stats logic to AnalysisStats
4. Extract filters to AnalysisFilters
5. Update AnalysisDashboard to orchestrate
6. Keep AnalysisUI.tsx as re-export
7. Verify functionality

### Phase 4: Documentation
1. Create component-guidelines.md
2. Document 300/600 line limits
3. Document mode-based splitting pattern
4. Add examples from Pass 1 and 2

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Orphaned files | 1 (33KB) | 0 |
| Components >600 lines | 2 | 0 |
| Largest component | 876 lines | <400 lines |
| Analysis file count | 2 large | 4-5 focused |
| Documented guidelines | 0 | 1 |

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| Delete CommonUI.module.css | Very Low | Verified no imports |
| Split nameManagementCore | Medium | Keep re-export for compatibility |
| Consolidate Analysis | Medium | Gradual extraction, test each step |
| Add guidelines | Very Low | Documentation only |
