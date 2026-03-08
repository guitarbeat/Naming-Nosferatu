import { describe, it, expect, beforeEach, vi } from "vitest";
import { syncQueue } from "./SyncQueue";
import { devError } from "@/shared/lib/basic";

vi.mock("@/shared/lib/basic", () => ({
	devError: vi.fn(),
}));

const mockUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("SyncQueueService", () => {
	let localStorageStore: Record<string, string> = {};

	beforeEach(() => {
		vi.clearAllMocks();
		localStorageStore = {};

		// Setup localStorage mock
		Object.defineProperty(window, "localStorage", {
			value: {
				getItem: vi.fn((key: string) => localStorageStore[key] || null),
				setItem: vi.fn((key: string, value: string) => {
					localStorageStore[key] = value;
				}),
				removeItem: vi.fn((key: string) => {
					delete localStorageStore[key];
				}),
				clear: vi.fn(() => {
					localStorageStore = {};
				}),
			},
			writable: true,
		});

		// Setup crypto mock
		Object.defineProperty(window, "crypto", {
			value: {
				randomUUID: vi.fn(() => mockUUID),
			},
			writable: true,
		});

		// Clear queue state directly for consistent tests
		syncQueue.clear();
		// Clear localstorage mock as clear() will set item
		(window.localStorage.setItem as ReturnType<typeof vi.fn>).mockClear();
		localStorageStore = {};
	});

	const dummyPayload = {
		userId: "user-1",
		ratings: [{ nameId: "name-1", rating: 5 }],
	};

	it("should initialize empty queue if no data in localStorage", () => {
		expect(syncQueue.isEmpty()).toBe(true);
		expect(syncQueue.getQueue()).toEqual([]);
	});

	it("should enqueue items and save to localStorage", () => {
		syncQueue.enqueue("SAVE_RATINGS", dummyPayload);

		expect(syncQueue.isEmpty()).toBe(false);
		expect(syncQueue.getQueue().length).toBe(1);

		const item = syncQueue.peek();
		expect(item).toBeDefined();
		expect(item?.id).toBe(mockUUID);
		expect(item?.type).toBe("SAVE_RATINGS");
		expect(item?.payload).toEqual(dummyPayload);
		expect(item?.retryCount).toBe(0);
		expect(item?.timestamp).toBeLessThanOrEqual(Date.now());

		expect(window.localStorage.setItem).toHaveBeenCalledWith(
			"offline_sync_queue",
			expect.any(String),
		);
		const savedData = JSON.parse(localStorageStore["offline_sync_queue"]);
		expect(savedData.length).toBe(1);
		expect(savedData[0].id).toBe(mockUUID);
	});

	it("should dequeue items and save to localStorage", () => {
		syncQueue.enqueue("SAVE_RATINGS", dummyPayload);
		(window.localStorage.setItem as ReturnType<typeof vi.fn>).mockClear();

		const item = syncQueue.dequeue();
		expect(item?.id).toBe(mockUUID);
		expect(syncQueue.isEmpty()).toBe(true);

		expect(window.localStorage.setItem).toHaveBeenCalledWith(
			"offline_sync_queue",
			"[]",
		);
	});

	it("should peek at the first item without removing it", () => {
		syncQueue.enqueue("SAVE_RATINGS", dummyPayload);
		const item = syncQueue.peek();
		expect(item?.id).toBe(mockUUID);
		expect(syncQueue.isEmpty()).toBe(false);
	});

	it("should clear the queue and update localStorage", () => {
		syncQueue.enqueue("SAVE_RATINGS", dummyPayload);
		syncQueue.clear();

		expect(syncQueue.isEmpty()).toBe(true);
		expect(syncQueue.getQueue()).toEqual([]);
		expect(window.localStorage.setItem).toHaveBeenLastCalledWith(
			"offline_sync_queue",
			"[]",
		);
	});

	it("should load existing queue from localStorage via load method", () => {
		const existingQueue = [
			{
				id: "old-id",
				type: "SAVE_RATINGS",
				payload: dummyPayload,
				timestamp: Date.now() - 1000,
				retryCount: 1,
			},
		];

		localStorageStore["offline_sync_queue"] = JSON.stringify(existingQueue);

		// Bypass private modifier to test load
		(syncQueue as any).load();

		expect(syncQueue.isEmpty()).toBe(false);
		expect(syncQueue.getQueue().length).toBe(1);
		expect(syncQueue.peek()?.id).toBe("old-id");
	});

	it("should call devError when load encounters invalid JSON", () => {
		localStorageStore["offline_sync_queue"] = "invalid json";

		(syncQueue as any).load();

		expect(devError).toHaveBeenCalledWith(
			"Failed to load sync queue",
			expect.any(Error),
		);
		// Queue should still be empty from the beforeEach clear
		expect(syncQueue.isEmpty()).toBe(true);
	});

	it("should call devError when save fails", () => {
		// Mock setItem to throw
		window.localStorage.setItem = vi.fn(() => {
			throw new Error("Quota Exceeded");
		});

		syncQueue.enqueue("SAVE_RATINGS", dummyPayload);

		expect(devError).toHaveBeenCalledWith(
			"Failed to save sync queue",
			expect.any(Error),
		);
		// It still enqueues in memory
		expect(syncQueue.isEmpty()).toBe(false);
	});
});
