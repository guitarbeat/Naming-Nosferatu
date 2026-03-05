#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage"]);
const COPY_ARTIFACT_PATTERN =
	/ [2-9]\.(ts|tsx|js|jsx|mjs|cjs|py|md|txt|json|yml|yaml|sql|css|html|diff)$/;

function walkFiles(rootDir) {
	const files = [];
	const stack = [rootDir];

	while (stack.length > 0) {
		const current = stack.pop();
		const entries = fs.readdirSync(current, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(current, entry.name);
			if (entry.isDirectory()) {
				if (SKIP_DIRS.has(entry.name)) {
					continue;
				}
				stack.push(fullPath);
				continue;
			}
			files.push(fullPath);
		}
	}

	return files;
}

const badFiles = walkFiles(ROOT).filter((filePath) => COPY_ARTIFACT_PATTERN.test(path.basename(filePath)));
if (badFiles.length > 0) {
	console.error("Found probable copy-artifact files (defragmentation check failed):");
	for (const filePath of badFiles) {
		console.error(path.relative(ROOT, filePath).replace(/\\/g, "/"));
	}
	console.error("");
	console.error("Rename/remove these files before committing.");
	process.exit(1);
}

console.log("No copy-artifact filenames found.");
