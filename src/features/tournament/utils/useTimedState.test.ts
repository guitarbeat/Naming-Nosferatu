import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTimedState } from "./useTimedState";

describe("useTimedState", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should initialize with the default value", () => {
		const { result } = renderHook(() => useTimedState("default"));
		expect(result.current.value).toBe("default");
	});

	it("should update value normally using set()", () => {
		const { result } = renderHook(() => useTimedState("default"));

		act(() => {
			result.current.set("new value");
		});

		expect(result.current.value).toBe("new value");
	});

	it("should update value temporarily using setTimed() and revert to default", () => {
		const { result } = renderHook(() => useTimedState("default"));

		act(() => {
			result.current.setTimed("temporary", 1000);
		});

		expect(result.current.value).toBe("temporary");

		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(result.current.value).toBe("temporary"); // Still temporary

		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(result.current.value).toBe("default"); // Reverted
	});

	it("should abort the timed revert when clear() is called", () => {
		const { result } = renderHook(() => useTimedState("default"));

		act(() => {
			result.current.setTimed("temporary", 1000);
		});

		act(() => {
			vi.advanceTimersByTime(500);
			result.current.clear();
		});

		act(() => {
			vi.advanceTimersByTime(1000);
		});

		expect(result.current.value).toBe("temporary"); // Remains temporary since timeout was cleared
	});

	it("should reset the timeout if setTimed() is called multiple times", () => {
		const { result } = renderHook(() => useTimedState("default"));

		act(() => {
			result.current.setTimed("temp1", 1000);
		});

		act(() => {
			vi.advanceTimersByTime(500);
		});

		// Call it again, should reset timer
		act(() => {
			result.current.setTimed("temp2", 1000);
		});

		expect(result.current.value).toBe("temp2");

		act(() => {
			vi.advanceTimersByTime(500); // 1000 total time elapsed since first call
		});

		expect(result.current.value).toBe("temp2"); // Has not reverted because the timer was reset

		act(() => {
			vi.advanceTimersByTime(500); // 1000 total time elapsed since second call
		});

		expect(result.current.value).toBe("default"); // Reverted
	});

	it("should clear the timeout when unmounted", () => {
		const { result, unmount } = renderHook(() => useTimedState("default"));

		act(() => {
			result.current.setTimed("temporary", 1000);
		});

		const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

		unmount();

		expect(clearTimeoutSpy).toHaveBeenCalled();
	});
});
