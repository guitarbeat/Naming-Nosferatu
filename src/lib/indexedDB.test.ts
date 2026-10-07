import { afterEach, describe, expect, it, vi } from "vitest";
import {
	clearStoredTournamentFromIDB,
	getStoredTournamentFromIDB,
	saveStoredTournamentToIDB,
} from "./indexedDB";
import type { StoredTournamentSnapshot } from "./storage";

interface MockRequest {
	result?: unknown;
	error?: unknown;
	onsuccess?: (() => void) | null;
	onerror?: (() => void) | null;
	onupgradeneeded?: (() => void) | null;
}

interface MockTransaction {
	objectStore: (name: string) => unknown;
	oncomplete?: (() => void) | null;
	onerror?: (() => void) | null;
}

interface MockIDBDatabase {
	objectStoreNames: {
		contains: (_name: string) => boolean;
	};
	createObjectStore: (name: string) => void;
	transaction: (storeName: string, mode: string) => MockTransaction;
}

describe("indexedDB utilities", () => {
	const originalIndexedDB = window.indexedDB;

	const dummySnapshot: StoredTournamentSnapshot = {
		names: [{ id: "cat-1", name: "Mittens" }],
		ratings: { "cat-1": { rating: 1500, wins: 1, losses: 0 } },
		isComplete: false,
		voteHistory: [],
		selectedNames: [{ id: "cat-1", name: "Mittens" }],
	};

	afterEach(() => {
		Object.defineProperty(window, "indexedDB", {
			configurable: true,
			writable: true,
			value: originalIndexedDB,
		});
		vi.restoreAllMocks();
	});

	describe("when indexedDB is not supported or window is missing", () => {
		it("returns null or resolves gracefully if indexedDB is not in window", async () => {
			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: undefined,
			});

			const getResult = await getStoredTournamentFromIDB();
			expect(getResult).toBeNull();

			await expect(
				saveStoredTournamentToIDB(dummySnapshot),
			).resolves.toBeUndefined();
			await expect(clearStoredTournamentFromIDB()).resolves.toBeUndefined();
		});
	});

	describe("openDB helper behavior", () => {
		it("handles DB upgrade onupgradeneeded callback creating object store", async () => {
			let createdStoreName = "";
			let containsStore = false;

			const mockDb: MockIDBDatabase = {
				objectStoreNames: {
					contains: (_name: string) => {
						return containsStore;
					},
				},
				createObjectStore: (name: string) => {
					createdStoreName = name;
					containsStore = true;
				},
				transaction: () => ({
					objectStore: () => ({
						get: () => {
							const req: MockRequest = { result: null };
							setTimeout(() => req.onsuccess?.(), 0);
							return req;
						},
					}),
				}),
			};

			const mockOpenRequest: MockRequest = {
				result: mockDb,
			};

			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: {
					open: vi.fn().mockImplementation(() => {
						setTimeout(() => {
							mockOpenRequest.onupgradeneeded?.();
							mockOpenRequest.onsuccess?.();
						}, 0);
						return mockOpenRequest;
					}),
				},
			});

			const result = await getStoredTournamentFromIDB();
			expect(result).toBeNull();
			expect(createdStoreName).toBe("tournament");
		});

		it("handles DB open request.onerror by resolving null", async () => {
			const mockOpenRequest: MockRequest = {};

			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: {
					open: vi.fn().mockImplementation(() => {
						setTimeout(() => {
							mockOpenRequest.onerror?.();
						}, 0);
						return mockOpenRequest;
					}),
				},
			});

			const result = await getStoredTournamentFromIDB();
			expect(result).toBeNull();
		});

		it("handles synchronous exception during indexedDB.open by catching and resolving null", async () => {
			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: {
					open: vi.fn().mockImplementation(() => {
						throw new Error("IndexedDB opening restricted");
					}),
				},
			});

			const result = await getStoredTournamentFromIDB();
			expect(result).toBeNull();
		});
	});

	describe("getStoredTournamentFromIDB", () => {
		it("successfully fetches stored tournament snapshot", async () => {
			const mockGetRequest: MockRequest = {
				result: dummySnapshot,
			};

			const mockDb: MockIDBDatabase = {
				objectStoreNames: { contains: () => true },
				createObjectStore: () => {},
				transaction: vi.fn().mockReturnValue({
					objectStore: vi.fn().mockReturnValue({
						get: vi.fn().mockImplementation(() => {
							setTimeout(() => mockGetRequest.onsuccess?.(), 0);
							return mockGetRequest;
						}),
					}),
				}),
			};

			const mockOpenRequest: MockRequest = { result: mockDb };

			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: {
					open: vi.fn().mockImplementation(() => {
						setTimeout(() => mockOpenRequest.onsuccess?.(), 0);
						return mockOpenRequest;
					}),
				},
			});

			const result = await getStoredTournamentFromIDB();
			expect(result).toEqual(dummySnapshot);
		});

		it("resolves null when store.get request triggers onerror", async () => {
			const mockGetRequest: MockRequest = {};

			const mockDb: MockIDBDatabase = {
				objectStoreNames: { contains: () => true },
				createObjectStore: () => {},
				transaction: vi.fn().mockReturnValue({
					objectStore: vi.fn().mockReturnValue({
						get: vi.fn().mockImplementation(() => {
							setTimeout(() => mockGetRequest.onerror?.(), 0);
							return mockGetRequest;
						}),
					}),
				}),
			};

			const mockOpenRequest: MockRequest = { result: mockDb };

			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: {
					open: vi.fn().mockImplementation(() => {
						setTimeout(() => mockOpenRequest.onsuccess?.(), 0);
						return mockOpenRequest;
					}),
				},
			});

			const result = await getStoredTournamentFromIDB();
			expect(result).toBeNull();
		});

		it("resolves null when transaction throws synchronous exception", async () => {
			const mockDb: MockIDBDatabase = {
				objectStoreNames: { contains: () => true },
				createObjectStore: () => {},
				transaction: vi.fn().mockImplementation(() => {
					throw new Error("InvalidStateError");
				}),
			};

			const mockOpenRequest: MockRequest = { result: mockDb };

			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: {
					open: vi.fn().mockImplementation(() => {
						setTimeout(() => mockOpenRequest.onsuccess?.(), 0);
						return mockOpenRequest;
					}),
				},
			});

			const result = await getStoredTournamentFromIDB();
			expect(result).toBeNull();
		});
	});

	describe("saveStoredTournamentToIDB", () => {
		it("successfully saves stored tournament snapshot", async () => {
			let putData: unknown = null;
			let putKey: unknown = null;

			const mockTx: MockTransaction = {
				objectStore: () => ({
					put: (data: unknown, key: unknown) => {
						putData = data;
						putKey = key;
					},
				}),
			};

			const mockDb: MockIDBDatabase = {
				objectStoreNames: { contains: () => true },
				createObjectStore: () => {},
				transaction: () => {
					setTimeout(() => mockTx.oncomplete?.(), 0);
					return mockTx;
				},
			};

			const mockOpenRequest: MockRequest = { result: mockDb };

			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: {
					open: vi.fn().mockImplementation(() => {
						setTimeout(() => mockOpenRequest.onsuccess?.(), 0);
						return mockOpenRequest;
					}),
				},
			});

			await saveStoredTournamentToIDB(dummySnapshot);
			expect(putData).toEqual(dummySnapshot);
			expect(putKey).toBe("current_tournament");
		});

		it("resolves cleanly on tx.onerror", async () => {
			const mockTx: MockTransaction = {
				objectStore: () => ({
					put: () => {},
				}),
			};

			const mockDb: MockIDBDatabase = {
				objectStoreNames: { contains: () => true },
				createObjectStore: () => {},
				transaction: () => {
					setTimeout(() => mockTx.onerror?.(), 0);
					return mockTx;
				},
			};

			const mockOpenRequest: MockRequest = { result: mockDb };

			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: {
					open: vi.fn().mockImplementation(() => {
						setTimeout(() => mockOpenRequest.onsuccess?.(), 0);
						return mockOpenRequest;
					}),
				},
			});

			await expect(
				saveStoredTournamentToIDB(dummySnapshot),
			).resolves.toBeUndefined();
		});

		it("resolves cleanly on transaction exception", async () => {
			const mockDb: MockIDBDatabase = {
				objectStoreNames: { contains: () => true },
				createObjectStore: () => {},
				transaction: () => {
					throw new Error("QuotaExceededError");
				},
			};

			const mockOpenRequest: MockRequest = { result: mockDb };

			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: {
					open: vi.fn().mockImplementation(() => {
						setTimeout(() => mockOpenRequest.onsuccess?.(), 0);
						return mockOpenRequest;
					}),
				},
			});

			await expect(
				saveStoredTournamentToIDB(dummySnapshot),
			).resolves.toBeUndefined();
		});
	});

	describe("clearStoredTournamentFromIDB", () => {
		it("successfully deletes key from IndexedDB", async () => {
			let deletedKey: unknown = null;

			const mockTx: MockTransaction = {
				objectStore: () => ({
					delete: (key: unknown) => {
						deletedKey = key;
					},
				}),
			};

			const mockDb: MockIDBDatabase = {
				objectStoreNames: { contains: () => true },
				createObjectStore: () => {},
				transaction: () => {
					setTimeout(() => mockTx.oncomplete?.(), 0);
					return mockTx;
				},
			};

			const mockOpenRequest: MockRequest = { result: mockDb };

			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: {
					open: vi.fn().mockImplementation(() => {
						setTimeout(() => mockOpenRequest.onsuccess?.(), 0);
						return mockOpenRequest;
					}),
				},
			});

			await clearStoredTournamentFromIDB();
			expect(deletedKey).toBe("current_tournament");
		});

		it("resolves cleanly on tx.onerror during delete", async () => {
			const mockTx: MockTransaction = {
				objectStore: () => ({
					delete: () => {},
				}),
			};

			const mockDb: MockIDBDatabase = {
				objectStoreNames: { contains: () => true },
				createObjectStore: () => {},
				transaction: () => {
					setTimeout(() => mockTx.onerror?.(), 0);
					return mockTx;
				},
			};

			const mockOpenRequest: MockRequest = { result: mockDb };

			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: {
					open: vi.fn().mockImplementation(() => {
						setTimeout(() => mockOpenRequest.onsuccess?.(), 0);
						return mockOpenRequest;
					}),
				},
			});

			await expect(clearStoredTournamentFromIDB()).resolves.toBeUndefined();
		});

		it("resolves cleanly on transaction exception during delete", async () => {
			const mockDb: MockIDBDatabase = {
				objectStoreNames: { contains: () => true },
				createObjectStore: () => {},
				transaction: () => {
					throw new Error("TransactionInactiveError");
				},
			};

			const mockOpenRequest: MockRequest = { result: mockDb };

			Object.defineProperty(window, "indexedDB", {
				configurable: true,
				writable: true,
				value: {
					open: vi.fn().mockImplementation(() => {
						setTimeout(() => mockOpenRequest.onsuccess?.(), 0);
						return mockOpenRequest;
					}),
				},
			});

			await expect(clearStoredTournamentFromIDB()).resolves.toBeUndefined();
		});
	});
});
