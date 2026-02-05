import type { NameItem } from "../types/appTypes";
import { generateCSVContent } from "./basic";

const runTests = () => {
	console.log("Running CSV security tests...");
	let failed = false;

	// Helper assertion
	const assertEq = (testName: string, actual: string, expected: string) => {
		if (actual !== expected) {
			console.error(`❌ ${testName} Failed`);
			console.error(`Expected:\n${expected}`);
			console.error(`Actual:\n${actual}`);
			failed = true;
		} else {
			console.log(`✅ ${testName} Passed`);
		}
	};

	// Test 1: Standard name
	const item1: NameItem = { id: 1, name: "Mittens", rating: 1500, wins: 5, losses: 2 };
	assertEq(
		"Standard Name",
		generateCSVContent([item1]),
		'Name,Rating,Wins,Losses\n"Mittens",1500,5,2',
	);

	// Test 2: Name with quotes (CSV Injection via quotes)
	// Goal: Quotes should be escaped by doubling them
	const item2: NameItem = { id: 2, name: 'The "Boss" Cat', rating: 1600, wins: 1, losses: 1 };
	assertEq(
		"Quote Escaping",
		generateCSVContent([item2]),
		'Name,Rating,Wins,Losses\n"The ""Boss"" Cat",1600,1,1',
	);

	// Test 3: Formula Injection
	// Goal: Prepend ' to prevent execution
	const item3: NameItem = { id: 3, name: "=1+1", rating: 1400, wins: 0, losses: 0 };
	assertEq(
		"Formula Injection =",
		generateCSVContent([item3]),
		'Name,Rating,Wins,Losses\n"\'=1+1",1400,0,0',
	);

	const item4: NameItem = { id: 4, name: "+1+1", rating: 1400, wins: 0, losses: 0 };
	assertEq(
		"Formula Injection +",
		generateCSVContent([item4]),
		'Name,Rating,Wins,Losses\n"\'+1+1",1400,0,0',
	);

	const item5: NameItem = { id: 5, name: "-1+1", rating: 1400, wins: 0, losses: 0 };
	assertEq(
		"Formula Injection -",
		generateCSVContent([item5]),
		'Name,Rating,Wins,Losses\n"\'-1+1",1400,0,0',
	);

	const item6: NameItem = { id: 6, name: "@SUM(1,1)", rating: 1400, wins: 0, losses: 0 };
	assertEq(
		"Formula Injection @",
		generateCSVContent([item6]),
		'Name,Rating,Wins,Losses\n"\'@SUM(1,1)",1400,0,0',
	);

	if (failed) {
		console.error("\nSome tests failed.");
		process.exit(1);
	} else {
		console.log("\nAll tests passed!");
	}
};

runTests();
