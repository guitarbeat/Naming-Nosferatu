# GitHub Actions Workflows

> Documentation for all CI/CD automation in `.github/workflows/` and related configuration.

---

## Overview

This repository uses **7 GitHub Actions workflows** organized into two categories: continuous integration and pull request quality gates. Together they enforce code health, semantic PR conventions, automated dependency management, and repository hygiene.

```
.github/
├── workflows/
│   ├── ci.yml                  # Build + test on push/PR
│   ├── auto-merge-dependabot.yml  # Auto-merge safe Dependabot PRs
│   ├── pr-hygiene.yml          # Enforce PR template sections
│   ├── pr-labeler.yml          # Label PRs by changed files
│   ├── pr-size-labeler.yml     # Label PRs by diff size
│   ├── pr-title-lint.yml       # Enforce conventional commits on PR titles
│   └── stale.yml               # Mark + close stale issues/PRs
├── dependabot.yml              # Dependabot schedule + grouping
└── labeler.yml                 # File-path → label mapping
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

---

### 2. `auto-merge-dependabot.yml` — Auto-Merge Dependabot PRs

**Triggers:** `pull_request` (opened/synchronize/reopened), `check_suite` (completed), `workflow_dispatch`

**Guard:** Only runs when `github.actor == 'dependabot[bot]'`.

**What it does:**
1. Fetches Dependabot PR metadata via `dependabot/fetch-metadata@v2`.
2. If the update is **not a major semver bump**, enables auto-merge (squash) via `peter-evans/enable-pull-request-automerge@v3`.

Major version updates are intentionally left for manual review to avoid unintentional breaking changes.

Concurrency uses `cancel-in-progress: false` so that in-flight merges are never aborted.

---

### 3. `pr-hygiene.yml` — PR Template Enforcement

**Triggers:** `pull_request_target` (opened/edited/synchronize/reopened)

Checks that the PR body contains all three required sections:

| Section | Purpose |
|---------|---------|
| `## Summary` | What the PR does and why |
| `## Validation` | How the change was verified |
| `## Rollout + Revert Plan` | Safe deployment and rollback strategy |

**Behavior:**
- A bot comment is posted (or updated in place via a `<!-- pr-hygiene-bot -->` marker) listing any missing sections.
- If all sections are present, no comment is posted and an existing warning comment is silently updated to reflect the resolved state.

Uses `actions/github-script@v8` with inline JavaScript — no third-party action dependency.

---

### 4. `pr-labeler.yml` — File-Path Label Assignment

**Triggers:** `pull_request_target` (opened/synchronize/reopened)

Applies area labels automatically using `actions/labeler@v6`, driven by `.github/labeler.yml`:

| Label | Files matched |
|-------|--------------|
| `frontend` | `src/**` |
| `backend` | `server/**` |
| `database` | `supabase/**` |
| `ci-cd` | `.github/**` |
| `docs` | `docs/**`, `**/*.md` |

---

### 5. `pr-size-labeler.yml` — Diff Size Labels

**Triggers:** `pull_request_target` (opened/synchronize/reopened)

Uses `codelytv/pr-size-labeler@v1` to apply a size label based on total lines changed:

| Label | Max lines changed |
|-------|-----------------|
| `size/xs` | ≤ 25 |
| `size/s` | ≤ 100 |
| `size/m` | ≤ 300 |
| `size/l` | ≤ 800 |
| `size/xl` | > 800 |

Useful for identifying PRs that are too large to review effectively.

---

### 6. `pr-title-lint.yml` — Conventional Commit Title Enforcement

**Triggers:** `pull_request` (opened/edited/synchronize/reopened)

**Skip conditions:**
- Actor is `dependabot[bot]`
- PR title starts with `🎨 Palette:` (design/palette auto-PRs)

Validates PR titles against the **Conventional Commits** spec using `amannn/action-semantic-pull-request@v6`.

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

**Format rules:**
- Header pattern: `<type>(<optional-scope>)!?: <subject>`
- Subject must begin with a lowercase letter
- Example valid title: `fix(auth): handle expired token`

---

### 7. `stale.yml` — Stale Issue & PR Triage

**Triggers:** Schedule (`cron: "30 15 * * 1"` — every Monday at 3:30 PM UTC), `workflow_dispatch`

Uses `actions/stale@v10` with the following policy:

| | Issues | Pull Requests |
|-|--------|--------------|
| Mark stale after | 45 days of inactivity | 30 days of inactivity |
| Close after stale | 14 days | 14 days |
| Stale label | `status/stale` | `status/stale` |
| Exempt labels | `p0`, `security`, `planned` | `work-in-progress`, `do-not-close` |

Messages are contextual — stale issues get a different prompt than stale PRs.

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
Push to main/develop ──────► ci.yml (quality + test)

PR opened/updated:
  ├── pr-title-lint.yml   (enforce conventional commits)
  ├── pr-labeler.yml      (area labels from file paths)
  ├── pr-size-labeler.yml (xs/s/m/l/xl size label)
  └── pr-hygiene.yml      (enforce required PR sections)

Dependabot PR:
  ├── ci.yml              (runs normally)
  ├── pr-labeler.yml      (skipped — dependabot actor)
  ├── pr-title-lint.yml   (skipped — dependabot actor)
  └── auto-merge-dependabot.yml (auto-squash if non-major)

Every Monday:
  └── stale.yml           (triage inactive issues + PRs)
```

---

## Permissions Summary

| Workflow | `contents` | `pull-requests` | `issues` |
|----------|-----------|----------------|---------|
| `ci.yml` | read | — | — |
| `auto-merge-dependabot.yml` | **write** | **write** | — |
| `pr-hygiene.yml` | — | **write** | — |
| `pr-labeler.yml` | read | **write** | — |
| `pr-size-labeler.yml` | read | **write** | — |
| `pr-title-lint.yml` | — | read | — |
| `stale.yml` | — | **write** | **write** |
