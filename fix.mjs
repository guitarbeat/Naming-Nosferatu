import { execSync } from 'child_process';
try {
  execSync('npx biome check --write --unsafe src/shared/components/layout/AppLayout.tsx src/shared/components/layout/CatNameHero.tsx src/shared/components/layout/FloatingNavbar.tsx src/shared/components/layout/MagicMoire.tsx src/store/appStore.ts src/styles/components.css src/styles/layout.css');
} catch(e) {}
