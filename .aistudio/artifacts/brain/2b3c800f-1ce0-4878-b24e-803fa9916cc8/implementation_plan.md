# Naming Nosferatu: UI Revamp & Balanced Modular Architecture

Streamline and elevate the **Naming Nosferatu** experience by refining the UI/UX within its signature palette and layout, replacing heavy custom WebGL/SVG/scroll plumbing with crisp CSS and Framer Motion implementations, and splitting all 1,000+ line mega-files into clean, maintainable **200–400 line modules** while keeping the entire repository comfortably under the **50-file ceiling** (~44 total files).

### User Review & Critical Decisions

> [!IMPORTANT]
> Based on your confirmed preferences, the revamp locks in the following core decisions:
> - **Scope**: Revamp and polish UI interactions, visual clarity, and responsiveness while dramatically simplifying oversized code.
> - **Mega-File Strategy**: Both simplify over-engineered effects (WebGL shaders, pooled SVG displacement filters, custom inertia scroll engines) **and** split the 5 oversized files (`VisualEffects.tsx`, `hooks.ts`, `TournamentViews.tsx`, `tournamentEngine.ts`, `AppChrome.tsx`) into balanced **200–400 line** focused modules.
> - **Visual Identity**: Preserve the exact current color palette (`oklch` light/dark tokens, `#12100d` dark canvas, rose/magenta primary `--accent`, mint `--secondary-accent`, Fredoka & Quicksand typography) and spatial layout structure.

- **Confirmed Decision 1**: Eliminate the 5 mega-files (currently 1,015 to 1,838 lines each; ~7,080 lines combined) by stripping redundant boilerplate and distributing responsibilities across 10 focused modules averaging ~250 lines each.
- **Confirmed Decision 2**: Keep total repository file count at **44 files** (22 in `public/`, 8 root/config files, and 20 in `src/`—well below the 50-file limit) with **zero source file exceeding 400 lines**.

---

### 1. Overview & Core Concept

- **What It Does**: Naming Nosferatu is an interactive cat-naming tournament and Elo rating showcase where users browse candidate names in an orbital/grid showcase (`DriftWall`), configure 1v1 or 2v2 brackets, vote in head-to-head matchups (`TournamentArena`), inspect live bracket trees (`TournamentBracket`), and crown a champion (`TournamentComplete`).
- **Target Audience**: Friends, cat lovers, and community voters looking for a tactile, joyful, zero-friction bracket voting experience on desktop or mobile.
- **Key Value of This Revamp**:
  1. **Zero Mega-Files**: Every TypeScript/React module in `src/` is scoped to a single clear domain (200–400 lines), making the codebase effortless to read and navigate.
  2. **Lighter, Snappier Runtime**: Replacing 1,800+ lines of raw WebGL (`ogl`) shaders, manual SVG filter registries, and custom pointer-capture physics with hardware-accelerated CSS backdrop-blur, radial mesh gradients, and native smooth scrolling + Framer Motion springs removes jank and cuts bundle overhead.
  3. **Refined UI Polish**: Cleaner card elevation, crisp typography hierarchy, tabular numerals for Elo ratings and streaks, and responsive touch targets ($\ge 44\text{px}$) while keeping the exact current palette and layout flow.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Contender Showcase & Roster Setup (`DriftWall` & `NameSelector`)**: Users explore the interactive cat name showcase, filter or select contenders, and launch right into a bracket with one click.
  2. **Head-to-Head Voting (`TournamentArena`)**: Two contenders (or 2v2 tag teams) face off side-by-side with keyboard support (`ArrowLeft` / `ArrowRight`), live Elo win-streak heat indicators (`warm`, `hot`, `blazing`), round progress, and instant undo.
  3. **Interactive Bracket Inspection (`TournamentBracket`)**: Users toggle between the visual `Tree Flow` and `Rounds List` views, search contenders in real time with `MagicToolbar`, and zoom/pan smoothly.
  4. **Championship Podium (`TournamentComplete`)**: Displays the crowned winner, podium finishers, final Elo standings with win/loss records, and quick-restart controls.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Tactile liquid-glass editorial playful aesthetic—preserving the exact current `oklch` color tokens (`--bg`, `--surface`, `--fg`, `--accent: 0.75 0.15 350`, `--secondary-accent: 0.8 0.12 160`) and dark mode atmosphere.
  - *Typography & Hierarchy*: `Fredoka` (`--font-display`) for expressive headers and contender titles; `Quicksand` (`--font-sans`) for body copy and controls; `tabular-nums` on all Elo ratings, round counters, and match percentages.
  - *Component Styling & Layout*: Frosted glass surfaces (`backdrop-blur-xl`), subtle specular borders, and clean spacing hierarchy without nested card clutter.
- **Interactive Feedback & Motion**:
  - Snappy $\le 200\text{ms}$ button and card hover responses using compositor-only `transform` and `opacity` transitions.
  - Native CSS smooth scrolling with momentum instead of a 450-line custom JS inertia loop.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Replace Heavy WebGL & Custom SVG Filter Pools with CSS + Framer Motion**
  - *Chosen Approach*: Streamline `GlassSurface`, `Iridescence`, and `DriftWall` by using modern CSS `backdrop-filter`, layered radial gradients, and hardware-accelerated CSS/Framer Motion transforms instead of raw `ogl` WebGL shaders and manual DOM SVG `<filter>` pools.
  - *Why*: Cuts `VisualEffects` from 1,838 lines down to ~450 lines split across two clean files (`GlassEffects.tsx` and `DriftWall.tsx`), eliminates GPU context loss bugs on mobile, and preserves the exact liquid-glass visual look.
- **Decision 2: Split the 5 Mega-Files into Balanced 200–400 Line Domain Modules**
  - *Chosen Approach*:
    - Split `VisualEffects.tsx` (1,838 LOC) $\rightarrow$ `GlassEffects.tsx` (~200 LOC) + `DriftWall.tsx` (~280 LOC).
    - Split `hooks.ts` (1,552 LOC) $\rightarrow$ `hooks/useCommonHooks.ts` (~240 LOC) + `hooks/useTournamentState.ts` (~320 LOC).
    - Split `TournamentViews.tsx` (1,494 LOC) $\rightarrow$ `TournamentSetup.tsx` (~280 LOC) + `TournamentArena.tsx` (~340 LOC) + `TournamentBracket.tsx` (~320 LOC) + `TournamentComplete.tsx` (~240 LOC).
    - Split `tournamentEngine.ts` (1,182 LOC) $\rightarrow$ `tournamentEngine.ts` (~320 LOC) + `bracketTree.ts` (~280 LOC).
    - Split `AppChrome.tsx` (1,015 LOC) $\rightarrow$ `UiPrimitives.tsx` (~260 LOC) + `AppChrome.tsx` (~300 LOC).
  - *Why*: Every single file in `src/` lands in the sweet spot of **150–380 lines**, keeping total repository files at **44** (under the 50-file ceiling) while eliminating 1,000+ line monoliths.
- **Decision 3: Simplify `index.css` & Store Persistence**
  - *Chosen Approach*: Consolidate redundant CSS keyframes and unused legacy classes in `index.css` while keeping all theme variables and glass tokens intact; streamline `storage.ts` and `store/index.ts` to remove duplicate serialization wrappers.
  - *Why*: Improves maintainability and page load performance with zero loss of state persistence or theme fidelity.

---

### 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────────┐
│                             index.html                               │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│                            src/main.tsx                              │
│                                 │                                    │
│                   src/components/AppChrome.tsx                       │
│            (Providers, BootScreen, Layout, Error/Toast)              │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│                            src/App.tsx                               │
│                                 │                                    │
│        ┌────────────────────────┼────────────────────────┐           │
│        ▼                        ▼                        ▼           │
│  UI & Visual Layer       Controls & Setup        Tournament Flow     │
│  ├─ UiPrimitives.tsx     ├─ MagicControls.tsx    ├─ TournamentSetup  │
│  ├─ GlassEffects.tsx     └─ DriftWall.tsx        ├─ TournamentArena  │
│  └─ AppChrome.tsx                                ├─ TournamentBracket│
│                                                  └─ TournamentComplete│
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│                      Engine, Hooks & State Layer                     │
│  ├─ tournament/tournamentEngine.ts   ├─ hooks/useTournamentState.ts  │
│  ├─ tournament/bracketTree.ts        ├─ hooks/useCommonHooks.ts      │
│  ├─ store/index.ts                   └─ lib/{api,storage,utils}.ts   │
└──────────────────────────────────────────────────────────────────────┘
```

#### Data Model & State Mapping
- **Zustand Store (`src/store/index.ts`)**: Holds `tournament` state (active contenders, `ratings`, `voteHistory`, `matchHistory`, `currentRound`, `currentMatch`, `mode`), `user` profile, and `ui` theme (`light` / `dark` / `system`).
- **Tournament State Hook (`useTournamentState`)**: Orchestrates bracket progression, auto-advances bye rounds, computes real-time Elo adjustments via `tournamentEngine`, supports single-click `handleUndo`, and syncs snapshots to `localStorage`.
- **Interactive View Transitions**:
  - **Setup State**: Renders `DriftWall` showcase and `NameSelector` roster picker; clicking *Start Tournament* initializes seeds/teams and transitions to `TournamentArena`.
  - **Active Match State**: Renders `TournamentHeader` + `BracketTree` pill bar + 2-column contender cards (`TournamentArena`) with keyboard and click voting handlers; clicking *Bracket Path* opens the `TournamentBracket` modal (`tree` or `cards` view with live search and zoom).
  - **Completed State**: Transitions to `TournamentComplete` podium with champion spotlight, Elo leaderboard table, and *Play Again* reset handler.
