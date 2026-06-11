import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLocalStorage } from "./useLocalStorage";

// @vitest-environment jsdom

describe("useLocalStorage", () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("returns initial value when storage is empty", () => {
		const { result } = renderHook(() => useLocalStorage("test-key", "default"));
		expect(result.current[0]).toBe("default");
		expect(window.localStorage.getItem("test-key")).toBeNull();
	});

	it("returns stored value if it exists", () => {
		window.localStorage.setItem("test-key", JSON.stringify("stored-value"));
		const { result } = renderHook(() => useLocalStorage("test-key", "default"));
		expect(result.current[0]).toBe("stored-value");
	});

	it("setValue updates state and localStorage immediately without debounce", () => {
		const { result } = renderHook(() => useLocalStorage("test-key", "default"));

		act(() => {
			result.current[1]("new-value");
		});

		expect(result.current[0]).toBe("new-value");
		expect(window.localStorage.getItem("test-key")).toBe(JSON.stringify("new-value"));
	});

	it("setValue handles functional updates", () => {
		const { result } = renderHook(() => useLocalStorage("test-key", 0));

		act(() => {
			result.current[1]((prev) => prev + 1);
		});

		expect(result.current[0]).toBe(1);
		expect(window.localStorage.getItem("test-key")).toBe(JSON.stringify(1));
	});

	it("removeValue removes item and resets to initial", () => {
		window.localStorage.setItem("test-key", JSON.stringify("stored-value"));
		const { result } = renderHook(() => useLocalStorage("test-key", "default"));

		expect(result.current[0]).toBe("stored-value");

		act(() => {
			result.current[2]();
		});

		expect(result.current[0]).toBe("default");
		expect(window.localStorage.getItem("test-key")).toBeNull();
	});

	it("listens to storage events from other tabs", () => {
		const { result } = renderHook(() => useLocalStorage("test-key", "default"));

		act(() => {
			const event = new StorageEvent("storage", {
				key: "test-key",
				newValue: JSON.stringify("external-value"),
			});
			window.dispatchEvent(event);
		});

		expect(result.current[0]).toBe("external-value");

		act(() => {
			const event = new StorageEvent("storage", {
				key: "test-key",
				newValue: null, // deleted in another tab
			});
			window.dispatchEvent(event);
		});

		expect(result.current[0]).toBe("default");
	});

	it("ignores storage events for other keys", () => {
		const { result } = renderHook(() => useLocalStorage("test-key", "default"));

		act(() => {
			const event = new StorageEvent("storage", {
				key: "other-key",
				newValue: JSON.stringify("external-value"),
			});
			window.dispatchEvent(event);
		});

		expect(result.current[0]).toBe("default");
	});

	it("handles debounced set operations", () => {
		const { result } = renderHook(() =>
			useLocalStorage("test-key", "default", { debounceWait: 500 }),
		);

		act(() => {
			result.current[1]("new-value");
		});

		// State updates immediately
		expect(result.current[0]).toBe("new-value");
		// But storage is not updated yet
		expect(window.localStorage.getItem("test-key")).toBeNull();

		act(() => {
			vi.advanceTimersByTime(500);
		});

		// Storage is updated after timeout
		expect(window.localStorage.getItem("test-key")).toBe(JSON.stringify("new-value"));
	});

	it("flushes debounced operations on unmount", () => {
		const { result, unmount } = renderHook(() =>
			useLocalStorage("test-key", "default", { debounceWait: 500 }),
		);

		act(() => {
			result.current[1]("new-value");
		});

		expect(window.localStorage.getItem("test-key")).toBeNull();

		act(() => {
			unmount();
		});

		// Should flush immediately on unmount
		expect(window.localStorage.getItem("test-key")).toBe(JSON.stringify("new-value"));
	});

	it("handles errors when writing to localStorage", () => {
		const onError = vi.fn();
		const { result } = renderHook(() => useLocalStorage("test-key", "default", { onError }));

		const setItemMock = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("Quota exceeded");
		});
		const storageAvMock = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
			throw new Error("Quota exceeded");
		});

		act(() => {
			result.current[1]("new-value");
		});

		expect(result.current[0]).toBe("new-value"); // State still updates
		expect(onError).toHaveBeenCalledWith(expect.any(Error));

		setItemMock.mockRestore();
		storageAvMock.mockRestore();
	});

	it("handles unexpected errors during setValue", () => {
		const onError = vi.fn();
		const { result } = renderHook(() => useLocalStorage("test-key", "default", { onError }));

		act(() => {
			result.current[1](() => {
				throw new Error("Unexpected render error");
			});
		});

		expect(onError).toHaveBeenCalledWith(expect.any(Error));
	});
});
