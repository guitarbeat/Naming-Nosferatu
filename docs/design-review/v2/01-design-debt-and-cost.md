# 01 — Design Debt and Cost (V2)

> **The real price of the current system, ranked by long-term damage.**

---

## Debt Ranking Criteria

Ranked by **compounding cost over time**, not ease of fix:
1. Problems that get worse with every feature added
2. Problems that slow down every developer
3. Problems that create more problems

---

## Tier 1: Compounding Debt (Gets Worse Daily)

### 1.1 No File Size Enforcement

**Current state**: Components range from 33 to 969 lines. CSS modules range from 30 to 3371 lines.

**Why it compounds**:
- Every new feature adds code to existing large files (path of least resistance)
- Large files attract more code ("it's already big, one more function won't hurt")
- Splitting becomes harder as files grow (more dependencies to untangle)

**Cost per month**: ~2-4 hours of developer confusion per large file touched

**Evidence**:
| File | Lines | Growth Risk |
|------|-------|-------------|
| `nameManagementCore.tsx` | 876 | High — handles 3 modes, will grow with each |
| `TournamentSetup.module.css` | 3371 | Critical — every tournament UI change adds here |
| `cat-names-consolidated.ts` | 969 | High — all name-related API calls |
| `general.ts` (supabase) | 861 | High — catch-all for "other" API calls |

---

### 1.2 CSS Architecture Vacuum

**Current state**: No one owns CSS. No policy for CSS Modules vs Tailwind. No size limits. No dead code removal.

**Why it compounds**:
- Developers copy existing patterns, which are inconsistent
- Dead CSS accumulates (no tooling to detect it)
- Specificity conflicts increase as files grow
- Theme tokens are duplicated across files

**Cost per month**: ~4-8 hours debugging CSS conflicts, finding correct selectors

**Evidence**:
- `CommonUI.module.css`: 1865 lines, **completely unused**, still in repo
- `TournamentSetup.module.css`: 3371 lines, unknown % dead code
- Glass tokens defined in both `design-tokens.css` AND `themes.css`
- No CSS linting for unused selectors

---

### 1.3 Type Definition Scatter

**Current state**: Types live in 5+ locations with no policy.

**Why it compounds**:
- New types get added wherever is convenient
- Duplicate types emerge (same shape, different names)
- Import paths become unpredictable
- Refactoring requires finding all type locations

**Cost per month**: ~1-2 hours per feature hunting for correct types

**Evidence**:
| Location | Purpose | Lines |
|----------|---------|-------|
| `src/types/store.ts` | Store types | 97 |
| `src/shared/propTypes.ts` | Component props | 85 |
| `src/types/shims.d.ts` | Module declarations | 59 |
| `src/App.tsx` (inline) | Local interfaces | ~55 |
| `src/integrations/supabase/types.ts` | DB types | 801 |
| Various component files | Inline types | Unknown |

---

## Tier 2: Cognitive Load Debt (Slows Every Task)

### 2.1 Developer Cognitive Load

**What developers must hold in memory**:

1. **Where does this component live?**
   - `shared/components/`? `features/tournament/components/`? `features/auth/`?
   - No consistent rule. Must search.

2. **Which CSS approach for this element?**
   - CSS Module class? Tailwind utility? Inline style?
   - All three are used. No guidance.

3. **Where do I add this type?**
   - `types/`? `propTypes.ts`? Inline? Co-located?
   - No policy. Copy what's nearby.

4. **Is this hook shared or feature-specific?**
   - `shared/hooks/`? `core/hooks/`? `features/*/hooks/`?
   - Three locations exist. Unclear boundaries.

**Cost**: Every decision requires context-switching to figure out "how we do things here."

---

### 2.2 User Cognitive Load

**What users must process**:

1. **Inconsistent interaction patterns**
   - Some buttons have hover states, some don't
   - Some cards are clickable, some aren't (no visual distinction)
   - Toast positions vary

2. **Visual hierarchy unclear**
   - Glass effects used everywhere (nothing stands out)
   - Too many accent colors (cyan, pink, red all compete)
   - Typography scale exists but isn't consistently applied

3. **State feedback inconsistent**
   - Loading states vary (spinner, skeleton, overlay, none)
   - Error states vary (inline, toast, modal, boundary)
   - Success states vary (toast, inline message, nothing)

**Cost**: Users learn the app slower. Errors feel random.

---

## Tier 3: Structural Debt (Blocks Future Work)

### 3.1 Store Monolith

**Current state**: `useAppStore.ts` is 483 lines with tournament, user, UI, errors, and site settings all in one store.

**Why it blocks**:
- Adding new features means extending the monolith
- Testing requires mocking the entire store
- No clear boundaries for what belongs where
- Performance: any state change re-renders all subscribers

**What should exist**:
```
stores/
├── useTournamentStore.ts  # Tournament state only
├── useUserStore.ts        # User/auth state only
├── useUIStore.ts          # Theme, modals, etc.
└── useAppStore.ts         # Composition of above (if needed)
```

---

### 3.2 Mode-Coupled Components

**Current state**: `nameManagementCore.tsx` handles tournament, profile, AND analysis modes in 876 lines.

**Why it blocks**:
- Can't modify tournament mode without risking profile mode
- Can't test modes in isolation
- Can't lazy-load modes independently
- Adding a 4th mode would make it worse

**What should exist**:
```
NameManagement/
├── TournamentMode.tsx     # Tournament-specific logic
├── ProfileMode.tsx        # Profile-specific logic
├── AnalysisMode.tsx       # Analysis-specific logic
├── shared/                # Truly shared utilities
│   ├── useNameSelection.ts
│   └── types.ts
└── index.tsx              # Mode router
```

---

### 3.3 Feature Folder Anarchy

**Current state**: Feature folders have no consistent structure.

**Evidence**:
```
features/tournament/           features/auth/           features/profile/
├── components/ (12 items)     ├── hooks/ (1 item)      ├── hooks/ (1 item)
├── hooks/ (4 items)           ├── Login.module.css     └── (nothing else)
├── Tournament.tsx             └── (no components/)
├── TournamentSetup.module.css (67KB!)
├── Tournament.module.css (35KB!)
├── Dashboard.tsx
├── TournamentControls.tsx
├── RankingAdjustment.tsx
├── tournamentUtils.ts
└── CombinedLoginTournamentSetup.tsx
```

**Why it blocks**:
- No template for new features
- Inconsistent depth (some flat, some nested)
- CSS co-location inconsistent
- Can't predict where to find things

---

## Debt Summary Table

| Debt | Tier | Monthly Cost | Fix Effort | Compounds? |
|------|------|--------------|------------|------------|
| No file size limits | 1 | 4-8 hrs | Low (add linting) | Yes |
| CSS architecture vacuum | 1 | 4-8 hrs | High (audit + policy) | Yes |
| Type scatter | 1 | 2-4 hrs | Medium (consolidate) | Yes |
| Developer cognitive load | 2 | 8-16 hrs | Medium (document rules) | Slowly |
| User cognitive load | 2 | Unknown | High (design system) | Slowly |
| Store monolith | 3 | Blocks features | High (refactor) | No |
| Mode-coupled components | 3 | Blocks features | High (refactor) | No |
| Feature folder anarchy | 3 | Blocks onboarding | Medium (template) | No |

---

## What the First Pass Missed

The first pass listed problems. It didn't quantify cost or identify compounding.

**Key insight**: Tier 1 debts are more urgent than Tier 3, even though Tier 3 sounds scarier. Compounding debt gets exponentially worse. Structural debt stays constant.

**Priority order**:
1. Stop the bleeding (file size limits, CSS policy)
2. Reduce daily friction (type consolidation, folder templates)
3. Enable future work (store slices, mode separation)

The first pass had this backwards, prioritizing "split nameManagementCore" over "enforce file size limits." Splitting one file doesn't prevent the next file from growing.
