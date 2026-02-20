import 'dotenv/config';
import { db } from '../server/db';
import { catNameOptions, catNameRatings } from '../shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

async function runBenchmark() {
    if (!db) {
        console.error("No database connection available. Skipping benchmark.");
        process.exit(0);
    }

    console.log("Starting benchmark...");

    // Create a dummy name option to refer to
    const testNameId = crypto.randomUUID();
    const testName = `Benchmark Name ${testNameId}`;

    try {
        await db.insert(catNameOptions).values({
            id: testNameId,
            name: testName,
            description: "Benchmark test name",
            avgRating: "1500",
            isActive: true,
            isHidden: false,
        });
        console.log(`Created test name: ${testName} (${testNameId})`);

        const N = 1000;
        const recordsLoop: typeof catNameRatings.$inferInsert[] = [];
        const recordsBatch: typeof catNameRatings.$inferInsert[] = [];

        for (let i = 0; i < N; i++) {
            recordsLoop.push({
                userName: `user_loop_${i}_${Date.now()}`,
                nameId: testNameId,
                rating: "1500",
                wins: 0,
                losses: 0
            });
            recordsBatch.push({
                userName: `user_batch_${i}_${Date.now()}`,
                nameId: testNameId,
                rating: "1500",
                wins: 0,
                losses: 0
            });
        }

        console.log(`Benchmarking insertion of ${N} records...`);

        // Benchmark Loop
        console.log("Running Loop Insert...");
        const startLoop = performance.now();
        for (const record of recordsLoop) {
            await db.insert(catNameRatings).values(record);
        }
        const endLoop = performance.now();
        const timeLoop = endLoop - startLoop;
        console.log(`Loop Insert: ${timeLoop.toFixed(2)}ms`);

        // Benchmark Batch
        console.log("Running Batch Insert...");
        const startBatch = performance.now();
        if (recordsBatch.length > 0) {
            await db.insert(catNameRatings).values(recordsBatch);
        }
        const endBatch = performance.now();
        const timeBatch = endBatch - startBatch;
        console.log(`Batch Insert: ${timeBatch.toFixed(2)}ms`);

        if (timeBatch > 0) {
            console.log(`Improvement: ${(timeLoop / timeBatch).toFixed(2)}x faster`);
        } else {
            console.log("Batch insert was instantaneous!");
        }

        // Cleanup
        console.log("Cleaning up...");
        await db.delete(catNameRatings).where(eq(catNameRatings.nameId, testNameId));
        await db.delete(catNameOptions).where(eq(catNameOptions.id, testNameId));

    } catch (error) {
        console.error("Benchmark failed:", error);
    }

    // Explicitly exit to close connection pool
    process.exit(0);
}

runBenchmark().catch(console.error);
