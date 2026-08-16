// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

describe("usePrefersReducedMotion", () => {
	let matchMediaMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		matchMediaMock = vi.fn();
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: matchMediaMock,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns false by default if window.matchMedia does not match", () => {
		matchMediaMock.mockReturnValue({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});

		const { result } = renderHook(() => usePrefersReducedMotion());

		expect(result.current).toBe(false);
		expect(matchMediaMock).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
	});

	it("returns true if window.matchMedia matches", () => {
		matchMediaMock.mockReturnValue({
			matches: true,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});

		const { result } = renderHook(() => usePrefersReducedMotion());

		expect(result.current).toBe(true);
	});

	it("updates when media query changes", () => {
		let changeListener: (() => void) | null = null;

		// The hook reads media.matches during initialization and inside the change event
		const mediaQueryListMock = {
			matches: false,
			addEventListener: vi.fn((event, listener) => {
				if (event === "change") {
					changeListener = listener;
				}
			}),
			removeEventListener: vi.fn(),
		};

		matchMediaMock.mockReturnValue(mediaQueryListMock);

		const { result, unmount } = renderHook(() => usePrefersReducedMotion());

		expect(result.current).toBe(false);
		expect(mediaQueryListMock.addEventListener).toHaveBeenCalledWith(
			"change",
			expect.any(Function),
		);

		// Simulate the change event: mutate the mock and call the listener
		act(() => {
			mediaQueryListMock.matches = true;
			if (changeListener) {
				changeListener();
			}
		});

		expect(result.current).toBe(true);

		// Test cleanup
		unmount();
		expect(mediaQueryListMock.removeEventListener).toHaveBeenCalledWith(
			"change",
			expect.any(Function),
		);
	});
});
