#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = [
	{
		dir: path.join(ROOT, "src", "shared"),
		message: "Architecture violation: src/shared must not import from src/features",
	},
	{
		dir: path.join(ROOT, "src", "services"),
		message: "Architecture violation: src/services must not import from src/features",
	},
];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const IMPORT_PATTERN = /from\s+['"]@\/features\//;

function collectFiles(dir) {
	const files = [];
	if (!fs.existsSync(dir)) {
		return files;
	}

	const stack = [dir];
	while (stack.length > 0) {
		const current = stack.pop();
		const entries = fs.readdirSync(current, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(current, entry.name);
			if (entry.isDirectory()) {
				stack.push(fullPath);
				continue;
			}
			if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
				files.push(fullPath);
			}
		}
	}

	return files;
}

function normalizeForPrint(filePath) {
	return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

let failed = false;

for (const target of TARGETS) {
	const violations = [];

	for (const filePath of collectFiles(target.dir)) {
		const content = fs.readFileSync(filePath, "utf8");
		const lines = content.split(/\r?\n/);
		for (let index = 0; index < lines.length; index += 1) {
			const line = lines[index];
			if (IMPORT_PATTERN.test(line)) {
				violations.push({
					filePath,
					lineNumber: index + 1,
					line: line.trim(),
				});
			}
		}
	}

	if (violations.length > 0) {
		failed = true;
		console.error(target.message);
		for (const violation of violations) {
			console.error(
				`${normalizeForPrint(violation.filePath)}:${violation.lineNumber}: ${violation.line}`,
			);
		}
		console.error("");
	}
}

if (failed) {
	process.exit(1);
}

console.log("Architecture boundary checks passed.");
