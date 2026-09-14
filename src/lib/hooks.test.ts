import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "../hooks";

declare global {
	var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// Declare IS_REACT_ACT_ENVIRONMENT for React 19 testing without warnings
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Simple custom renderHook helper using React 19 createRoot and act
function renderHook<TProps, TResult>(
	renderCallback: (props: TProps) => TResult,
	initialProps: TProps,
) {
	const result = { current: null as TResult };
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);

	let currentProps = initialProps;

	function TestComponent(props: { hookProps: TProps }) {
		result.current = renderCallback(props.hookProps);
		return null;
	}

	act(() => {
		root.render(createElement(TestComponent, { hookProps: currentProps }));
	});

	return {
		result,
		rerender: (newProps: TProps) => {
			currentProps = newProps;
			act(() => {
				root.render(createElement(TestComponent, { hookProps: currentProps }));
			});
		},
		unmount: () => {
			act(() => {
				root.unmount();
			});
			container.remove();
		},
	};
}

describe("useDebounce", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the initial value immediately", () => {
		const { result, unmount } = renderHook(({ value, delay }) => useDebounce(value, delay), {
			value: "initial",
			delay: 500,
		});

		expect(result.current).toBe("initial");
		unmount();
	});

	it("updates the debounced value after the specified delay", () => {
		const { result, rerender, unmount } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ value: "initial", delay: 500 },
		);

		expect(result.current).toBe("initial");

		// Change input value
		rerender({ value: "updated", delay: 500 });

		// Should still be initial value before delay
		expect(result.current).toBe("initial");

		// Advance time partially
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(result.current).toBe("initial");

		// Advance time past delay
		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(result.current).toBe("updated");

		unmount();
	});

	it("resets timer when value changes rapidly before delay elapses", () => {
		const { result, rerender, unmount } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ value: "first", delay: 500 },
		);

		rerender({ value: "second", delay: 500 });

		// Advance 300ms (not full 500ms)
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(result.current).toBe("first");

		// Update again before 500ms completes
		rerender({ value: "third", delay: 500 });

		// Advance another 300ms (total 600ms from start, but only 300ms since last change)
		act(() => {
			vi.advanceTimersByTime(300);
		});
		// Should NOT be "second" or "third" yet
		expect(result.current).toBe("first");

		// Advance remaining 200ms
		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(result.current).toBe("third");

		unmount();
	});

	it("handles different data types such as numbers and objects", () => {
		const initialObj = { name: "Mittens", score: 10 };
		const updatedObj = { name: "Mittens", score: 20 };

		const { result, rerender, unmount } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ value: initialObj, delay: 300 },
		);

		expect(result.current).toEqual(initialObj);

		rerender({ value: updatedObj, delay: 300 });

		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(result.current).toEqual(updatedObj);

		unmount();
	});

	it("clears timeout on unmount to prevent state update on unmounted component", () => {
		const { result, rerender, unmount } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ value: "initial", delay: 500 },
		);

		rerender({ value: "changed", delay: 500 });

		// Unmount before delay passes
		unmount();

		// Advance timers past delay
		act(() => {
			vi.advanceTimersByTime(500);
		});

		// Value in result remains what it was prior to unmount
		expect(result.current).toBe("initial");
	});
});
