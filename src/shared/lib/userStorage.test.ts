import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "./constants";
import {
	clearStoredUserSnapshot,
	readStoredUserSnapshot,
	writeStoredUserSnapshot,
} from "./userStorage";

describe("userStorage utilities", () => {
	let originalConsoleError: typeof console.error;

	beforeEach(() => {
		originalConsoleError = console.error;
		console.error = vi.fn();
		window.localStorage.clear();
	});

	afterEach(() => {
		console.error = originalConsoleError;
		vi.restoreAllMocks();
	});

	describe("readStoredUserSnapshot", () => {
		it("returns null if storage is not available", () => {
			const spy = vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
				throw new Error("Access denied");
			});
			expect(readStoredUserSnapshot()).toBeNull();
			spy.mockRestore();
		});

		it("returns null and clears storage when stored value is empty or not an object", () => {
			window.localStorage.setItem(STORAGE_KEYS.USER_STORAGE, "null");
			window.localStorage.setItem(STORAGE_KEYS.USER, "should-be-cleared");

			expect(readStoredUserSnapshot()).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEYS.USER_STORAGE)).toBeNull();
		});

		it("returns null and clears storage when name is missing or empty", () => {
			window.localStorage.setItem(STORAGE_KEYS.USER_STORAGE, JSON.stringify({ id: "123" }));

			expect(readStoredUserSnapshot()).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEYS.USER_STORAGE)).toBeNull();

			window.localStorage.setItem(STORAGE_KEYS.USER_STORAGE, JSON.stringify({ name: "   " }));

			expect(readStoredUserSnapshot()).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEYS.USER_STORAGE)).toBeNull();
		});

		it("returns valid structured snapshot, ignoring invalid types for optional fields", () => {
			window.localStorage.setItem(
				STORAGE_KEYS.USER_STORAGE,
				JSON.stringify({
					id: 123, // Invalid type, should be string or null
					name: " Test User  ", // Should be trimmed
					isAdmin: "true", // Invalid type, should be boolean
					avatarUrl: 456, // Invalid type, should be string
					email: {}, // Invalid type, should be string
				}),
			);

			expect(readStoredUserSnapshot()).toEqual({
				id: undefined,
				name: "Test User",
				isAdmin: undefined,
				avatarUrl: undefined,
				email: undefined,
			});
		});

		it("returns valid structured snapshot with correct types", () => {
			const expectedData = {
				id: "user-123",
				name: "Valid User",
				isAdmin: true,
				avatarUrl: "https://example.com/avatar.png",
				email: "user@example.com",
			};

			window.localStorage.setItem(STORAGE_KEYS.USER_STORAGE, JSON.stringify(expectedData));

			expect(readStoredUserSnapshot()).toEqual(expectedData);
		});

		it("returns valid structured snapshot when id is explicitly null", () => {
			const expectedData = {
				id: null,
				name: "Guest",
			};

			window.localStorage.setItem(STORAGE_KEYS.USER_STORAGE, JSON.stringify(expectedData));

			expect(readStoredUserSnapshot()).toEqual({
				id: null,
				name: "Guest",
				isAdmin: undefined,
				avatarUrl: undefined,
				email: undefined,
			});
		});
	});

	describe("writeStoredUserSnapshot", () => {
		it("does nothing if storage is not available", () => {
			const spy = vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
				throw new Error("Access denied");
			});
			expect(() => writeStoredUserSnapshot({ name: "User" })).not.toThrow();
			spy.mockRestore();
		});

		it("clears storage when snapshot is null or invalid", () => {
			window.localStorage.setItem(STORAGE_KEYS.USER, "existing");
			writeStoredUserSnapshot(null);
			expect(window.localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();

			window.localStorage.setItem(STORAGE_KEYS.USER, "existing");
			writeStoredUserSnapshot({ name: "   " } as any);
			expect(window.localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
		});

		it("writes correctly and sets helper keys", () => {
			const data = {
				id: "user-456",
				name: "Awesome User",
				avatarUrl: "https://example.com/pic.jpg",
			};

			writeStoredUserSnapshot(data);

			expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.USER_STORAGE)!)).toEqual({
				id: "user-456",
				name: "Awesome User",
				isAdmin: undefined,
				avatarUrl: "https://example.com/pic.jpg",
				email: undefined,
			});
			expect(window.localStorage.getItem(STORAGE_KEYS.USER)).toBe("Awesome User");
			expect(window.localStorage.getItem(STORAGE_KEYS.USER_ID)).toBe("user-456");
			expect(window.localStorage.getItem(STORAGE_KEYS.USER_AVATAR)).toBe(
				"https://example.com/pic.jpg",
			);
		});

		it("removes helper keys when their respective optional properties are missing/null", () => {
			window.localStorage.setItem(STORAGE_KEYS.USER_ID, "old-id");
			window.localStorage.setItem(STORAGE_KEYS.USER_AVATAR, "old-avatar");

			writeStoredUserSnapshot({ name: "No Extras" });

			expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.USER_STORAGE)!)).toEqual({
				id: undefined,
				name: "No Extras",
				isAdmin: undefined,
				avatarUrl: undefined,
				email: undefined,
			});
			expect(window.localStorage.getItem(STORAGE_KEYS.USER)).toBe("No Extras");
			expect(window.localStorage.getItem(STORAGE_KEYS.USER_ID)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEYS.USER_AVATAR)).toBeNull();
		});
	});

	describe("clearStoredUserSnapshot", () => {
		it("does nothing if storage is not available", () => {
			const spy = vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
				throw new Error("Access denied");
			});
			expect(() => clearStoredUserSnapshot()).not.toThrow();
			spy.mockRestore();
		});

		it("clears all user-related keys from storage", () => {
			window.localStorage.setItem(STORAGE_KEYS.USER_STORAGE, "something");
			window.localStorage.setItem(STORAGE_KEYS.USER, "something");
			window.localStorage.setItem(STORAGE_KEYS.USER_ID, "something");
			window.localStorage.setItem(STORAGE_KEYS.USER_AVATAR, "something");

			clearStoredUserSnapshot();

			expect(window.localStorage.getItem(STORAGE_KEYS.USER_STORAGE)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEYS.USER_ID)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEYS.USER_AVATAR)).toBeNull();
		});
	});
});
