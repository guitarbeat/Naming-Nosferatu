import 'dotenv/config';
import { db } from '../server/db';
import { catNameOptions, catNameRatings } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { performance } from 'perf_hooks';

async function runBenchmark() {
    if (!db) {
        console.error("No database connection available. Set DATABASE_URL env var.");
        process.exit(1);
    }

    console.log("Starting benchmark...");

    const N = 1000;
    // Use a UUID that is valid but clearly for testing
    const dummyNameId = '00000000-0000-0000-0000-000000000001';
    const userNameBase = 'bench_user_';

    try {
        // Cleanup previous run artifacts if any
        try {
            await db.delete(catNameRatings).where(eq(catNameRatings.nameId, dummyNameId));
            await db.delete(catNameOptions).where(eq(catNameOptions.id, dummyNameId));
        } catch (e) {
            // Ignore if tables don't exist or other errors during cleanup
        }

        // Setup dummy name for foreign key constraint
        await db.insert(catNameOptions).values({
            id: dummyNameId,
            name: 'Benchmark Cat',
            isHidden: false
        });

        console.log(`Benchmarking insert of ${N} records...`);

        // 1. N+1 Inserts (Loop)
        const recordsLoop = [];
        for (let i = 0; i < N; i++) {
            recordsLoop.push({
                userName: `${userNameBase}loop_${i}`,
                nameId: dummyNameId,
                rating: "1500",
                wins: 0,
                losses: 0
            });
        }

        const startLoop = performance.now();
        for (const record of recordsLoop) {
            await db.insert(catNameRatings).values(record);
        }
        const endLoop = performance.now();
        const timeLoop = endLoop - startLoop;
        console.log(`N+1 Insert Time: ${timeLoop.toFixed(2)}ms`);

        // Cleanup Loop Data
        await db.delete(catNameRatings).where(eq(catNameRatings.nameId, dummyNameId));

        // 2. Batch Insert
        const recordsBatch = [];
        for (let i = 0; i < N; i++) {
            recordsBatch.push({
                userName: `${userNameBase}batch_${i}`,
                nameId: dummyNameId,
                rating: "1500",
                wins: 0,
                losses: 0
            });
        }

        const startBatch = performance.now();
        await db.insert(catNameRatings).values(recordsBatch);
        const endBatch = performance.now();
        const timeBatch = endBatch - startBatch;
        console.log(`Batch Insert Time: ${timeBatch.toFixed(2)}ms`);

        // Calculate improvement
        const improvement = timeLoop / timeBatch;
        console.log(`Speedup: ${improvement.toFixed(2)}x`);

    } catch (error) {
        console.error("Benchmark failed:", error);
    } finally {
        // Cleanup
        try {
            if (db) {
                await db.delete(catNameRatings).where(eq(catNameRatings.nameId, dummyNameId));
                await db.delete(catNameOptions).where(eq(catNameOptions.id, dummyNameId));
            }
        } catch (e) {
            console.error("Cleanup failed:", e);
        }
        process.exit(0);
    }
}

runBenchmark();
