# 02 — Design and Architecture Strategy (Pass 2)

> **Purpose**: Define the improvement strategy for Pass 2, building on Pass 1 success.

---

## What Stays the Same (Explicitly Preserved)

These decisions from Pass 1 remain unchanged:

| Decision | Rationale |
|----------|-----------|
| **Component decomposition pattern** | Loading/, Toast/, Error/ structure proven successful |
| **Token consolidation** | Glass tokens in themes.css working well |
| **TailwindCSS + CSS Modules hybrid** | No reason to change |
| **Zustand + TanStack Query** | State management is solid |
| **300-line component guideline** | Validated by Pass 1 success |

---

## What Evolves (Patterns to Be Tightened)

### 1. Dead Code Elimination
**Current**: Orphaned files exist after refactoring  
**Evolution**: 
- Delete unused CSS files immediately after decomposition
- Verify no imports before deletion
- Update build to catch orphaned files

### 2. Component Size Enforcement
**Current**: Guidelines exist but not enforced  
**Evolution**:
- Split components over 600 lines (hard limit)
- Target 300 lines as soft limit
- Use mode-based decomposition for multi-mode components

### 3. CSS Module Organization
**Current**: Some modules are 3000+ lines  
**Evolution**:
- Audit large CSS files for dead code
- Extract component-specific styles to co-located modules
- Maximum 500 lines per CSS module (new guideline)

---

## Constraints to Introduce

### Component Size Constraint (Strengthened)
> Components over 600 lines MUST be split.

**Enforcement**: Code review + documentation  
**Target**: 300 lines (soft), 600 lines (hard)  
**Exception**: None for new code

### CSS Module Size Constraint (New)
> CSS modules over 500 lines should be audited and split.

**Rationale**: 500 lines ≈ 10KB, manageable in one screen  
**Exception**: Generated or vendor CSS only

### Dead Code Removal Policy (New)
> After refactoring, orphaned files must be deleted in same PR.

**Rationale**: Prevents accumulation of unused code  
**Verification**: Check for imports before deletion

---

## Design Principles Guiding Decisions

### 1. Delete Aggressively
If code is unused, delete it immediately. Don't wait for "someday."

### 2. Mode-Based Decomposition
When a component handles multiple modes, split by mode:
- `nameManagementCore.tsx` → `TournamentMode.tsx`, `ProfileMode.tsx`, `AnalysisMode.tsx`

### 3. Co-locate Related Code
Analysis components should live together:
- `AnalysisDashboard/` (consolidated directory)

### 4. Enforce Limits with Tools
Guidelines without enforcement drift. Add linting or build checks.

### 5. Measure Twice, Cut Once
For large CSS files, audit before splitting to avoid creating more problems.

---

## What is Intentionally NOT Addressed

| Topic | Why Not Now |
|-------|-------------|
| **TournamentSetup.module.css audit** | Requires deep understanding of tournament flow; defer to Pass 3 |
| **Test coverage** | Separate initiative, not design refinement |
| **HeroUI replacement** | No value, works fine |
| **Bundle optimization** | Already excellent (319KB) |
| **TODO comment resolution** | Individual tasks, not system-level |

---

## Success Criteria (Pass 2)

After this pass, the codebase should:

1. ✅ Have no orphaned CSS files
2. ✅ Have no components over 600 lines
3. ✅ Have clear mode-based component boundaries
4. ✅ Have analysis functionality consolidated
5. ✅ Be easier to navigate than after Pass 1

---

## Specific Actions for Pass 2

### Immediate (Do Now)
1. **Delete CommonUI.module.css** — Orphaned, 33KB waste
2. **Split nameManagementCore.tsx** — 876 lines, clear mode boundaries

### Next (Plan)
3. **Consolidate Analysis components** — Improve discoverability
4. **Document component size guideline** — Prevent future drift

### Future (Pass 3)
5. **Audit TournamentSetup.module.css** — Requires domain knowledge
6. **Audit Tournament.module.css** — Secondary priority

---

## Risk Mitigation

### Risk: Breaking imports when deleting CommonUI.module.css
**Mitigation**: Grep for imports first, verify build passes

### Risk: Splitting nameManagementCore breaks functionality
**Mitigation**: Keep same public API, only internal structure changes

### Risk: Analysis consolidation creates new monolith
**Mitigation**: Use clear sub-modules, not one giant file

---

## Comparison to Pass 1 Strategy

### What Worked ✅
- Component decomposition (CommonUI → 3 modules)
- Token consolidation (single source of truth)
- Inline style fixes (utility classes)

### What We Learned 🎓
- Decomposition reveals orphaned files (need cleanup policy)
- Component size guidelines need enforcement
- Large CSS files persist (need dedicated audit pass)

### What We're Applying 🔧
- Immediate cleanup after refactoring
- Stronger size constraints
- Mode-based decomposition pattern
