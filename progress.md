Original prompt: Improve the tournament styled game.

- 2026-04-16: Identified the main tournament interaction surface in `src/features/tournament/Tournament.tsx` and `MatchSideCard.tsx`.
- 2026-04-16: Planned improvements around faster controls, stronger live matchup context, and more game-like tournament pressure without changing persistence logic.
- 2026-04-16: Added keyboard voting shortcuts, richer tournament HUD copy, and side-card metadata for live rating/favorite context.
- 2026-04-16: Added a first-match bracket reveal overlay that animates the seeded field before Match 1 becomes interactive.
- 2026-04-16: Installed workspace dependencies and added `playwright` as a dev dependency to support browser verification in this repo.
- 2026-04-16: Validation status:
  - `pnpm run lint:types` passes.
  - `pnpm exec biome check --config-path config/biome.json src/features/tournament/Tournament.tsx src/features/tournament/components/MatchSideCard.tsx` passes.
  - Targeted Vitest run still shows pre-existing failures in `src/features/tournament/services/tournament.test.ts` and `src/features/tournament/utils/nameSelection.test.ts`.
  - Browser verification produced `output/tournament-live.png`, which confirms the new tournament HUD is rendering on the live bracket screen.
