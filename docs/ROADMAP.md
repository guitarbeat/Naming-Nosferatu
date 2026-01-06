# Roadmap & Known Issues

## Application Roadmap

### ✅ Completed Milestones
- **Pass 1: "Stop the Bleeding"**: Removed orphaned CSS, consolidated types, decomposed `CommonUI`.
- **Pass 2: "Split Violations"**: Split `nameManagementCore.tsx` and `useAppStore.ts`. Decoupled `TournamentSetup.module.css`. enforced file limits.

### 🚧 Current Priorities (Pass 3 & 4)
- **Linting & Tooling**: Integrate `scripts/enforce-limits.js` into CI/CD.
- **Documentation**: Standardize feature development workflows.

### 🔮 Future Goals
- **Analysis Consolidation**: Refactor `AnalysisUI` and `AnalysisDashboard` (currently ~1400 lines combined) into a unified, modular feature.
- **Tournament CSS Audit**: Further refine `TournamentSetup.module.css` (reduce from ~2330 lines to < 500) and `Tournament.module.css`.
- **Testing Coverage**: Expand Vitest coverage beyond minimal setup.

## Known Technical Debt

| Item | Severity | Status | Notes |
|------|----------|--------|-------|
| `TournamentSetup.module.css` | High | Mitigated | Still large (~2.3k lines) but functional parts extracted. |
| `AnalysisUI.tsx` | Medium | Pending | Exceeds 400-line limit (722 lines). |
| `Tournament.tsx` | Medium | Pending | Exceeds 400-line limit (696 lines). |
| Test Coverage | Low | Pending | Core logic needs unit tests. |

## Risks
- **CSS Specificity**: Legacy CSS might conflict with new module extractions if not carefully scoped.
- **State Complexity**: `useAppStore` is large; creating more slices is recommended if it grows.
