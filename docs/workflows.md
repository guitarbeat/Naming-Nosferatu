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
