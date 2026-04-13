# GitHub Actions Workflows

> Documentation for all CI/CD automation in `.github/workflows/` and related configuration.

---

## Overview

This repository uses **5 GitHub Actions workflows** organized into two categories: continuous integration and pull request quality gates.

```
.github/
├── workflows/
│   ├── ci.yml                     # Build + test on push/PR
│   ├── auto-merge-dependabot.yml  # Auto-merge safe Dependabot PRs
│   ├── pr-labels.yml              # Area + size labels on PRs
│   ├── pr-quality.yml             # Title lint + template checklist
│   └── stale.yml                  # Mark + close inactive issues/PRs
├── dependabot.yml                 # Dependabot schedule + grouping
└── labeler.yml                    # File-path → label mapping
```

---

## Workflows

### 1. `ci.yml` — Continuous Integration

**Triggers:** `push` to `main`/`develop`, `pull_request` against those branches, `workflow_dispatch`

Paths that skip this workflow: `**/*.md`, `**/*.mdx`, `**/*.txt`, `docs/**`

| Job | Runner | Timeout | Purpose |
|-----|--------|---------|---------|
| `quality` | `ubuntu-latest` | 20 min | Linting / type-check (`pnpm run check`) + Vite build |
| `test` | `ubuntu-latest` | 20 min | Unit test suite (`pnpm run test`) |

**Key details:**
- Uses **pnpm 10.27.0** and **Node 20.19.6** (locked via `.nvmrc` / `pnpm-lock.yaml`).
- Dependencies are installed with `--frozen-lockfile` to catch lockfile drift.
- Concurrent runs on the same ref are cancelled to save CI minutes (`cancel-in-progress: true`).
- `NODE_OPTIONS=--max-old-space-size=4096` prevents OOM on large builds.
- The two jobs run **in parallel** — neither blocks the other.

---

### 2. `auto-merge-dependabot.yml` — Auto-Merge Dependabot PRs

**Triggers:** `pull_request` (opened/synchronize/reopened), `workflow_dispatch`

**Guard:** Only runs when `github.actor == 'dependabot[bot]'`.

**What it does:**
1. Fetches Dependabot PR metadata via `dependabot/fetch-metadata@v2`.
2. If the update is **not a major semver bump**, enables GitHub's native auto-merge (squash) via `peter-evans/enable-pull-request-automerge@v3`.

Major version updates are intentionally left for manual review to avoid unintentional breaking changes. Concurrency uses `cancel-in-progress: false` so that in-flight enables are never aborted.

> **Note:** This workflow only **enables** GitHub's auto-merge flag once per PR open/update. GitHub itself handles the actual merge once all required checks pass — no `check_suite` polling needed.

---

### 3. `pr-labels.yml` — PR Label Assignment *(merged)*

> Consolidation of the former `pr-labeler.yml` and `pr-size-labeler.yml` into a single workflow on one runner.

**Triggers:** `pull_request_target` (opened/synchronize/reopened)

Two steps run sequentially in one job:

#### Step 1 — Area labels (via `actions/labeler@v6` + `labeler.yml`)

| Label | Files matched |
|-------|--------------|
| `frontend` | `src/**` |
| `backend` | `server/**` |
| `database` | `supabase/**` |
| `ci-cd` | `.github/**` |
| `docs` | `docs/**`, `**/*.md` |

#### Step 2 — Diff size labels (via `codelytv/pr-size-labeler@v1`)

| Label | Max lines changed |
|-------|-----------------|
| `size/xs` | ≤ 25 |
| `size/s` | ≤ 100 |
| `size/m` | ≤ 300 |
| `size/l` | ≤ 800 |
| `size/xl` | > 800 |

---

### 4. `pr-quality.yml` — PR Quality Gates *(merged)*

> Consolidation of the former `pr-hygiene.yml` and `pr-title-lint.yml` into a single workflow with two parallel jobs.

**Triggers:** `pull_request_target` (opened/edited/synchronize/reopened)

#### Job 1 — `title-lint`

Validates PR titles against the **Conventional Commits** spec using `amannn/action-semantic-pull-request@v6`.

**Skipped for:** `dependabot[bot]` actor and PRs whose title starts with `🎨 Palette:`.

**Allowed types:**

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `refactor` | Code restructuring |
| `test` | Adding/fixing tests |
| `docs` | Documentation changes |
| `build` | Build system changes |
| `ci` | CI/CD configuration |
| `chore` | Maintenance tasks |
| `revert` | Reverting a commit |

Format: `<type>(<optional-scope>)!?: <lowercase-subject>`
Example: `fix(auth): handle expired token`

#### Job 2 — `checklist`

Checks that the PR body contains all three required sections:

| Section | Purpose |
|---------|---------|
| `## Summary` | What the PR does and why |
| `## Validation` | How the change was verified |
| `## Rollout + Revert Plan` | Safe deployment and rollback strategy |

A bot comment (keyed by `<!-- pr-hygiene-bot -->`) is posted or updated in place listing any missing sections.

---

### 5. `stale.yml` — Stale Issue & PR Triage

**Triggers:** Schedule (`cron: "30 15 * * 1"` — every Monday at 3:30 PM UTC), `workflow_dispatch`

Uses `actions/stale@v10` with the following policy:

| | Issues | Pull Requests |
|-|--------|--------------|
| Mark stale after | 45 days of inactivity | 30 days of inactivity |
| Close after stale | 14 days | 14 days |
| Stale label | `status/stale` | `status/stale` |
| Exempt labels | `p0`, `security`, `planned` | `work-in-progress`, `do-not-close` |

---

## Dependabot Configuration (`.github/dependabot.yml`)

Two update ecosystems are configured, both running **weekly on Mondays**:

### npm (07:00 PT)
- Opens up to **10 PRs** per cycle
- Groups related packages to reduce PR noise:

| Group | Packages |
|-------|---------|
| `frontend` | `react*`, `@vitejs/*`, `vite`, `tailwind*` |
| `testing` | `vitest`, `@testing-library/*`, `supertest` |
| `types` | `typescript`, `@types/*` |

### github-actions (07:30 PT)
- Opens up to **5 PRs** per cycle
- Keeps all action versions current

---

## Workflow Interaction Map

```
Push to main/develop ──────► ci.yml (quality + test, parallel)

PR opened/updated:
  ├── pr-quality.yml
  │     ├── title-lint   (enforce conventional commits)
  │     └── checklist    (enforce required PR sections)
  │         (both jobs run in parallel)
  └── pr-labels.yml
        ├── step: area labels (by file path)
        └── step: size label (xs/s/m/l/xl)

Dependabot PR:
  ├── ci.yml              (runs normally)
  ├── pr-quality.yml      (title-lint job skipped; checklist runs)
  ├── pr-labels.yml       (runs normally)
  └── auto-merge-dependabot.yml (enables auto-squash if non-major)

Every Monday:
  └── stale.yml           (triage inactive issues + PRs)
```

---

## Permissions Summary

| Workflow | `contents` | `pull-requests` | `issues` |
|----------|-----------|----------------|---------|
| `ci.yml` | read | — | — |
| `auto-merge-dependabot.yml` | **write** | **write** | — |
| `pr-labels.yml` | read | **write** | — |
| `pr-quality.yml` | — | **write** | — |
| `stale.yml` | — | **write** | **write** |

---

## Gameplay Workflows

> End-to-end flows for the tournament feature (`src/features/tournament/`).

---

### Overview

```
User lands on app
  └── TournamentFlow (modes/TournamentFlow.tsx)
        ├── [Not started / complete] → NameSelector (select + filter names)
        └── [Active tournament]      → Tournament (Tournament.tsx)
              ├── useTournamentState  (core state machine)
              ├── useAudioManager     (sound/music)
              └── WebSocket bridge    (real-time updates)
```

---

### 1. Tournament Setup

**Entry point:** `TournamentFlow.tsx` → `NameSelector.tsx`

1. User selects names from their list (manual pick, random generator, or filters via `AdvancedNameFilter`).
2. `resolveTournamentMode(count)` auto-selects the match format:
   - **1v1** — default for any count not divisible by 4.
   - **2v2** — triggered when `count >= 4 && count % 4 === 0`. Participants are randomly shuffled into pairs → `generateRandomTeams()`.
3. A stable `tournamentId` key is derived from sorted name strings + username and stored in `localStorage` via `useLocalStorage`.
4. Bracket entrants are created via `createBracketEntrants()` (shuffled participant ID array) and written to `PersistentTournamentState`.

**Mode resolution table:**

| Participant count | Divisible by 4? | Mode |
|---|---|---|
| 2, 3, 5, 6, 7, … | No | `1v1` |
| 4, 8, 12, … | Yes | `2v2` |

---

### 2. Active Tournament State Machine

**Managed by:** `useTournamentState.ts`

The hook derives all bracket state from two sources of truth:
- `PersistentTournamentState` (localStorage, debounced 1 s)
- In-memory `history` stack (for undo)

```
useTournamentState
  ├── deriveBracketState(bracketEntrants, matchHistory)
  │     └── pendingMatchIds, isComplete, round info
  ├── resolveCurrentMatch(pendingMatchIds, …)
  │     └── Match { left, right, mode }
  └── calculateTournamentMetrics(derived)
        └── round, totalRounds, matchNumber, totalMatches, progress %, etaMinutes
```

**State written to localStorage on every vote:**

| Field | Purpose |
|---|---|
| `matchHistory` | Array of `MatchRecord` (winner/loser IDs, round, match #) |
| `currentRound` | Active round number |
| `currentMatch` | 1-indexed match counter |
| `ratings` | Elo score map `{ [nameId]: number }` |
| `lastUpdated` | Unix ms timestamp (staleness guard) |
| `bracketEntrants` | Ordered participant ID array |

---

### 3. Voting Flow

```
User clicks/taps a side card  (or presses Enter / Space)
  │
  ├─ handleVoteForSide(side)           [Tournament.tsx]
  │     ├── audioManager.primeAudioExperience()
  │     ├── Calculate expectedStreak, heatLevel
  │     ├── setSelectedSide(side)       → visual feedback
  │     ├── voteAnnouncement.setTimed() → "X advances" toast (900 ms)
  │     ├── streakBurst.setTimed()      → streak burst overlay (950 ms)
  │     └── handleVoteWithAnimation(winnerId, loserId)
  │
  ├─ handleVoteWithAnimation()          [useTournamentState.ts]
  │     ├── setIsVoting(true)           → disables cards during cooldown
  │     ├── audioManager.playVoteSound()
  │     └── setTimeout(VOTE_COOLDOWN) → handleVote()
  │
  └─ handleVote(winnerId, loserId)      [useTournamentState.ts]
        ├── computeUpdatedRatings()     → Elo delta applied in memory
        ├── ratingsAPI.applyTournamentMatch()  → fire-and-forget Supabase upsert
        ├── Push HistoryEntry to in-memory stack (for undo)
        ├── updatePersistentState()     → debounced localStorage write
        └── setRefreshKey()             → triggers resolveCurrentMatch re-run
```

**Vote cooldown:** `TIMING.VOTE_COOLDOWN_MS` (from shared constants). Cards are disabled (`isVoting = true`) during this window to prevent double-voting.

---

### 4. Elo Rating System

**Core class:** `EloRating` (`services/tournament.ts`)

All ratings start at `ELO_RATING.DEFAULT_RATING` (1000 by default).

1. On each vote, `computeUpdatedRatings()` calls `calculatePairEloUpdate()` from `@/shared/lib/elo`.
2. The K-factor is boosted for new players (fewer than `newPlayerGameThreshold` games) via `newPlayerKMultiplier`.
3. Rating bounds: `[ELO_RATING.MIN_RATING, ELO_RATING.MAX_RATING]`.
4. For **2v2**, `applyTeamMatchElo()` applies `applyEloMatchUpdate()` across all member IDs of both teams.
5. On completion, final ratings + per-name win/loss tallies are persisted to Supabase via `saveRatingsMutation` (`TournamentFlow.tsx`).

**2v2 note:** Win/loss accounting for 2v2 is skipped in `TournamentFlow.tsx` because team membership is not re-available at completion time; only the Elo ratings are saved.

---

### 5. Streak / Heat System

**Managed by:** `utils/heat.ts`, computed in `Tournament.tsx`

Win streaks are calculated backwards through `matchHistory` until the contestant loses or is absent.

| Streak | Heat Level | Visual Effect |
|---|---|---|
| ≥ 3 | `warm` | Faint orange ring on card |
| ≥ 5 | `hot` | Amber ring + stronger glow |
| ≥ 7 | `blazing` | Bright orange ring + intense glow + streak burst overlay |

The **dominant streak** badge in the HUD shows the side with the higher active streak (if ≥ 3).

---

### 6. Undo Flow

```
User clicks Undo (enabled when history.length > 0)
  │
  └─ handleUndo()  [useTournamentState.ts]
        ├── Pop last HistoryEntry from in-memory stack
        ├── Restore ratings to pre-vote snapshot
        ├── audioManager.playUndoSound()
        └── updatePersistentState() → trim last matchHistory entry, restore ratings
```

Undo is limited to the in-memory session stack — it does not reverse the fire-and-forget Supabase Elo write.

---

### 7. Round Transitions

When `resolveCurrentMatch` returns `null` for all pending slots in the current round, `deriveBracketState` promotes winners to the next bracket level and increments the round counter.

```
Round N complete
  └── deriveBracketState → pendingMatchIds for Round N+1
        └── roundNumber increases → roundAnnouncement.setTimed()
              └── "Next stage — Round N+1" overlay (1200 ms)
                    + audioManager.playSurpriseSound()
```

Bracket stage labels (`getBracketStageLabel`):

| Rounds remaining | Label |
|---|---|
| 0 | Final |
| 1 | Semifinal |
| 2 | Quarterfinal |
| > 2 | Round {N} |

---

### 8. Tournament Completion

```
isComplete = true  (bracketDerived.isComplete)
  │
  ├─ Tournament.tsx: renders <TournamentComplete>
  │     └── onComplete() callback fires once (completionHandledRef guard)
  │           ├── audioManager.playLevelUpSound()
  │           └── setTimeout(500) → audioManager.playWowSound()
  │
  └─ TournamentFlow.tsx: useEffect on tournament.isComplete
        └── saveRatingsMutation.mutateAsync()
              └── ratingsAPI.saveRatings(userId, ratingsWithStats) → Supabase
```

After completion the user can:
- **Analyze Results** — smooth-scroll to `#analysis` section.
- **Start New Tournament** — `handleStartNewTournament()` resets store + localStorage.

---

### 9. Session Persistence & Resume

Tournament state is keyed to a stable `tournamentId` (`tournament-{userName}-{sortedNames}`) and persisted to `localStorage` with a 1-second debounce.

On page reload:
1. `useTournamentState` reads from `localStorage`.
2. `sanitizePersistentState()` validates and fills missing fields with defaults.
3. A staleness guard (`lastUpdated` vs `lastRatingsUpdateRef`) prevents an older localStorage write from overwriting newer in-memory ratings.
4. If the name set has changed (`namesKey` mismatch), the bracket resets while ratings are preserved if possible.

---

### 10. WebSocket Integration

`useWebSocket({ autoConnect: true })` connects on mount and exposes three subscription helpers returned from `useTournamentState`:

| Export | Purpose |
|---|---|
| `subscribeToTournamentUpdates` | Real-time tournament state sync |
| `subscribeToMatchResults` | Live match result feed |
| `subscribeToUserActivity` | Presence/activity events |

The WebSocket is cleaned up on hook unmount.

---

### 11. Audio Manager

`useAudioManager` (from `hooks/useHelpers.tsx`) wraps all in-game sounds. Triggered events:

| Event | Sound |
|---|---|
| Vote cast | `playVoteSound()` |
| Streak achieved | `playStreakSound(streak)` |
| Undo | `playUndoSound()` |
| New round | `playSurpriseSound()` |
| Tournament complete | `playLevelUpSound()` + `playWowSound()` |
| Background music | `toggleBackgroundMusic()` |

Controls exposed in the tournament header: mute/unmute, previous track, next track, toggle background music.

---

### Gameplay Interaction Map

```
User selects names
  └── NameSelector → tournament store populated

Tournament starts
  └── useTournamentState initializes bracket
        ├── Per-match: Vote → Elo update → localStorage persist → next match
        │     └── [streak ≥ 3] → heat overlay + streak sound
        ├── Per-round: auto-advance → round announcement overlay
        └── On complete: TournamentComplete screen + Supabase save

At any time:
  ├── Undo → restore previous match state
  └── Exit → handleQuit() → reset store + navigate to "/"
```
