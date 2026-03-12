import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { performance } from "perf_hooks";
import { db } from "../server/db";
import { catAppUsers, catNameOptions, catNameRatings } from "../shared/schema";

async function runBenchmark() {
	if (!db) {
		console.error("No database connection available. Set DATABASE_URL env var.");
		process.exit(1);
	}

	console.log("Starting benchmark...");

	const totalRatings = 1000;
	const benchmarkPrefix = `bench_${Date.now()}`;
	let dummyNameId: number | null = null;
	let userIds: string[] = [];

	try {
		const [insertedName] = await db
			.insert(catNameOptions)
			.values({
				name: `${benchmarkPrefix}_cat`,
				description: "Temporary benchmark fixture",
				isHidden: false,
			})
			.returning({ id: catNameOptions.id });

		dummyNameId = insertedName.id;

		const insertedUsers = await db
			.insert(catAppUsers)
			.values(
				Array.from({ length: totalRatings }, (_, index) => ({
					userName: `${benchmarkPrefix}_user_${index}`,
					preferences: {},
				})),
			)
			.returning({ userId: catAppUsers.userId });

		userIds = insertedUsers.map(({ userId }) => userId);

		const ratings = userIds.map((userId) => ({
			userId,
			nameId: dummyNameId,
			rating: 1500,
			wins: 0,
			losses: 0,
		}));

		console.log(`Benchmarking insert of ${totalRatings} records...`);

		const startLoop = performance.now();
		for (const rating of ratings) {
			await db.insert(catNameRatings).values(rating);
		}
		const loopDuration = performance.now() - startLoop;
		console.log(`N+1 Insert Time: ${loopDuration.toFixed(2)}ms`);

		await db.delete(catNameRatings).where(eq(catNameRatings.nameId, dummyNameId));

		const startBatch = performance.now();
		await db.insert(catNameRatings).values(ratings);
		const batchDuration = performance.now() - startBatch;
		console.log(`Batch Insert Time: ${batchDuration.toFixed(2)}ms`);
		console.log(`Speedup: ${(loopDuration / batchDuration).toFixed(2)}x`);
	} catch (error) {
		console.error("Benchmark failed:", error);
		process.exitCode = 1;
	} finally {
		try {
			if (db && dummyNameId !== null) {
				await db.delete(catNameRatings).where(eq(catNameRatings.nameId, dummyNameId));
				await db.delete(catNameOptions).where(eq(catNameOptions.id, dummyNameId));
			}

			if (db && userIds.length > 0) {
				await db.delete(catAppUsers).where(inArray(catAppUsers.userId, userIds));
			}
		} catch (error) {
			console.error("Cleanup failed:", error);
			process.exitCode = 1;
		}
	}
}

runBenchmark();
