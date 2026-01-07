import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
	tsx: 400,
	css: 750,
	ts: 400,
	js: 200,
};

// Files to exclude from strict limits (legacy debt)
const EXCLUSIONS = [
	"src/shared/components/AnalysisDashboard/AnalysisDashboard.tsx", // 711 lines
	"src/shared/components/AnalysisUI/AnalysisUI.tsx", // 722 lines
	"src/shared/services/supabase/modules/cat-names-consolidated.ts", // Large service file
	"src/shared/services/supabase/modules/general.ts", // Large service file
	"src/features/tournament/TournamentSetup.module.css", // Large CSS
	"src/features/tournament/Tournament.module.css", // Large CSS
	"src/features/analytics/components/AnalysisUI.module.css", // Large CSS (Moved)
	"src/shared/components/Card/components/CardName.module.css", // Large CSS
	"src/shared/services/errorManager/index.ts",
	"src/core/hooks/tournamentHooks.ts",
	"src/features/profile/hooks/useProfile.ts",
	"src/features/tournament/hooks/tournamentComponentHooks.ts",
	"src/features/tournament/CombinedLoginTournamentSetup.tsx",
	"src/features/tournament/components/PersonalResults.tsx",
	"src/features/tournament/tournamentUtils.ts",
	"src/integrations/supabase/types.ts",
	"src/shared/components/AppNavbar/NavbarUI.tsx",
	"src/shared/components/Button/Button.tsx",
	"src/shared/components/Card/components/CardName.tsx",
	"src/shared/components/Charts/Charts.tsx",
	"src/shared/components/LiquidGlass/LiquidGlass.tsx",
	"src/shared/components/TournamentToolbar/TournamentToolbar.tsx",
	"src/shared/utils/core/auth.ts",
	"src/shared/utils/mobileGestures.ts",
	"src/App.tsx",
	// Add others found in task.md if strictly needed, or let them fail to force refactor
];

function countLines(filePath) {
	const content = fs.readFileSync(filePath, "utf-8");
	return content.split("\n").length;
}

function traverse(dir, allErrors = []) {
	const files = fs.readdirSync(dir);
	let failed = false;

	for (const file of files) {
		const fullPath = path.join(dir, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			if (traverse(fullPath, allErrors)) {
				failed = true;
			}
		} else {
			const ext = path.extname(file).toLowerCase();
			const limit = CONFIG[ext.replace(".", "")];

			if (limit) {
				const relativePath = path.relative(process.cwd(), fullPath);
				if (EXCLUSIONS.includes(relativePath)) {
					continue;
				}

				const lines = countLines(fullPath);
				if (lines > limit) {
					allErrors.push({
						path: relativePath,
						lines,
						limit,
					});
					failed = true;
				}
			}
		}
	}

	return failed;
}

const DIRECTORIES_TO_CHECK = [path.join(process.cwd(), "src"), path.join(process.cwd(), "scripts")];

console.log("🔍 Checking file size limits...\n");

let overallFailed = false;
const allErrors = [];

for (const dir of DIRECTORIES_TO_CHECK) {
	if (!fs.existsSync(dir)) {
		console.warn(`⚠️  Directory not found: ${dir}`);
		continue;
	}

	const dirName = path.basename(dir);
	console.log(`Checking ${dirName}/...`);

	const failed = traverse(dir, allErrors);
	if (failed) {
		overallFailed = true;
	}
}

if (allErrors.length > 0) {
	console.error("\n❌ File size limit violations found:\n");
	allErrors.forEach(({ path: filePath, lines, limit }) => {
		const percentage = ((lines / limit - 1) * 100).toFixed(1);
		console.error(`  ${filePath}`);
		console.error(`    ${lines} lines (exceeds ${limit} limit by ${percentage}%)`);
	});
	console.error("\n💡 Consider refactoring large files into smaller modules.\n");
}

if (overallFailed) {
	console.error("\n💥 Limits validation failed. Please refactor large files.");
	process.exit(1);
} else {
	console.log("\n✅ All files within size limits!");
}
