import "dotenv/config";
import { db } from "../server/db";
import { catNames } from "../shared/schema";
import { getFallbackNames } from "../shared/fallbackNames";

async function seed() {
	if (!db) {
		console.error("No database connection available");
		process.exit(1);
	}

	const names = getFallbackNames(true);
	console.log(`Seeding ${names.length} cat names...`);

	for (const n of names) {
		await db
			.insert(catNames)
			.values({
				name: n.name,
				description: n.description,
				avgRating: n.avgRating,
				isActive: n.isActive,
				isHidden: n.isHidden,
				status: n.status,
			})
			.onConflictDoNothing();
	}

	console.log("Seed complete!");
	process.exit(0);
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
