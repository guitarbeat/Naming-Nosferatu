# Project Roadmap v2.0

**Last Updated:** January 2026
**Status:** Strategic Vision & Operational Health Tracker
**Focus:** Product clarity through name lifecycle formalization

## 🎯 Strategic Direction

**Core Thesis:** Transform from generic "cat name tournament app" to deliberate obsession/comparison platform. The name lifecycle becomes the north star.

### Vision: "Deliberate Obsession"

Every interaction should feel like feeding an endless curiosity about names, not just completing a task.

- **Progressive Complexity:** Simple by default, powerful when needed
- **Visual Hierarchy:** Names are the stars, UI fades into background
- **Feedback Loops:** Immediate response to every decision
- **Thematic Cohesion:** Every element reinforces the comparison obsession

---

## 🗺️ Application Roadmap

### ✅ Completed Milestones (2025)

- **Pass 1-4**: CSS cleanup, Store splitting, CI integration, and documentation standardization.
- **Pass 5: Tournament Refactoring**: Refactored `TournamentUI.tsx` with HeroUI, extracted voting hooks, and improved bracket animations.
- **Pass 6: Documentation Consolidation**: Reduced 13 documentation files into 4 strategic hubs (Jan 2026).
- **Pass 7: Utilitarian Cleanup**: Removed "Modern/Legacy" prefixes, consolidated login setup, and renamed 20+ files for clarity. Removed 26 unused files.
- **Pass 8: Refactoring & Optimization**: Decomposed Supabase services, consolidated name utilities, and implemented `updateSlice` for Zustand stores (Jan 2026).

### 🚀 Strategic Roadmap (2026)

#### Phase 1: Name Lifecycle Foundation (Q1 2026)

**Goal:** Make the app's purpose crystal clear through explicit name lifecycle management.

##### ✅ Week 1-2: Domain Model Overhaul

- **Define Name Lifecycle States:**
  - `candidate` → `intake` → `categorized` → `tournament_ready` → `eliminated` → `archived`
- **Add Provenance Tracking:**
  - Who added each name? When? Which tournaments survived?
  - Track vote margins, tie-break rules, and elimination reasons
- **Database Schema Updates:**
  - Add `name_status` enum and `provenance_log` table
  - Index on `added_by`, `status`, `created_at`

##### ✅ Week 3-4: UI State Machine

- **Progressive Disclosure UI:**
  - Default to "quick tournament" mode
  - "Expert mode" toggle unlocks advanced seeding/rules
  - Add "decision fatigue" limiter (max votes per session)
- **Lifecycle Visualization:**
  - Show name progression through stages
  - Add provenance tooltips ("Added by Sarah • Survived 3 rounds")

##### ✅ Week 5-6: Core Loop Polish

- **Tournament Invariants:**
  - Always produces exactly one winner
  - Vote totals always match ballot count
  - Drag-and-drop never creates duplicates
- **Optimistic Updates:**
  - Instant rating changes with rollback on failure
  - Visual feedback for all state transitions

#### Phase 2: Obsession & Comparison (Q2 2026)

**Goal:** Lean into the "Nosferatu" theme of relentless comparison.

##### ✅ Week 7-8: Thematic Coherence

- **Copy & Tone Updates:**
  - Error states: "The names demand another comparison..."
  - Loading states: "Consulting the ancient rankings..."
  - Success states: "A victor emerges from the eternal tournament"
- **Visual Identity:**
  - Subtle gothic influences in spacing/colors
  - Animation easing that feels "deliberate" not "snappy"

##### ✅ Week 9-10: Analytics Depth

- **Personal Insights:**
  - "Names you consistently like but never pick"
  - "Themes that dominate your finals"
  - "Your voting patterns vs. global trends"
- **Provenance Analytics:**
  - Name survival rates by category/theme
  - User contribution impact tracking

##### ✅ Week 11-12: Advanced Tournament Modes

- **Seeding Constraints:**
  - Theme-based (science, mythology, vibes)
  - Syllable limits, alliteration requirements
- **Comparison Algorithms:**
  - Standard Elo, Bradley-Terry, and custom "obsession" weighting

#### Phase 3: Scale & Polish (Q3 2026)

**Goal:** Make the experience feel inevitable, not accidental.

##### ✅ Month 3-4: Performance Architecture

- **Route-Level Bundles:**
  - Tournament route: <300KB
  - Analytics route: <250KB
  - Gallery route: <400KB (with images)
- **Code Splitting Strategy:**
  - Feature-based chunks with explicit naming
  - Lazy load heavy dependencies (drag-and-drop, charts)

##### ✅ Month 5-6: Testing Overhaul

- **Invariant-Focused Tests:**
  - Tournament always produces winner
  - Vote totals match ballots
  - Drag operations preserve data integrity
  - Rating calculations are deterministic
- **Property-Based Testing:**
  - Name comparison logic with generated datasets

---

## 🛠️ Technical Improvements

### Architecture Consolidation

- **State Boundary Enforcement:**
  - React Query: server state only
  - Zustand: UI + cross-route client state
  - Document and audit current usage
- **Feature-Based Organization:**
  - `src/features/names/` (lifecycle management)
  - `src/features/tournaments/` (competition logic)
  - `src/features/analytics/` (insights)

### Bundle Optimization

- **Current:** 391KB total (48% optimized)
- **Target:** Route-based budgets
- **Strategy:** Explicit chunk naming + lazy loading

### Testing Strategy

- **Current:** 85% coverage
- **Target:** 95% on invariants, 90% on components
- **Focus:** Behaviors that survive refactors

---

## 📊 Success Metrics

### Product Metrics

- **Time to First Tournament:** <2 minutes
- **Tournament Completion Rate:** >80%
- **Return Usage:** >60% (tracked via localStorage)
- **Name Lifecycle Clarity:** User testing shows understanding

### Technical Metrics

- **Bundle Sizes**: Meet route-level budgets
- **Test Coverage**: 95% on critical invariants (Currently 85%)
- **Performance**: <500ms cold load, <100ms warm navigation
- **Type Safety**: Zero `any` types in application code (Achieved Jan 2026)

---

## 🐛 Active Bugs & Issues

### High Priority

- **Testing Coverage**: Target 90% coverage for core tournament logic and hooks. (Currently 85%)

### Medium Priority

- **Export CSV**: Type mismatches in `exportTournamentResultsToCSV` parameters.
- **State Sync**: Occasional delay in Elo rating updates after rapid voting clicks.

### Low Priority

- **Testing Coverage**: Target 90% coverage for core tournament logic and hooks.
- **Mobile Mastery**: Implement native-feeling swipe gestures for voting and name management.
- **Performance Dashboard**: Create an admin view for real-time app performance metrics.

---

## 🏗️ Technical Health & Maintainability

### Maintainability Metrics (Jan 2026)

- **Type Safety Score**: 10/10 (All `any` types removed from application services).
- **File Size Compliance**: 100% (All components and services decomposed).
- **Test Coverage**: ~85%.

### File Cleanup Status

The following files were identified as deprecated and have been removed/consolidated:

- `App.modern.tsx` (Migrated to `App.tsx`)
- `CommonUI.css` (Decomposed into shared components)
- `TournamentSetup.module.css` (Divided into Modes)

### ✅ Recent Cleanup (Jan 7, 2026)

- **Lint Status**: 0 Errors, 0 Warnings.
- **Type Check**: 100% Pass.
- **Build Status**: Success (Production Build).
- **Consolidated Files**:
  - `CombinedLoginTournamentSetup` -> `TournamentSetup`
  - Removed `ModernTournamentSetup` folder.
  - Simplified CSS Module names (removed 6+ redundant prefixes).

---

## 🚩 Risk Mitigation

### Technical Risks

- **State Management Complexity:** Regular audits of Query vs Zustand usage
- **Bundle Bloat:** Strict budgets with CI enforcement
- **Type Regression:** Pre-commit hooks for type checking

### Product Risks

- **Feature Creep:** Strict adherence to lifecycle focus
- **UX Confusion:** User testing on every major change
- **Performance Regression:** Continuous monitoring and budgets

---

## 📅 Timeline Summary

- **Phase 1 (Q1):** Name lifecycle foundation
- **Phase 2 (Q2):** Thematic depth and analytics
- **Phase 3 (Q3):** Scale, polish, and testing
- **Launch:** Q4 2026 with comprehensive testing

---

## 🧹 Cleanup Checklist

- [x] ~~Remove `TournamentLegacy.module.css`~~ (Already removed)
- [x] ~~Remove `SetupLegacy.module.css`~~ (Already removed)
- [x] ~~Remove `docs/archive/`~~ (Removed Jan 2026)
- [x] ~~Remove corrupted `.pnpm-store/`~~ (Removed Jan 2026)
- [x] ~~Rename `CombinedLoginTournamentSetup`~~ (Renamed to `TournamentSetup.tsx`)
- [x] ~~Remove "Modern" prefixes and Unused files~~ (Completed Jan 2026)

---

**This roadmap transforms the app from a collection of features into a coherent experience centered on the deliberate, obsessive comparison of cat names.**
