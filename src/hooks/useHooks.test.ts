import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useToggle } from "./useHooks";

describe("useToggle", () => {
	it("initializes with default value (false)", () => {
		const { result } = renderHook(() => useToggle());
		const [value] = result.current;
		expect(value).toBe(false);
	});

	it("initializes with provided value", () => {
		const { result } = renderHook(() => useToggle(true));
		const [value] = result.current;
		expect(value).toBe(true);
	});

	it("toggles value", () => {
		const { result } = renderHook(() => useToggle(false));
		const [, toggle] = result.current;

		act(() => {
			toggle();
		});
		expect(result.current[0]).toBe(true);

		act(() => {
			toggle();
		});
		expect(result.current[0]).toBe(false);
	});

	it("sets value explicitly", () => {
		const { result } = renderHook(() => useToggle(false));
		const [, , setValue] = result.current;

		act(() => {
			setValue(true);
		});
		expect(result.current[0]).toBe(true);

		act(() => {
			setValue(false);
		});
		expect(result.current[0]).toBe(false);
	});

	it("maintains function reference stability", () => {
		const { result, rerender } = renderHook(() => useToggle());
		const [, toggle1, setValue1] = result.current;

		rerender();
		const [, toggle2, setValue2] = result.current;

		expect(toggle1).toBe(toggle2);
		expect(setValue1).toBe(setValue2);
	});
});
