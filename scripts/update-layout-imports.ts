/**
 * Script to update imports from @/layout wrapper to direct component imports
 * This removes the re-export wrapper and updates all references
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Mapping of exports from layout/index.ts to their actual file locations
const exportToFileMap: Record<string, string> = {
	AppLayout: "./AppLayout",
	Button: "./Button",
	ScrollToTopButton: "./Button",
	Card: "./Card",
	CardName: "./Card",
	CardNameProps: "./Card",
	CardProps: "./Card",
	CardStats: "./Card",
	CardStatsProps: "./Card",
	BongoCat: "./LayoutEffects",
	DEFAULT_GLASS_CONFIG: "./LayoutEffects",
	CatBackground: "./LayoutEffects",
	FloatingBubblesContainer: "./LayoutEffects",
	LiquidGlass: "./LayoutEffects",
	resolveGlassConfig: "./LayoutEffects",
	GlassConfig: "./Card",
	BumpChart: "./Charts",
	CollapsibleContent: "./CollapsibleHeader",
	CollapsibleHeader: "./CollapsibleHeader",
	EmptyState: "./EmptyState",
	ErrorBoundary: "./FeedbackComponents",
	ErrorComponent: "./FeedbackComponents",
	IToastItem: "./FeedbackComponents",
	Loading: "./FeedbackComponents",
	OfflineIndicator: "./FeedbackComponents",
	PerformanceBadges: "./FeedbackComponents",
	Toast: "./FeedbackComponents",
	ToastContainer: "./FeedbackComponents",
	TrendIndicator: "./FeedbackComponents",
	FluidNav: "./FluidNav",
	Input: "./FormPrimitives",
	Textarea: "./FormPrimitives",
	Lightbox: "./Lightbox",
	AnimatedNavButton: "./NavButton",
	NavButton: "./NavButton",
	Section: "./Section",
};

interface ImportInfo {
	namedImports: string[];
	typeImports: string[];
	filePath: string;
	originalLine: string;
}

function findFilesWithLayoutImports(dir: string, files: string[] = []): string[] {
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			// Skip node_modules, dist, build, etc.
			if (
				!["node_modules", "dist", "build", ".git", "coverage"].includes(
					entry.name,
				)
			) {
				findFilesWithLayoutImports(fullPath, files);
			}
		} else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
			const content = fs.readFileSync(fullPath, "utf-8");
			if (
				content.includes('from "@/layout"') ||
				content.includes("from '@/layout'")
			) {
				files.push(fullPath);
			}
		}
	}

	return files;
}

function parseImportStatement(line: string): ImportInfo | null {
	// Match: import { X, Y, type Z } from "@/layout";
	const match = line.match(
		/import\s+{([^}]+)}\s+from\s+['"]@\/layout['"]/,
	);
	if (!match) return null;

	const importsStr = match[1];
	const namedImports: string[] = [];
	const typeImports: string[] = [];

	// Split by comma and process each import
	const imports = importsStr.split(",").map((s) => s.trim());
	for (const imp of imports) {
		if (imp.startsWith("type ")) {
			typeImports.push(imp.replace("type ", "").trim());
		} else {
			namedImports.push(imp.trim());
		}
	}

	return {
		namedImports,
		typeImports,
		filePath: "",
		originalLine: line,
	};
}

function generateNewImports(importInfo: ImportInfo): string[] {
	const allImports = [
		...importInfo.namedImports,
		...importInfo.typeImports,
	];

	// Group imports by their source file
	const importsByFile = new Map<string, { named: string[]; types: string[] }>();

	for (const imp of allImports) {
		const sourceFile = exportToFileMap[imp];
		if (!sourceFile) {
			console.warn(`Warning: No mapping found for import "${imp}"`);
			continue;
		}

		if (!importsByFile.has(sourceFile)) {
			importsByFile.set(sourceFile, { named: [], types: [] });
		}

		const group = importsByFile.get(sourceFile)!;
		if (importInfo.typeImports.includes(imp)) {
			group.types.push(imp);
		} else {
			group.named.push(imp);
		}
	}

	// Generate import statements
	const newImports: string[] = [];
	for (const [sourceFile, { named, types }] of importsByFile) {
		const allItems = [
			...named,
			...types.map((t) => `type ${t}`),
		];
		// Remove leading ./ from sourceFile since we're already using @/layout
		const cleanPath = sourceFile.replace(/^\.\//, "");
		newImports.push(`import { ${allItems.join(", ")} } from "@/layout/${cleanPath}";`);
	}

	return newImports.sort();
}

function updateFile(filePath: string): boolean {
	const content = fs.readFileSync(filePath, "utf-8");
	const lines = content.split("\n");
	const newLines: string[] = [];
	let modified = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (
			line.includes('from "@/layout"') ||
			line.includes("from '@/layout'")
		) {
			const importInfo = parseImportStatement(line);
			if (importInfo) {
				const newImports = generateNewImports(importInfo);
				newLines.push(...newImports);
				modified = true;
				console.log(`  Updated: ${path.relative(rootDir, filePath)}`);
			} else {
				newLines.push(line);
			}
		} else {
			newLines.push(line);
		}
	}

	if (modified) {
		fs.writeFileSync(filePath, newLines.join("\n"), "utf-8");
		return true;
	}

	return false;
}

function main() {
	console.log("Finding files with @/layout imports...");
	const sourceDir = path.join(rootDir, "source");
	const files = findFilesWithLayoutImports(sourceDir);

	console.log(`Found ${files.length} files with @/layout imports\n`);

	let updatedCount = 0;
	for (const file of files) {
		if (updateFile(file)) {
			updatedCount++;
		}
	}

	console.log(`\nUpdated ${updatedCount} files`);
	console.log("\nNext steps:");
	console.log("1. Delete source/layout/index.ts");
	console.log("2. Run TypeScript compiler to verify no errors");
	console.log("3. Run tests to verify functionality");
}

main();
