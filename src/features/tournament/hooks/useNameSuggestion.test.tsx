import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNameSuggestion } from "./useNameSuggestion";

const mockAddName = vi.fn();

vi.mock("@/shared/api/names/api", () => ({
	addName: (...args: unknown[]) => mockAddName(...args),
}));

describe("useNameSuggestion", () => {
	beforeEach(() => {
		mockAddName.mockReset();
	});

	describe("Initialization", () => {
		it("initializes with default values", () => {
			const { result } = renderHook(() => useNameSuggestion());
			expect(result.current.values).toEqual({ name: "", description: "" });
			expect(result.current.errors).toEqual({});
			expect(result.current.touched).toEqual({});
			expect(result.current.isSubmitting).toBe(false);
			expect(result.current.globalError).toBe("");
			expect(result.current.successMessage).toBe("");
		});
	});

	describe("Validation and State Management", () => {
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

		it("clears specific error and global error on handleChange", async () => {
			const { result } = renderHook(() => useNameSuggestion());

			act(() => {
				result.current.setGlobalError("Some global error");
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(result.current.errors.name).toBe("Name is required");
			expect(result.current.globalError).toBe("Some global error");

			act(() => {
				result.current.handleChange("name", "New Name");
			});

			expect(result.current.errors.name).toBeUndefined();
			expect(result.current.globalError).toBe("");
		});

		it("updates isValid flag correctly", async () => {
			const { result } = renderHook(() => useNameSuggestion());

			expect(result.current.isValid).toBe(false);

			act(() => {
				result.current.handleChange("name", "Valid Name");
			});
			expect(result.current.isValid).toBe(true);

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(result.current.errors.description).toBe("Description is required");
			expect(result.current.isValid).toBe(false);

			act(() => {
				result.current.handleChange("description", "Valid Description");
			});

			expect(result.current.isValid).toBe(true);
		});

		it("resets state", () => {
			const { result } = renderHook(() => useNameSuggestion());

			act(() => {
				result.current.handleChange("name", "Test Cat");
				result.current.handleChange("description", "A cute test cat");
				result.current.setGlobalError("Global error");
			});

			act(() => {
				result.current.reset();
			});

			expect(result.current.values).toEqual({ name: "", description: "" });
			expect(result.current.errors).toEqual({});
			expect(result.current.touched).toEqual({});
			expect(result.current.globalError).toBe("");
			expect(result.current.successMessage).toBe("");
		});

		it("allows manually setting global error", () => {
			const { result } = renderHook(() => useNameSuggestion());

			act(() => {
				result.current.setGlobalError("Manual error");
			});

			expect(result.current.globalError).toBe("Manual error");
		});
	});

	describe("Submission", () => {
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

		it("handles non-Error submission rejection", async () => {
			const { result } = renderHook(() => useNameSuggestion());

			mockAddName.mockRejectedValue("Something went wrong");

			act(() => {
				result.current.handleChange("name", "Duplicate Cat");
				result.current.handleChange("description", "Another cat");
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(mockAddName).toHaveBeenCalledTimes(1);
			expect(result.current.globalError).toBe("Failed to submit suggestion");
			expect(result.current.successMessage).toBe("");
		});

		it("sanitizes and trims input before submission", async () => {
			const { result } = renderHook(() => useNameSuggestion());

			mockAddName.mockResolvedValue({});

			act(() => {
				result.current.handleChange("name", "  <script>alert(1)</script>Bad Cat  ");
				result.current.handleChange("description", "  <p>Some text</p>  ");
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(mockAddName).toHaveBeenCalledWith({
				name: "Bad Cat",
				description: "Some text",
			});
		});

		it("updates isSubmitting flag correctly during submission", async () => {
			const { result } = renderHook(() => useNameSuggestion());

			let resolveSubmit: (val: unknown) => void = () => {};
			mockAddName.mockReturnValue(
				new Promise((resolve) => {
					resolveSubmit = resolve;
				}),
			);

			act(() => {
				result.current.handleChange("name", "Test Cat");
				result.current.handleChange("description", "Test desc");
			});

			expect(result.current.isSubmitting).toBe(false);

			let submitPromise: Promise<void>;
			act(() => {
				submitPromise = result.current.handleSubmit();
			});

			expect(result.current.isSubmitting).toBe(true);

			await act(async () => {
				resolveSubmit({});
				await submitPromise;
			});

			expect(result.current.isSubmitting).toBe(false);
		});

		it("updates isSubmitting flag correctly during submission error", async () => {
			const { result } = renderHook(() => useNameSuggestion());

			let rejectSubmit: (err: Error) => void = () => {};
			mockAddName.mockReturnValue(
				new Promise((_, reject) => {
					rejectSubmit = reject;
				}),
			);

			act(() => {
				result.current.handleChange("name", "Test Cat");
				result.current.handleChange("description", "Test desc");
			});

			expect(result.current.isSubmitting).toBe(false);

			let submitPromise: Promise<void>;
			act(() => {
				submitPromise = result.current.handleSubmit();
			});

			expect(result.current.isSubmitting).toBe(true);

			await act(async () => {
				rejectSubmit(new Error("Test error"));
				try {
					await submitPromise;
				} catch {}
			});

			expect(result.current.isSubmitting).toBe(false);
			expect(result.current.globalError).toBe("Test error");
		});
	});
});
