import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePrevious } from "./useHooks";

describe("usePrevious", () => {
	it("should return undefined on initial render", () => {
		const { result } = renderHook(() => usePrevious(0));
		expect(result.current).toBeUndefined();
	});

	it("should return the previous value after update", () => {
		const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
			initialProps: { value: 0 },
		});

		// First render: prev is undefined, current value is 0
		expect(result.current).toBeUndefined();

		// Second render: value is 1, prev should be 0
		rerender({ value: 1 });
		expect(result.current).toBe(0);

		// Third render: value is 2, prev should be 1
		rerender({ value: 2 });
		expect(result.current).toBe(1);
	});

	it("should handle different types of values", () => {
		const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
			initialProps: { value: "a" as any },
		});

		expect(result.current).toBeUndefined();

		rerender({ value: "b" });
		expect(result.current).toBe("a");

		rerender({ value: { foo: "bar" } });
		expect(result.current).toBe("b");

		rerender({ value: { foo: "baz" } });
		expect(result.current).toEqual({ foo: "bar" });
	});

	it("should return the same previous value if the value hasn't changed", () => {
		const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
			initialProps: { value: 0 },
		});

		expect(result.current).toBeUndefined();

		rerender({ value: 1 });
		expect(result.current).toBe(0);

		rerender({ value: 1 });
		expect(result.current).toBe(1);
	});
});
