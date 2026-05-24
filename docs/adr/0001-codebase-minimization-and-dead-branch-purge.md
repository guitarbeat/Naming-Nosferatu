# 0001-codebase-minimization-and-dead-branch-purge

## Status
Accepted

## Context
Over time, several unmerged remote branches (`jules-*`, `test-*`, `cursor/*`) were created by autonomous agents. These branches were based on a legacy state of the repository. An analysis of their diffs shows that they contain massive deletions of modern product features (such as PWA prompts, dynamic navigation, and audio controls) that have already been integrated into `main`. Merging them would cause catastrophic conflicts and regressions. 

Additionally, the codebase contains several unused demo files (`cinematic-footer-demo.tsx`, `cinematic-landing-hero-demo.tsx`, `liquid-glass-demo.tsx`) and leftover merge residues (`deployment.ts.orig`, `deployment.ts.rej`) which clutter the codebase and increase cognitive load.

## Decision
We decided to:
1. **Purge the 14 unmerged remote branches** from the repository to clean up git clutter, as they are obsolete and represent a significant regression risk if merged.
2. **Delete the dead development demo files** and their associated routes in `AppShell.tsx` and `appConfig.ts`.
3. **Delete leftover merge conflict files** (`.orig`, `.rej`) and root patch files from the workspace.

## Consequences
* Git remote status is simplified and clean.
* Codebase cognitive load is reduced for future maintainers.
* Product navigation and configuration are 100% focused on core features.
