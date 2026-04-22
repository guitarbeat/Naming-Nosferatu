import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNameSuggestion } from "./useNameSuggestion";

const mockAddName = vi.fn();

vi.mock("@/features/names/api", () => ({
	addName: (...args: unknown[]) => mockAddName(...args),
}));

describe("useNameSuggestion", () => {
	beforeEach(() => {
		mockAddName.mockReset();
	});

	it("initializes with default values", () => {
		const { result } = renderHook(() => useNameSuggestion());
		expect(result.current.values).toEqual({ name: "", description: "" });
		expect(result.current.errors).toEqual({});
		expect(result.current.touched).toEqual({});
		expect(result.current.isSubmitting).toBe(false);
		expect(result.current.globalError).toBe("");
		expect(result.current.successMessage).toBe("");
	});

	it("validates input", async () => {
		const { result } = renderHook(() => useNameSuggestion());

		act(() => {
			result.current.handleChange("name", "");
			result.current.handleBlur("name");
		});

		await act(async () => {
			await result.current.handleSubmit();
		});

		expect(result.current.errors.name).toBe("Name is required");
		expect(result.current.errors.description).toBe("Description is required");
	});

	it("submits valid data successfully", async () => {
		const onSuccessMock = vi.fn();
		const { result } = renderHook(() => useNameSuggestion({ onSuccess: onSuccessMock }));

		mockAddName.mockResolvedValue({
			id: "123",
			name: "Test Cat",
		});

		act(() => {
			result.current.handleChange("name", "Test Cat");
			result.current.handleChange("description", "A cute test cat");
		});

		await act(async () => {
			await result.current.handleSubmit();
		});

		expect(mockAddName).toHaveBeenCalledWith({
			name: "Test Cat",
			description: "A cute test cat",
		});
		expect(result.current.successMessage).toBe("Name suggestion submitted successfully!");
		expect(result.current.values).toEqual({ name: "", description: "" });
		expect(onSuccessMock).toHaveBeenCalledTimes(1);
	});

	it("handles submission error", async () => {
		const { result } = renderHook(() => useNameSuggestion());

		mockAddName.mockRejectedValue(new Error("Duplicate name"));

		act(() => {
			result.current.handleChange("name", "Duplicate Cat");
			result.current.handleChange("description", "Another cat");
		});

		await act(async () => {
			await result.current.handleSubmit();
		});

		expect(mockAddName).toHaveBeenCalledTimes(1);
		expect(result.current.globalError).toBe("Duplicate name");
		expect(result.current.successMessage).toBe("");
	});
});
