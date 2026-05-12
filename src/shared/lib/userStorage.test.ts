import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/shared/lib/constants";
import * as storage from "@/shared/lib/storage";
import {
	clearStoredUserSnapshot,
	readStoredUserSnapshot,
	type StoredUserSnapshot,
	writeStoredUserSnapshot,
} from "./userStorage";

vi.mock("@/shared/lib/storage", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/shared/lib/storage")>();
	return {
		...actual,
		isStorageAvailable: vi.fn(),
		setStorageString: vi.fn(),
		writeStorageJson: vi.fn(),
		removeStorageItem: vi.fn(),
		readStorageJson: vi.fn(),
	};
});

describe("userStorage utilities", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(storage.isStorageAvailable).mockReturnValue(true);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("writeStoredUserSnapshot", () => {
		it("does nothing if storage is unavailable", () => {
			vi.mocked(storage.isStorageAvailable).mockReturnValue(false);

			writeStoredUserSnapshot({ name: "Test" });

			expect(storage.writeStorageJson).not.toHaveBeenCalled();
			expect(storage.setStorageString).not.toHaveBeenCalled();
		});

		it("clears storage if snapshot is invalid", () => {
			writeStoredUserSnapshot(null);

			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER);
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_ID);
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_AVATAR);
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE);
		});

		it("clears storage if snapshot missing name", () => {
			// @ts-expect-error Testing invalid input
			writeStoredUserSnapshot({ id: "123" });

			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER);
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_ID);
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_AVATAR);
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE);
		});

		it("writes minimal valid snapshot", () => {
			const snapshot: StoredUserSnapshot = { name: "Test User" };
			writeStoredUserSnapshot(snapshot);

			expect(storage.writeStorageJson).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE, {
				id: undefined,
				name: "Test User",
				isAdmin: undefined,
				avatarUrl: undefined,
				email: undefined,
			});
			expect(storage.setStorageString).toHaveBeenCalledWith(STORAGE_KEYS.USER, "Test User");
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_ID);
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_AVATAR);
		});

		it("writes full valid snapshot", () => {
			const snapshot: StoredUserSnapshot = {
				id: "user-123",
				name: "Test User",
				isAdmin: true,
				avatarUrl: "https://example.com/avatar.jpg",
				email: "test@example.com",
			};

			writeStoredUserSnapshot(snapshot);

			expect(storage.writeStorageJson).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE, snapshot);
			expect(storage.setStorageString).toHaveBeenCalledWith(STORAGE_KEYS.USER, "Test User");
			expect(storage.setStorageString).toHaveBeenCalledWith(STORAGE_KEYS.USER_ID, "user-123");
			expect(storage.setStorageString).toHaveBeenCalledWith(
				STORAGE_KEYS.USER_AVATAR,
				"https://example.com/avatar.jpg",
			);
		});

		it("handles null id explicitly", () => {
			const snapshot: StoredUserSnapshot = { name: "Test User", id: null };
			writeStoredUserSnapshot(snapshot);

			expect(storage.writeStorageJson).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE, {
				id: null,
				name: "Test User",
				isAdmin: undefined,
				avatarUrl: undefined,
				email: undefined,
			});
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_ID);
		});
	});

	describe("readStoredUserSnapshot", () => {
		it("returns null if storage is unavailable", () => {
			vi.mocked(storage.isStorageAvailable).mockReturnValue(false);

			const result = readStoredUserSnapshot();

			expect(result).toBeNull();
			expect(storage.readStorageJson).not.toHaveBeenCalled();
		});

		it("returns null and clears storage if no data exists", () => {
			vi.mocked(storage.readStorageJson).mockReturnValue(null);

			const result = readStoredUserSnapshot();

			expect(result).toBeNull();
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER);
		});

		it("returns null and clears storage if data is invalid", () => {
			vi.mocked(storage.readStorageJson).mockReturnValue({ id: "123" }); // Missing name

			const result = readStoredUserSnapshot();

			expect(result).toBeNull();
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER);
		});

		it("returns parsed snapshot if valid data exists", () => {
			const mockData = {
				id: "user-123",
				name: "Test User",
				isAdmin: true,
			};
			vi.mocked(storage.readStorageJson).mockReturnValue(mockData);

			const result = readStoredUserSnapshot();

			expect(result).toEqual({
				id: "user-123",
				name: "Test User",
				isAdmin: true,
				avatarUrl: undefined,
				email: undefined,
			});
		});
	});

	describe("clearStoredUserSnapshot", () => {
		it("does nothing if storage is unavailable", () => {
			vi.mocked(storage.isStorageAvailable).mockReturnValue(false);

			clearStoredUserSnapshot();

			expect(storage.removeStorageItem).not.toHaveBeenCalled();
		});

		it("removes all user-related storage keys", () => {
			clearStoredUserSnapshot();

			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER);
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_ID);
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_AVATAR);
			expect(storage.removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE);
		});
	});
});
