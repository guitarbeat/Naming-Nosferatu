# Architecture Fixes to Eliminate False Positives

## Current False Positives (14 exports)

1. `CalendarButton` - Used in Dashboard.jsx (lazy-loaded, already in entry points)
2. `export * from './metricsUtils'` - Re-export in coreUtils.ts
3. `export * from './authUtils'` - Re-export in coreUtils.ts
4. `extractNameIds` - Used in TournamentSetup.jsx
5. `getVisibleNames` - Used in TournamentSetup.jsx
6. `Diagnostics` - Used internally in errorTracking.ts
7. `buildDiagnostics` - Used internally in errorTracking.ts
8. `buildAIContext` - Used internally in errorTracking.ts
9. `StartButton default` - Used in TournamentHeader.tsx
10. `AnalysisToolbar` - Re-exported from AnalysisPanel.tsx
11. `AnalysisButton` - Re-exported from AnalysisPanel.tsx
12. `AnalysisBulkActions` - Re-exported from AnalysisPanel.tsx
13. `NameManagementView` - Used in ViewRouter.tsx (already entry point)
14. `PerformanceBadge` - Used internally in PerformanceBadges component

## Architectural Solutions

### 1. Remove Re-exports from coreUtils.ts
**Problem**: `export * from './metricsUtils'` and `export * from './authUtils'` create false positives because tsr doesn't track re-exports well.

**Solution**: Remove re-exports, update all imports to use direct paths.

**Files to update**:
- `src/shared/utils/coreUtils.ts` - Remove re-exports
- All files importing from coreUtils that use metricsUtils/authUtils functions

**Impact**: Users will import directly from `metricsUtils` or `authUtils` instead of `coreUtils`.

### 2. Remove Re-exports from AnalysisPanel.tsx
**Problem**: Re-exporting `AnalysisToolbar`, `AnalysisButton`, `AnalysisBulkActions` creates false positives.

**Solution**: Remove re-exports, users should import directly from component files.

**Files to update**:
- `src/shared/components/AnalysisPanel/AnalysisPanel.tsx` - Remove re-exports
- Files importing these from AnalysisPanel

**Impact**: Users will import directly from `./components/AnalysisToolbar` etc.

### 3. Make Internal-Only Exports Non-exported
**Problem**: Some exports are only used internally within the same file/module.

**Solution**: Remove export keyword, make them internal functions.

**Files to update**:
- `src/shared/components/PerformanceBadge/PerformanceBadge.tsx` - Make `PerformanceBadge` non-exported (used only in `PerformanceBadges`)
- `src/shared/services/errorManager/errorTracking.ts` - Make `Diagnostics`, `buildDiagnostics`, `buildAIContext` non-exported (used only internally)

**Impact**: These become internal implementation details.

### 4. Add More Entry Points to tsr
**Problem**: Some components are used in lazy-loaded or dynamically imported files.

**Solution**: Add these files as entry points to tsr configuration.

**Files to add**:
- `TournamentSetup.jsx` - Uses `extractNameIds`, `getVisibleNames`
- `TournamentHeader.tsx` - Uses `StartButton`

**Impact**: tsr will track usage in these files.

### 5. Fix CalendarButton
**Problem**: Already added to entry points but still showing as unused.

**Solution**: Verify Dashboard.jsx is properly tracked, or make CalendarButton non-exported if only used in Dashboard.

## Implementation Order

1. **Add entry points** (easiest, no code changes)
2. **Remove re-exports from AnalysisPanel** (medium impact)
3. **Remove re-exports from coreUtils** (higher impact, more files to update)
4. **Make internal exports non-exported** (low risk, internal changes)
5. **Verify and test** (run tsr after each change)

## Expected Results

After these changes:
- **Re-exports eliminated**: 5 false positives removed
- **Internal exports fixed**: 4 false positives removed
- **Entry points added**: 3 false positives removed
- **Total reduction**: ~12 false positives eliminated
- **Remaining**: Only truly unused exports (if any)

