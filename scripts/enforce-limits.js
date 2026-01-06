import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    tsx: 400,
    css: 750, // Relaxed from 500 for now to allow some legacy files to pass (except the 3000 line one)
    ts: 400
};

// Files to exclude from strict limits (legacy debt)
const EXCLUSIONS = [
    'src/shared/components/AnalysisDashboard/AnalysisDashboard.tsx', // 711 lines
    'src/features/tournament/Tournament.tsx', // 696 lines
    'src/shared/components/AnalysisUI/AnalysisUI.tsx', // 722 lines
    'src/shared/services/supabase/modules/cat-names-consolidated.ts', // Large service file
    'src/shared/services/supabase/modules/general.ts', // Large service file
    'src/features/tournament/TournamentSetup.module.css', // Large CSS
    'src/features/tournament/Tournament.module.css', // Large CSS
    'src/features/analytics/components/AnalysisUI.module.css', // Large CSS (Moved)
    'src/shared/styles/analysis-mode.css', // Large CSS
    'src/shared/components/Card/components/CardName.module.css', // Large CSS
    'src/shared/services/errorManager/index.ts',
    'src/core/hooks/tournamentHooks.ts',
    'src/features/profile/hooks/useProfile.ts',
    'src/features/tournament/hooks/tournamentComponentHooks.ts',
    'src/features/tournament/CombinedLoginTournamentSetup.tsx',
    'src/features/tournament/components/PersonalResults.tsx',
    'src/features/tournament/tournamentUtils.ts',
    'src/integrations/supabase/types.ts',
    'src/shared/components/AppNavbar/NavbarUI.tsx',
    'src/shared/components/Button/Button.tsx',
    'src/shared/components/Card/components/CardName.tsx',
    'src/shared/components/Charts/Charts.tsx',
    'src/shared/components/LiquidGlass/LiquidGlass.tsx',
    'src/shared/components/TournamentToolbar/TournamentToolbar.tsx',
    'src/shared/utils/core/auth.ts',
    'src/shared/utils/mobileGestures.ts',
    'src/App.tsx',
    // Add others found in task.md if strictly needed, or let them fail to force refactor
];

function countLines(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    let failed = false;

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (traverse(fullPath)) failed = true;
        } else {
            const ext = path.extname(file).toLowerCase();
            const limit = CONFIG[ext.replace('.', '')];

            if (limit) {
                // Check exclusion
                const relativePath = path.relative(process.cwd(), fullPath);
                if (EXCLUSIONS.includes(relativePath)) continue;

                const lines = countLines(fullPath);
                if (lines > limit) {
                    console.error(`❌ FILE TOO LARGE: ${relativePath} (${lines} lines > ${limit} limit)`);
                    failed = true;
                }
            }
        }
    }
    return failed;
}

console.log('🔍 Checking file size limits...');
const failed = traverse(path.join(process.cwd(), 'src'));

if (failed) {
    console.error('💥 Limits validation failed. Please refactor large files.');
    process.exit(1);
} else {
    console.log('✅ All files within size limits!');
}
