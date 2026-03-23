import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTilt } from "./useTilt";

function createMatchMedia(matches = false) {
	return vi.fn().mockImplementation((query: string) => ({
		matches,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));
}

describe("useTilt", () => {
	const originalMatchMedia = window.matchMedia;

	afterEach(() => {
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			configurable: true,
			value: originalMatchMedia,
		});
	});

	it("disables tilt when matchMedia support is unavailable", () => {
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			configurable: true,
			value: undefined,
		});

		const { result } = renderHook(() => useTilt(true));
		expect(result.current.isEnabled).toBe(false);
	});

	it("keeps tilt enabled for fine pointers when media queries are available", () => {
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			configurable: true,
			value: createMatchMedia(false),
		});

		const { result } = renderHook(() => useTilt(true));
		expect(result.current.isEnabled).toBe(true);
	});
});
