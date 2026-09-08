import { readdirSync, statSync } from "fs";
import { join, parse } from "path";

const SRC_DIR = join(process.cwd(), "src");
const ALLOWED_TOP_LEVEL = ["app", "features", "shared", "store", "assets", "index.css", "vite-env.d.ts"];

let hasErrors = false;

function reportError(msg: string) {
	console.error(`❌ [Structure Error] ${msg}`);
	hasErrors = true;
}

function checkTopLevel() {
	if (!statSync(SRC_DIR).isDirectory()) return;
	const items = readdirSync(SRC_DIR);
	for (const item of items) {
		if (!ALLOWED_TOP_LEVEL.includes(item)) {
			reportError(`Top-level item 'src/${item}' is not allowed. Only use app/, features/, shared/, store/, assets/.`);
		}
	}
}

function checkNamingConventions(dir: string) {
	const items = readdirSync(dir);
	for (const item of items) {
		const fullPath = join(dir, item);
		const stat = statSync(fullPath);
		const parsed = parse(item);

		if (stat.isDirectory()) {
			// Feature Folders (and generally all directories) should be lowercase/kebab-case
			// We'll enforce this for directories inside src/features
			if (dir.includes(join("src", "features"))) {
				if (!/^[a-z0-9-]+$/.test(item)) {
					reportError(`Feature folder '${fullPath}' must be lowercase/kebab-case.`);
				}
			}
			checkNamingConventions(fullPath);
		} else {
			// Files
			if (parsed.ext === ".tsx" && parsed.name !== "index") {
				// Must be PascalCase or camelCase starting with 'use'
				if (
					!/^[A-Z][a-zA-Z0-9]*(\.test)?$/.test(parsed.name) &&
					!/^use[A-Z][a-zA-Z0-9]*(\.test)?$/.test(parsed.name)
				) {
					reportError(
						`React Component or Hook file '${fullPath}' must be PascalCase or start with 'use'.`,
					);
				}
			} else if (parsed.ext === ".ts" && parsed.name !== "index" && !item.endsWith(".d.ts")) {
				// Must be camelCase
				if (!/^[a-z][a-zA-Z0-9]*(\.test)?$/.test(parsed.name)) {
					reportError(`Module/Utility file '${fullPath}' must be camelCase.`);
				}
			}
		}
	}
}

function main() {
	console.log("Checking project structure...");
	checkTopLevel();
	checkNamingConventions(SRC_DIR);

	if (hasErrors) {
		process.exit(1);
	} else {
		console.log("✅ Structure is valid.");
	}
}

main();
