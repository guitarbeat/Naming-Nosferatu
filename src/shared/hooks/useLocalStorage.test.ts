import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLocalStorage } from "./index";

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
});

describe("useLocalStorage", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should return initial value", () => {
		const { result } = renderHook(() => useLocalStorage("test-key", "initial"));
		expect(result.current[0]).toBe("initial");
	});

	it("should update value immediately", () => {
		const { result } = renderHook(() => useLocalStorage("test-key", "initial"));
		act(() => {
			result.current[1]("new-value");
		});
		expect(result.current[0]).toBe("new-value");
		expect(localStorage.getItem("test-key")).toBe(JSON.stringify("new-value"));
	});

	it("should debounce localStorage write when debounceDelay is provided", () => {
		const { result } = renderHook(() =>
			useLocalStorage("test-key", "initial", { debounceDelay: 1000 }),
		);

		act(() => {
			result.current[1]("update-1");
		});

		// State should be updated immediately
		expect(result.current[0]).toBe("update-1");

		// LocalStorage should NOT be updated yet
		expect(localStorage.getItem("test-key")).toBeNull();

		// Fast forward less than debounce delay
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(localStorage.getItem("test-key")).toBeNull();

		// Update again before debounce expires
		act(() => {
			result.current[1]("update-2");
		});
		expect(result.current[0]).toBe("update-2");

		// Fast forward past first delay but not second
		act(() => {
			vi.advanceTimersByTime(600);
		});
		expect(localStorage.getItem("test-key")).toBeNull();

		// Fast forward past second delay
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(localStorage.getItem("test-key")).toBe(JSON.stringify("update-2"));
	});

	it("should handle functional updates correctly with debounce", () => {
		const { result } = renderHook(() =>
			useLocalStorage("test-counter", 0, { debounceDelay: 1000 }),
		);

		act(() => {
			result.current[1]((prev) => prev + 1);
		});
		expect(result.current[0]).toBe(1);

		act(() => {
			result.current[1]((prev) => prev + 1);
		});
		expect(result.current[0]).toBe(2);

		// LocalStorage should be empty
		expect(localStorage.getItem("test-counter")).toBeNull();

		// Run timer
		act(() => {
			vi.runAllTimers();
		});

		expect(localStorage.getItem("test-counter")).toBe("2");
	});
});
