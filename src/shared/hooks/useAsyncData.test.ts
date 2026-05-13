import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useAsyncData } from "./useAsyncData";

// @vitest-environment jsdom

describe("useAsyncData", () => {
	it("should return initial data and loading state", async () => {
		const fetcher = vi.fn().mockResolvedValue("data");
		const { result } = renderHook(() => useAsyncData(fetcher, "initial"));

		expect(result.current.data).toBe("initial");
		expect(result.current.isLoading).toBe(true);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.data).toBe("data");
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBe(null);
	});

	it("should handle errors", async () => {
		const fetcher = vi.fn().mockRejectedValue(new Error("Test error"));
		const { result } = renderHook(() => useAsyncData(fetcher, "initial"));

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.data).toBe("initial");
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("Test error");
	});
});
