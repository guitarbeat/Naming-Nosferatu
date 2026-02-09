// scripts/benchmark_logic.js

const mockSupabase = {
    dbCalls: 0,
    namesQueried: 0,

    // Simulate DB with 50 cat names
    data: Array.from({ length: 50 }, (_, i) => ({
        id: (i + 1).toString(),
        name: `CatName_${i + 1}`
    })),

    from(table) {
        if (table === 'cat_name_options') {
            return {
                select(cols) {
                    return {
                        in: (col, values) => {
                            mockSupabase.dbCalls++;
                            mockSupabase.namesQueried += values.length;

                            const results = mockSupabase.data.filter(item => values.includes(item.name));
                            return Promise.resolve({ data: results, error: null });
                        }
                    };
                }
            };
        } else if (table === 'cat_name_ratings') {
            return {
                upsert: (records) => {
                    return Promise.resolve({ error: null });
                }
            };
        }
        throw new Error(`Unexpected table: ${table}`);
    },

    reset() {
        this.dbCalls = 0;
        this.namesQueried = 0;
    }
};

const globalNameIdCache = new Map();

async function runOriginal(client, ratings) {
    if (!ratings?.length) return;
    const nameStrings = ratings.map((r) => r.name);

    const { data: nameData } = await client
        .from("cat_name_options")
        .select("id, name")
        .in("name", nameStrings);

    const nameToId = new Map(nameData?.map((n) => [n.name, n.id]) || []);
    const ratingRecords = ratings
        .filter((r) => nameToId.has(r.name))
        .map((r) => ({
             user_name: 'test',
             name_id: String(nameToId.get(r.name)),
             rating: r.rating
        }));

    if (!ratingRecords.length) return;
    await client.from("cat_name_ratings").upsert(ratingRecords);
}

async function runOptimized(client, ratings) {
    if (!ratings?.length) return;

    const nameStrings = ratings.map((r) => r.name);

    // Identify missing names
    const missingNames = nameStrings.filter(name => !globalNameIdCache.has(name));

    if (missingNames.length > 0) {
        const { data: nameData } = await client
            .from("cat_name_options")
            .select("id, name")
            .in("name", missingNames);

        if (nameData) {
            nameData.forEach(n => globalNameIdCache.set(n.name, n.id));
        }
    }

    const ratingRecords = ratings
        .filter((r) => globalNameIdCache.has(r.name))
        .map((r) => ({
             user_name: 'test',
             name_id: String(globalNameIdCache.get(r.name)),
             rating: r.rating
        }));

    if (!ratingRecords.length) return;
    await client.from("cat_name_ratings").upsert(ratingRecords);
}

async function runBenchmark() {
    console.log("Running Benchmark...");

    const ITERATIONS = 1000;
    const BATCH_SIZE = 5;
    const POOL_SIZE = 50;

    const testData = [];
    for (let i = 0; i < ITERATIONS; i++) {
        const batch = [];
        for (let j = 0; j < BATCH_SIZE; j++) {
            const id = Math.floor(Math.random() * POOL_SIZE) + 1;
            batch.push({ name: `CatName_${id}`, rating: 1200 });
        }
        testData.push(batch);
    }

    // --- Original ---
    mockSupabase.reset();
    const startOriginal = performance.now();
    for (const ratings of testData) {
        await runOriginal(mockSupabase, ratings);
    }
    const endOriginal = performance.now();

    console.log("\n--- Original Logic ---");
    console.log(`Time (simulated latency 0): ${(endOriginal - startOriginal).toFixed(2)}ms`);
    console.log(`DB Calls: ${mockSupabase.dbCalls}`);
    console.log(`Names Looked Up: ${mockSupabase.namesQueried}`);

    // --- Optimized ---
    mockSupabase.reset();
    globalNameIdCache.clear();
    const startOptimized = performance.now();
    for (const ratings of testData) {
        await runOptimized(mockSupabase, ratings);
    }
    const endOptimized = performance.now();

    console.log("\n--- Optimized Logic ---");
    console.log(`Time (simulated latency 0): ${(endOptimized - startOptimized).toFixed(2)}ms`);
    console.log(`DB Calls: ${mockSupabase.dbCalls}`);
    console.log(`Names Looked Up: ${mockSupabase.namesQueried}`);
}

runBenchmark().catch(console.error);
