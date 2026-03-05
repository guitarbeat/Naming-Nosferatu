#!/usr/bin/env node

import { execSync } from "node:child_process";

let stdout = "";
try {
	stdout = execSync("git ls-files", { encoding: "utf8" });
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Failed to list tracked files via git: ${message}`);
	process.exit(1);
}

const files = stdout
	.split(/\r?\n/)
	.map((line) => line.trim())
	.filter(Boolean);

const grouped = new Map();
for (const file of files) {
	const key = file.toLowerCase();
	const existing = grouped.get(key) ?? [];
	existing.push(file);
	grouped.set(key, existing);
}

const collisions = [...grouped.values()].filter((group) => group.length > 1);
if (collisions.length > 0) {
	for (const group of collisions) {
		console.error("Case-collision group:");
		for (const file of group) {
			console.error(file);
		}
		console.error("");
	}
	console.error("Error: Resolve case-collision paths before committing.");
	process.exit(1);
}

console.log("No case-collision paths found.");
