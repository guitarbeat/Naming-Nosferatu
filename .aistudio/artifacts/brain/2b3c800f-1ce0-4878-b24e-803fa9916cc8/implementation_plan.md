# File Count Reduction Plan: Sub-50 Architecture

Consolidate the application codebase from 94 files down to **47 files** (a 50% reduction, well below the requested 50-file ceiling) while preserving all 22 local cat images, maintaining 100% of the tournament gameplay and visual styling, and simplifying code maintenance.

### User Review & Critical Decisions

> [!IMPORTANT]
> Based on your responses, the following architectural decisions are locked:
> - **Preserve Local Media**: All 15 local cat contestant photos, GIF animations, and public UI assets (22 files total) are kept intact.
> - **Remove Standalone Test Suites**: The 15 individual test files (`*.test.ts`, `*.test.tsx`) are removed to drastically cut file overhead.
> - **Consolidate Code into High-Cohesion Modules**: Atomic UI primitives, small utility scripts, and tournament sub-views are merged into clean, self-contained multi-export modules in `src/`.
> - **Prune Unused Backend Artifacts**: Delete the 4 unused Supabase SQL migration files and unreferenced validation script, as the app operates on client-side and localStorage persistence.

- **Target File Count**: **47 files** (down from 94).
- **Functionality Impact**: Zero regression. Full tournament bracket generation, Elo rating calculation, voting arena, audio feedback, glassmorphism UI, and offline caching remain operational.

---

### 1. Overview & Core Concept

- **What It Does**: Names Nosferatu is a tournament-style cat name ranking and voting platform. Users pit cat contestants against each other in bracket-style matchups, compute real-time Elo rating adjustments, browse leaderboards, and experience fluid web animations and glass-surface visual effects.
- **Goal of This Change**: Streamline the repository architecture to eliminate file sprawl, redundant layers, and excessive fragmentation without altering the user-facing design or functionality.
- **Target Count Breakdown**:
  - `public/`: 22 files (15 cat media assets, 4 UI icons, manifest, service worker, cat catalog)
  - `config/`: 4 files (`biome.json`, `knip.json`, `tsconfig.json`, `vite.config.ts`)
  - Root: 6 files (`package.json`, `bun.lock`, `metadata.json`, `index.html`, `components.json`, `LICENSE`)
  - `src/`: **15 files** (consolidated application architecture)
  - **Total**: **47 files**

---

### 2. User Experience & Visual Design

- **Visual Continuity**: The app maintains its exact aesthetic posture—dark mode atmosphere (`#12100d`), glassmorphism cards, GPU-accelerated iridescence background effects, and animated tournament matchups with Framer Motion.
- **Key User Flows Preserved**:
  1. **Boot & Catalog Browsing**: Users land on the cat grid with live search, tag filtering, and quick sound/theme toggles.
  2. **Tournament Configuration**: Users configure bracket size (8, 16, or 32 contestants), select seeding mode (Random or Elo-ranked), and initiate the bracket.
  3. **Voting Arena**: Side-by-side voting matchups with keyboard controls (`ArrowLeft`/`ArrowRight`), animated votes, and immediate score recalculations.
  4. **Bracket Inspection & Podium**: Interactive bracket view visualizing the tree of matchups leading to the championship crown.

---

### 3. Key Product Decisions & Trade-Offs

- **Consolidating Atomic UI Components into `AppChrome.tsx` & `MagicControls.tsx`**:
  - *Chosen Approach*: Group closely related presentation components (`AppBootScreen`, `GlobalErrorDisplay`, `GlobalLoadingOverlay`, `SkipToMainButton`, `PwaInstallPrompt`, and `Providers`) into `src/components/AppChrome.tsx`, and toolbar controls (`MagicToolbar`, `MagicSearch`, `MagicToggle`) into `src/components/MagicControls.tsx`.
  - *Why*: Eliminates 9 micro-files while preserving clear component exports and reducing import friction.
- **Unifying Tournament Views into `TournamentViews.tsx`**:
  - *Chosen Approach*: Merge `TournamentSetup`, `TournamentArena`, `TournamentBracket`, `TournamentComplete`, and `NameSelector` into `src/tournament/TournamentViews.tsx`, with tournament logic residing in `src/tournament/tournamentEngine.ts`.
  - *Why*: Keeps tournament presentation and algorithm logic tightly coupled and easier to follow, saving 5 files.
- **Consolidating Library Utilities into `src/lib/utils.ts`**:
  - *Chosen Approach*: Merge `constants.ts`, `elo.ts`, `logger.ts`, `names.ts`, and `uiUtils.ts` into `src/lib/utils.ts`. Keep `src/lib/storage.ts` and `src/lib/api.ts` dedicated.
  - *Why*: Eliminates 5 tiny helper files while ensuring all helper functions remain exported with zero breaking changes.
- **CSS Inlining**:
  - *Chosen Approach*: Move `src/components/GlassSurface.css` directly into `src/index.css`.
  - *Why*: Eliminates a dedicated CSS file while centralizing all custom styling in the main stylesheet.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                      index.html                        │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                      src/main.tsx                      │
│                           │                            │
│                 src/components/AppChrome               │
│         (Providers, BootScreen, Overlays, Layout)      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                      src/App.tsx                       │
│                           │                            │
│     ┌─────────────────────┼──────────────────────┐     │
│     ▼                     ▼                      ▼     │
│ src/components/     src/components/       src/tournament/│
│  MagicControls       VisualEffects       TournamentViews│
│ (Toolbar, Search,   (Glass, DriftWall,   (Setup, Arena, │
│    Filter Tags)        Iridescence)      Bracket, Podium│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    State & Logic Layer                 │
│  src/store/index.ts         src/tournament/engine.ts   │
│  src/lib/storage.ts         src/lib/api.ts             │
│  src/lib/utils.ts           src/hooks.ts               │
└────────────────────────────────────────────────────────┘
```

#### Complete Consolidated File Tree (47 files):

```
.
├── config/
│   ├── biome.json
│   ├── knip.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── public/
│   ├── assets/
│   │   ├── cats/ (15 cat photos & animated GIFs)
│   │   └── images/ (4 UI icons & favicons)
│   ├── data/cats.json
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── components/
│   │   ├── AppChrome.tsx
│   │   ├── MagicControls.tsx
│   │   └── VisualEffects.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── storage.ts
│   │   └── utils.ts
│   ├── store/
│   │   └── index.ts
│   ├── tournament/
│   │   ├── tournamentEngine.ts
│   │   └── TournamentViews.tsx
│   ├── App.tsx
│   ├── hooks.ts
│   ├── index.css
│   ├── main.tsx
│   ├── types.ts
│   └── vite-env.d.ts
├── bun.lock
├── components.json
├── index.html
├── LICENSE
├── metadata.json
└── package.json
```

#### Verification & Quality Gates
1. Run `npm run lint` (Biome + TypeScript + Knip checks) to ensure 0 lint errors, 0 unused imports, and 0 missing types.
2. Run `npm run build` to verify clean Vite production bundle compilation.
3. Validate total file count with `find . -not -path '*/.*' -not -path './node_modules*' -not -path './dist*' -type f | wc -l` to confirm count is ≤ 47.
