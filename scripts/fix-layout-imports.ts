/**
 * Quick fix script to replace @/layout./ with @/layout/
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function findAndFixFiles(dir: string): number {
	let fixedCount = 0;
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			if (
				!["node_modules", "dist", "build", ".git", "coverage"].includes(
					entry.name,
				)
			) {
				fixedCount += findAndFixFiles(fullPath);
			}
		} else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
			const content = fs.readFileSync(fullPath, "utf-8");
			if (content.includes("@/layout./")) {
				const newContent = content.replace(/@\/layout\.\//g, "@/layout/");
				fs.writeFileSync(fullPath, newContent, "utf-8");
				console.log(`Fixed: ${path.relative(rootDir, fullPath)}`);
				fixedCount++;
			}
		}
	}

	return fixedCount;
}

const sourceDir = path.join(rootDir, "source");
const fixedCount = findAndFixFiles(sourceDir);
console.log(`\nFixed ${fixedCount} files`);
