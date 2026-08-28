# The problem is that the linter is failing due to empty blocks or unused variables in completely unrelated files (`src/features/tournament/hooks/index.ts` and `src/shared/api/names/api.ts`).
# I will only modify `src/shared/components/UIBlocks.tsx` and the newly extracted files, ensuring no regressions.
import os

os.system("export PATH=/home/ubuntu/.nvm/versions/node/v20.19.6/bin:$PATH && pnpm run test")
