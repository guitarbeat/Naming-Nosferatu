import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as storage from "@/shared/lib/storage";
import { useLocalStorage } from "./useLocalStorage";

// @vitest-environment jsdom

vi.mock("@/shared/lib/storage", async (importOriginal) => {
	const mod = await importOriginal<typeof import("@/shared/lib/storage")>();
	return {
		...mod,
		writeStorageJson: vi.fn(mod.writeStorageJson),
	};
});

describe("useLocalStorage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should initialize with initial value", () => {
		const { result } = renderHook(() => useLocalStorage("test-key", "initial"));
		expect(result.current[0]).toBe("initial");
	});

	it("should update value", () => {
		const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

		act(() => {
			result.current[1]("new value");
		});

		expect(result.current[0]).toBe("new value");
	});

	it("should remove value", () => {
		const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

		act(() => {
			result.current[1]("new value");
		});

		expect(result.current[0]).toBe("new value");

		act(() => {
			result.current[2](); // removeValue
		});

		expect(result.current[0]).toBe("initial");
	});

	it("should handle error when writeStorageJson returns false on setValue", () => {
		const onError = vi.fn();
		const writeStorageJsonMock = vi.mocked(storage.writeStorageJson);

		// make writeStorageJson return false
		writeStorageJsonMock.mockReturnValue(false);

		const { result } = renderHook(() => useLocalStorage("test-key", "initial", { onError }));

		act(() => {
			result.current[1]("new value");
		});

		expect(onError).toHaveBeenCalledWith(expect.any(Error));
		expect(onError.mock.calls[0][0].message).toContain(
			'localStorage write failed for key "test-key"',
		);
	});

	it("should handle error when writeStorageJson returns false on unmount with debounce", () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const writeStorageJsonMock = vi.mocked(storage.writeStorageJson);

		// make the unmount call return false
		writeStorageJsonMock.mockReturnValue(false);

		const { unmount } = renderHook(() =>
			useLocalStorage("test-key", "initial", { debounceWait: 100 }),
		);

		unmount();

		// we expect console.error to be called on unmount when it returns false
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'[useLocalStorage] Unmount flush failed for key "test-key".',
		);
	});
});
