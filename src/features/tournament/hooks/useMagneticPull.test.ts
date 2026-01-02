import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useMagneticPull from "./useTournamentInteractions";

// Mock requestAnimationFrame
// We map raf to setTimeout with a small delay
const requestAnimationFrameMock = (callback: FrameRequestCallback) => {
	return setTimeout(callback, 16); // Simulate ~60fps
};

const cancelAnimationFrameMock = (id: number) => {
	clearTimeout(id);
};

describe("useMagneticPull", () => {
	let leftOrb: HTMLDivElement;
	let rightOrb: HTMLDivElement;

	beforeEach(() => {
		// Setup DOM elements
		leftOrb = document.createElement("div");
		rightOrb = document.createElement("div");

		// Setup mocks
		vi.stubGlobal("requestAnimationFrame", vi.fn(requestAnimationFrameMock));
		vi.stubGlobal("cancelAnimationFrame", vi.fn(cancelAnimationFrameMock));

		// Mock window dimensions
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 1000,
		});
		Object.defineProperty(window, "innerHeight", {
			writable: true,
			configurable: true,
			value: 800,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("updates transform on mouse move", async () => {
		// Use fake timers to control requestAnimationFrame/setTimeout
		vi.useFakeTimers();

		const { unmount } = renderHook(() =>
			useMagneticPull({ current: leftOrb }, { current: rightOrb }, true),
		);

		// Initial state should be unset or default
		expect(leftOrb.style.transform).toBe("");

		// Simulate mouse move to center
		const event = new MouseEvent("mousemove", {
			bubbles: true,
			cancelable: true,
			clientX: 500, // Center X
			clientY: 400, // Center Y
		});

		act(() => {
			document.dispatchEvent(event);
		});

		// Advance time to allow the RAF loop to process the event
		act(() => {
			vi.advanceTimersByTime(20);
		});

		// Center is 500, 400. Mouse is 500, 400.
		// xAxis = (500 - 500) / 40 = 0
		// yAxis = (400 - 400) / 40 = 0
		// left: translate(-0px, -0px)
		// right: translate(0px, 0px)

		expect(leftOrb.style.transform).toContain("translate(0px, 0px)");
		expect(rightOrb.style.transform).toContain("translate(0px, 0px)");

		// Move mouse to 0,0
		const event2 = new MouseEvent("mousemove", {
			bubbles: true,
			cancelable: true,
			clientX: 0,
			clientY: 0,
		});

		act(() => {
			document.dispatchEvent(event2);
		});

		// Advance time again
		act(() => {
			vi.advanceTimersByTime(20);
		});

		// xAxis = (500 - 0) / 40 = 12.5
		// yAxis = (400 - 0) / 40 = 10
		// left: translate(-12.5px, -10px)
		// right: translate(12.5px, 10px)

		expect(leftOrb.style.transform).toContain("translate(-12.5px, -10px)");
		expect(rightOrb.style.transform).toContain("translate(12.5px, 10px)");

		unmount();
		vi.useRealTimers();
	});
});
