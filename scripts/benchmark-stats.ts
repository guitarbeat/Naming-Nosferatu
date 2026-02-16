/**
 * Benchmark for Analytics Site Stats Optimization
 *
 * Measures the performance difference between:
 * 1. Fetching all ratings and calculating average client-side (Current)
 * 2. Fetching pre-calculated stats (Optimized)
 *
 * Simulates:
 * - JSON serialization/deserialization overhead
 * - Data transfer size (approximated)
 * - Calculation time
 */

import { performance } from "perf_hooks";

// Configuration
const NUM_RATINGS = 100000; // Simulate 100k ratings
const ITERATIONS = 50;

// Mock Data Generation
function generateRatings(count: number): { rating: number }[] {
	const ratings = [];
	for (let i = 0; i < count; i++) {
		ratings.push({ rating: Math.floor(Math.random() * 2000) + 1000 });
	}
	return ratings;
}

// Baseline: Fetch all ratings and calculate average
function baseline(ratings: { rating: number }[]) {
	// Simulate JSON cycle (Serialize -> Transfer -> Parse)
	const jsonString = JSON.stringify(ratings);
	const parsedRatings = JSON.parse(jsonString);

	// Calculate Average
	if (parsedRatings.length > 0) {
		const sum = parsedRatings.reduce((s: number, r: { rating: number }) => s + Number(r.rating), 0);
		return Math.round(sum / parsedRatings.length);
	}
	return 1500;
}

// Optimized: Fetch single aggregate object
function optimized(avgRating: number) {
	// Simulate JSON cycle for single result
	const result = { avgRating };
	const jsonString = JSON.stringify(result);
	const parsedResult = JSON.parse(jsonString);
	return parsedResult.avgRating;
}

async function runBenchmark() {
	console.log(`Benchmarking with ${NUM_RATINGS} ratings over ${ITERATIONS} iterations...\n`);

	// Generate Data
	const ratings = generateRatings(NUM_RATINGS);
	const correctAvg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;

	// Measure Baseline
	let totalBaselineTime = 0;
	const baselineMemoryUsage = 0;

	// Warmup
	baseline(ratings.slice(0, 100));

	for (let i = 0; i < ITERATIONS; i++) {
		global.gc?.(); // Try to trigger GC if exposed
		const start = performance.now();
		baseline(ratings);
		const end = performance.now();
		totalBaselineTime += end - start;
	}
	const avgBaselineTime = totalBaselineTime / ITERATIONS;

	// Measure Optimized
	let totalOptimizedTime = 0;

	// Warmup
	optimized(correctAvg);

	for (let i = 0; i < ITERATIONS; i++) {
		global.gc?.();
		const start = performance.now();
		optimized(correctAvg);
		const end = performance.now();
		totalOptimizedTime += end - start;
	}
	const avgOptimizedTime = totalOptimizedTime / ITERATIONS;

	// Data Size Estimation
	const baselineSize = JSON.stringify(ratings).length;
	const optimizedSize = JSON.stringify({ avgRating: correctAvg }).length;

	console.log("Results:");
	console.log("--------------------------------------------------");
	console.log(`Baseline (Full Fetch + Client Calc): ${avgBaselineTime.toFixed(2)} ms/op`);
	console.log(`Optimized (Server Aggregate):        ${avgOptimizedTime.toFixed(2)} ms/op`);
	console.log("--------------------------------------------------");
	console.log(`Improvement: ${(avgBaselineTime / avgOptimizedTime).toFixed(1)}x faster processing`);
	console.log(
		`Data Transfer Reduction: ${(baselineSize / 1024).toFixed(2)} KB -> ${(optimizedSize / 1024).toFixed(4)} KB`,
	);
	console.log(`Bandwidth Saved: ${((1 - optimizedSize / baselineSize) * 100).toFixed(2)}%`);
}

runBenchmark().catch(console.error);
