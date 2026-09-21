import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { namesQueryOptions, queryClient, ratingsAPI, SUPABASE_UNAVAILABLE_MSG } from "./api";
import * as storageModule from "./lib/storage";
import {
	getStorageString,
	parseJsonValue,
	resetStorageModuleCache,
	writeStorageJson,
} from "./lib/storage";
import type { NameItem } from "./types";

describe("api module", () => {
	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
		resetStorageModuleCache();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("constants & queryClient", () => {
		it("exports correct SUPABASE_UNAVAILABLE_MSG", () => {
			expect(SUPABASE_UNAVAILABLE_MSG).toBe("Database is unavailable. Running in local mode.");
		});

		it("configures queryClient with correct default options", () => {
			const defaultOptions = queryClient.getDefaultOptions();
			expect(defaultOptions.queries?.staleTime).toBe(30_000);
			expect(defaultOptions.queries?.gcTime).toBe(1000 * 60 * 5);
			expect(defaultOptions.queries?.retry).toBe(1);
			expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
		});
	});

	describe("namesQueryOptions and fetchNames", () => {
		it("creates query options with expected queryKey and staleTime", () => {
			const optionsIncludeHidden = namesQueryOptions(true);
			expect(optionsIncludeHidden.queryKey).toEqual(["names", "list", { includeHidden: true }]);
			expect(optionsIncludeHidden.staleTime).toBe(30_000);

			const optionsExcludeHidden = namesQueryOptions(false);
			expect(optionsExcludeHidden.queryKey).toEqual(["names", "list", { includeHidden: false }]);
		});

		it("fetches names excluding hidden items when includeHidden is false", async () => {
			const options = namesQueryOptions(false);
			expect(typeof options.queryFn).toBe("function");

			if (typeof options.queryFn === "function") {
				const result = await options.queryFn({
					client: queryClient,
					queryKey: options.queryKey,
					meta: {},
					signal: new AbortController().signal,
				});

				expect(result.source).toBe("local");
				expect(Array.isArray(result.names)).toBe(true);
				expect(result.names.length).toBeGreaterThan(0);
				expect(result.names.every((n) => !n.isHidden && !n.is_hidden)).toBe(true);
			}
		});

		it("fetches names including hidden items when includeHidden is true", async () => {
			const initialResult = await namesQueryOptions(true).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: true }],
				meta: {},
				signal: new AbortController().signal,
			});

			expect(initialResult).toBeDefined();
			if (!initialResult) {
				return;
			}

			const candidates = [...initialResult.names];
			candidates[0] = { ...candidates[0], isHidden: true, is_hidden: true };
			writeStorageJson("nosferatu-candidates", candidates);

			const filteredResult = await namesQueryOptions(false).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: false }],
				meta: {},
				signal: new AbortController().signal,
			});
			expect(filteredResult?.names.find((n) => n.id === candidates[0].id)).toBeUndefined();

			const allResult = await namesQueryOptions(true).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: true }],
				meta: {},
				signal: new AbortController().signal,
			});
			expect(allResult?.names.find((n) => n.id === candidates[0].id)).toBeDefined();
		});

		it("seamlessly merges new default candidates if stored candidates are missing items", async () => {
			const partialCandidate: NameItem = {
				id: "custom-1",
				name: "Custom Cat",
				description: "A custom test cat",
				avgRating: 1500,
				avg_rating: 1500,
				isHidden: false,
				is_hidden: false,
				isActive: true,
				is_active: true,
				lockedIn: false,
				locked_in: false,
				wins: 1,
				losses: 0,
				status: "candidate",
			};

			writeStorageJson("nosferatu-candidates", [partialCandidate]);

			const result = await namesQueryOptions(true).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: true }],
				meta: {},
				signal: new AbortController().signal,
			});

			expect(result?.names.find((n) => n.name === "Custom Cat")).toBeDefined();
			expect(result?.names.length).toBeGreaterThan(1);
		});

		it("returns default sample candidates when stored value is invalid JSON, empty array, or throws error", async () => {
			// Case 1: Empty array in storage
			writeStorageJson("nosferatu-candidates", []);
			const emptyStorageResult = await namesQueryOptions(true).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: true }],
				meta: {},
				signal: new AbortController().signal,
			});
			expect(emptyStorageResult?.names.length).toBeGreaterThan(0);

			// Case 2: Storage throws error when reading
			vi.spyOn(storageModule, "getStorageString").mockImplementationOnce(() => {
				throw new Error("Corrupted storage access");
			});
			const errorStorageResult = await namesQueryOptions(true).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: true }],
				meta: {},
				signal: new AbortController().signal,
			});
			expect(errorStorageResult?.names.length).toBeGreaterThan(0);
		});

		it("returns exact stored list directly when it already contains all default candidate names", async () => {
			const initialResult = await namesQueryOptions(true).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: true }],
				meta: {},
				signal: new AbortController().signal,
			});

			expect(initialResult).toBeDefined();
			if (!initialResult) {
				return;
			}

			// Save full candidate list to storage
			writeStorageJson("nosferatu-candidates", initialResult.names);

			const secondResult = await namesQueryOptions(true).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: true }],
				meta: {},
				signal: new AbortController().signal,
			});

			expect(secondResult?.names).toEqual(initialResult.names);
		});

		it("filters candidates when is_hidden is true even if isHidden is false", async () => {
			const initialResult = await namesQueryOptions(true).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: true }],
				meta: {},
				signal: new AbortController().signal,
			});

			expect(initialResult).toBeDefined();
			if (!initialResult) {
				return;
			}

			const candidates = [...initialResult.names];
			candidates[0] = { ...candidates[0], isHidden: false, is_hidden: true };
			writeStorageJson("nosferatu-candidates", candidates);

			const filteredResult = await namesQueryOptions(false).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: false }],
				meta: {},
				signal: new AbortController().signal,
			});

			expect(filteredResult?.names.find((n) => n.id === candidates[0].id)).toBeUndefined();
		});

		it("handles SSR environment gracefully when window is undefined", async () => {
			const originalWindow = globalThis.window;
			(globalThis as unknown as { window: unknown }).window = undefined;

			try {
				const result = await namesQueryOptions(false).queryFn?.({
					client: queryClient,
					queryKey: ["names", "list", { includeHidden: false }],
					meta: {},
					signal: new AbortController().signal,
				});

				expect(result?.source).toBe("local");
				expect(result?.names.length).toBeGreaterThan(0);
			} finally {
				(globalThis as unknown as { window: unknown }).window = originalWindow;
			}
		});
	});

	describe("ratingsAPI", () => {
		it("resolves applyTournamentMatch cleanly", async () => {
			await expect(
				ratingsAPI.applyTournamentMatch({
					matchId: "match-1",
					winnerId: "cat-1",
					loserId: "cat-2",
				}),
			).resolves.toBeUndefined();
		});

		it("saves updated ratings and updates stored candidates", async () => {
			const userId = "test-user";
			const initialNamesResult = await namesQueryOptions(true).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: true }],
				meta: {},
				signal: new AbortController().signal,
			});

			expect(initialNamesResult).toBeDefined();
			if (!initialNamesResult) {
				return;
			}

			const firstCat = initialNamesResult.names[0];

			const newRatings = {
				[firstCat.id]: { rating: 1600, wins: 5, losses: 1 },
			};

			await ratingsAPI.saveRatings(userId, newRatings);

			const savedRatings = parseJsonValue(getStorageString(`nosferatu-ratings-${userId}`), null);
			expect(savedRatings).toEqual(newRatings);

			const storedCandidates = parseJsonValue<NameItem[]>(
				getStorageString("nosferatu-candidates"),
				[],
			);
			const updatedCat = storedCandidates.find((c) => c.id === firstCat.id);
			expect(updatedCat).toBeDefined();
			expect(updatedCat?.avgRating).toBe(1600);
			expect(updatedCat?.avg_rating).toBe(1600);
			expect(updatedCat?.wins).toBe((firstCat.wins ?? 0) + 5);
			expect(updatedCat?.losses).toBe((firstCat.losses ?? 0) + 1);
		});

		it("handles ratings keyed by name if id is not found in ratings map", async () => {
			const userId = "test-user-by-name";
			const initialNamesResult = await namesQueryOptions(true).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: true }],
				meta: {},
				signal: new AbortController().signal,
			});

			expect(initialNamesResult).toBeDefined();
			if (!initialNamesResult) {
				return;
			}

			const secondCat = initialNamesResult.names[1];

			const newRatingsByName = {
				[secondCat.name]: { rating: 1720.6, wins: 3, losses: 0 },
			};

			await ratingsAPI.saveRatings(userId, newRatingsByName);

			const storedCandidates = parseJsonValue<NameItem[]>(
				getStorageString("nosferatu-candidates"),
				[],
			);
			const updatedCat = storedCandidates.find((c) => c.id === secondCat.id);
			expect(updatedCat?.avgRating).toBe(1721); // rounded
		});

		it("handles updating candidates with undefined wins or losses properties in saveRatings", async () => {
			const userId = "test-user-undefined-wins";
			const candidateWithMissingStats: NameItem = {
				id: "cat-no-stats",
				name: "Statless Cat",
				description: "A cat without wins or losses",
				avgRating: 1500,
				avg_rating: 1500,
				isHidden: false,
				is_hidden: false,
				isActive: true,
				is_active: true,
				lockedIn: false,
				locked_in: false,
				wins: undefined,
				losses: undefined,
				status: "candidate",
			};

			writeStorageJson("nosferatu-candidates", [candidateWithMissingStats]);

			const newRatings = {
				"cat-no-stats": { rating: 1550, wins: 2, losses: 1 },
			};

			await ratingsAPI.saveRatings(userId, newRatings);

			const storedCandidates = parseJsonValue<NameItem[]>(
				getStorageString("nosferatu-candidates"),
				[],
			);
			const updatedCat = storedCandidates.find((c) => c.id === "cat-no-stats");
			expect(updatedCat?.wins).toBe(2);
			expect(updatedCat?.losses).toBe(1);
		});

		it("handles errors during saveRatings and logs a warning", async () => {
			const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const faultyRatings = new Proxy(
				{},
				{
					get() {
						throw new Error("Simulated storage/ratings error");
					},
				},
			);

			await ratingsAPI.saveRatings("user-error", faultyRatings as any);

			expect(consoleWarnSpy).toHaveBeenCalledWith("Failed to persist ratings:", expect.any(Error));
		});

		it("returns early when saveRatings runs in SSR environment (window undefined)", async () => {
			const originalWindow = globalThis.window;
			(globalThis as unknown as { window: unknown }).window = undefined;

			try {
				await expect(
					ratingsAPI.saveRatings("ssr-user", { cat1: { rating: 1500, wins: 1, losses: 0 } }),
				).resolves.toBeUndefined();
			} finally {
				(globalThis as unknown as { window: unknown }).window = originalWindow;
			}
		});

		it("handles errors thrown by writeStorageJson when persisting candidate names in saveStoredNames", async () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const testError = new Error("Storage write failure");

			vi.spyOn(storageModule, "writeStorageJson").mockImplementation((key) => {
				if (key === "nosferatu-candidates") {
					throw testError;
				}
				return true;
			});

			const userId = "user123";
			const sampleRatings = {
				cat1: { rating: 1500, wins: 1, losses: 0 },
			};

			await ratingsAPI.saveRatings(userId, sampleRatings);

			expect(warnSpy).toHaveBeenCalledWith("Failed to persist candidates:", testError);
		});

		it("triggers saveStoredNames catch block when missing candidates are merged in getStoredNames and writeStorageJson throws", async () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const testError = new Error("Storage write error during candidate auto-merge");

			const partialCandidate: NameItem = {
				id: "legacy-1",
				name: "Legacy Cat",
				description: "A legacy candidate",
				avgRating: 1400,
				avg_rating: 1400,
				isHidden: false,
				is_hidden: false,
				isActive: true,
				is_active: true,
				lockedIn: false,
				locked_in: false,
				wins: 0,
				losses: 0,
				status: "candidate",
			};

			writeStorageJson("nosferatu-candidates", [partialCandidate]);

			vi.spyOn(storageModule, "writeStorageJson").mockImplementation((key) => {
				if (key === "nosferatu-candidates") {
					throw testError;
				}
				return true;
			});

			const result = await namesQueryOptions(true).queryFn?.({
				client: queryClient,
				queryKey: ["names", "list", { includeHidden: true }],
				meta: {},
				signal: new AbortController().signal,
			});

			expect(result?.names.length).toBeGreaterThan(1);
			expect(warnSpy).toHaveBeenCalledWith("Failed to persist candidates:", testError);
		});
	});
});
