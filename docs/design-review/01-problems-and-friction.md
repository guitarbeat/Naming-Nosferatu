# 01 — Problems and Friction (Pass 2)

> **Purpose**: Identify what is *not working well* after Pass 1 improvements.

---

## ✅ Pass 1 Problems Solved

- ~~CommonUI.tsx monolith (807 lines)~~ → Decomposed into Loading/, Toast/, Error/
- ~~Inline styles in App.tsx~~ → Fixed with `.fullScreenCenter` utility
- ~~Glass token duplication~~ → Consolidated in themes.css

---

## Problem 1: Orphaned CommonUI.module.css File

### Description
The `CommonUI.module.css` file (1865 lines, 33KB) still exists but is **completely unused** after Pass 1 decomposition. All styles have been extracted to:
- `Loading/Loading.module.css`
- `Toast/Toast.module.css`
- `Error/Error.module.css`

### Why It Matters
| Impact | Severity |
|--------|----------|
| **Bundle Size** | 33KB of dead CSS in repository |
| **Confusion** | Developers may import from wrong file |
| **Maintenance** | False positive when searching for styles |

### Evidence
- File exists at 1865 lines
- No imports reference it (verified with `grep`)
- Build succeeds without it

### Leverage
🟢 **Very High** — Delete one file, instant cleanup. **Zero risk**.

---

## Problem 2: TournamentSetup.module.css is Unmaintainable

### Description
At **3371 lines** (67KB), this CSS file is:
- 25× larger than recommended 130-line module size
- Likely contains significant dead code
- Impossible to navigate or maintain

### Why It Matters
| Impact | Severity |
|--------|----------|
| **DX** | Finding styles requires full-text search |
| **Performance** | Larger CSS bundle than necessary |
| **Maintainability** | Changes risk breaking unrelated styles |
| **Dead Code** | Accumulating unused selectors |

### Evidence
```bash
$ wc -l src/features/tournament/TournamentSetup.module.css
3371
```

### Leverage
🟡 **High** — Requires careful audit, but high payoff. Could reduce to <1000 lines.

---

## Problem 3: nameManagementCore.tsx Violates Size Guideline

### Description
At **876 lines**, this component is:
- 2.9× over the 300-line guideline
- Mixing multiple concerns (tournament mode, profile mode, analysis)
- Hard to test in isolation

### Why It Matters
| Impact | Severity |
|--------|----------|
| **Testability** | Cannot test individual modes separately |
| **Cognitive Load** | Too much context to hold in working memory |
| **Reusability** | Tightly coupled modes |

### Evidence
```bash
$ wc -l src/shared/components/NameManagementView/nameManagementCore.tsx
876
```

### Leverage
🟢 **High** — Split into mode-specific components. Clear boundaries already exist in code.

---

## Problem 4: Analysis Components Are Fragmented

### Description
Analysis functionality is split across multiple large files:
- `AnalysisUI.tsx` (722 lines)
- `AnalysisDashboard.tsx` (698 lines)
- `AnalysisBulkActions.tsx` (unknown size)

Combined: **1420+ lines** of related functionality scattered across files.

### Why It Matters
| Impact | Severity |
|--------|----------|
| **Discoverability** | Hard to find where analysis logic lives |
| **Duplication** | Likely shared patterns not abstracted |
| **Maintenance** | Changes require touching multiple files |

### Evidence
- Line counts from `wc -l` output
- Files in different directories

### Leverage
🟡 **Medium** — Consolidation would improve organization but requires careful refactoring.

---

## Problem 5: Tournament.module.css Still Large

### Description
At **1723 lines** (35KB), this CSS file is:
- 13× larger than recommended module size
- Second-largest CSS file after TournamentSetup
- Likely contains dead code

### Why It Matters
| Impact | Severity |
|--------|----------|
| **DX** | Hard to find and modify styles |
| **Maintainability** | Accumulating technical debt |

### Evidence
```bash
$ wc -l src/features/tournament/Tournament.module.css
1723
```

### Leverage
🟡 **Medium** — Audit could reduce size significantly.

---

## Problem 6: Inconsistent Component Sizes

### Description
Component sizes vary wildly:
- Smallest: 33 lines (CommonUI.tsx re-export)
- Largest: 876 lines (nameManagementCore.tsx)
- No consistent pattern or guideline enforcement

### Why It Matters
| Impact | Severity |
|--------|----------|
| **Predictability** | New contributors don't know when to split |
| **Code Review** | Large PRs harder to review |

### Evidence
| Component | Lines | Status |
|-----------|-------|--------|
| nameManagementCore.tsx | 876 | 🔴 Too large |
| AnalysisUI.tsx | 722 | 🔴 Too large |
| TournamentToolbar.tsx | 601 | 🟡 Borderline |
| Loading.tsx | 110 | ✅ Good |

### Leverage
🟡 **Medium** — Establish and enforce 300-line guideline.

---

## Problem 7: TODO Comments Indicate Incomplete Work

### Description
Found 3 TODO comments in the codebase:
- `src/shared/hooks/useTournament.ts`
- `src/shared/providers/AuthProvider.tsx`
- `src/shared/components/AnalysisDashboard/components/AnalysisBulkActions.tsx`

### Why It Matters
| Impact | Severity |
|--------|----------|
| **Technical Debt** | Unfinished features or known issues |
| **Code Quality** | Indicates areas needing attention |

### Leverage
🔵 **Low** — Address individually, not system-level.

---

## Summary: Ranked by Leverage

| Rank | Problem | Leverage | Effort | Priority |
|------|---------|----------|--------|----------|
| 1 | Orphaned CommonUI.module.css | 🟢 Very High | Very Low | **Do Now** |
| 2 | nameManagementCore.tsx size | 🟢 High | Medium | **Do Next** |
| 3 | TournamentSetup.module.css bloat | 🟡 High | High | **Plan** |
| 4 | Analysis component fragmentation | 🟡 Medium | Medium | **Consider** |
| 5 | Tournament.module.css size | 🟡 Medium | High | **Consider** |
| 6 | Inconsistent component sizes | 🟡 Medium | Low | **Document** |
| 7 | TODO comments | 🔵 Low | Varies | **Track** |
