import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import { ErrorManager } from "@/shared/services/errorManager";
import type { AppState } from "@/store/appStore.types";
import { createErrorSlice } from "./errorSlice";

// Mock ErrorManager
vi.mock("@/shared/services/errorManager", () => ({
	ErrorManager: {
		handleError: vi.fn(),
	},
}));

describe("errorSlice", () => {
	let useStore: ReturnType<
		typeof create<Pick<AppState, "errors" | "errorActions">>
	>;

	beforeEach(() => {
		useStore = create<Pick<AppState, "errors" | "errorActions">>((...args) => ({
			...createErrorSlice(...args),
		}));
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2023-01-01T00:00:00Z"));
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	describe("setError", () => {
		it("should set the current error and add to history when an error is provided", () => {
			const error = new Error("Test error");

			useStore.getState().errorActions.setError(error);

			const state = useStore.getState();
			expect(state.errors.current).toBe(error);
			expect(state.errors.history).toHaveLength(1);
			expect(state.errors.history[0]).toEqual({
				error,
				context: "setError",
				metadata: {},
				timestamp: "2023-01-01T00:00:00.000Z",
			});
		});

		it("should clear the current error but not add to history when null is provided", () => {
			const error = new Error("Initial error");
			useStore.getState().errorActions.setError(error);

			useStore.getState().errorActions.setError(null);

			const state = useStore.getState();
			expect(state.errors.current).toBeNull();
			expect(state.errors.history).toHaveLength(1); // Should still just have the first one
		});
	});

	describe("clearError", () => {
		it("should clear the current error", () => {
			const error = new Error("Test error");
			useStore.getState().errorActions.setError(error);

			useStore.getState().errorActions.clearError();

			const state = useStore.getState();
			expect(state.errors.current).toBeNull();
			// History should remain unchanged
			expect(state.errors.history).toHaveLength(1);
		});
	});

	describe("logError", () => {
		it("should add error to history and call ErrorManager.handleError", () => {
			const error = new Error("Logged error");
			const context = "testContext";
			const metadata = { userId: "123" };

			useStore.getState().errorActions.logError(error, context, metadata);

			const state = useStore.getState();

			// Should add to history
			expect(state.errors.history).toHaveLength(1);
			expect(state.errors.history[0]).toEqual({
				error,
				context,
				metadata,
				timestamp: "2023-01-01T00:00:00.000Z",
			});

			// Should NOT set current error
			expect(state.errors.current).toBeNull();

			// Should call ErrorManager
			expect(ErrorManager.handleError).toHaveBeenCalledWith(
				error,
				context,
				metadata,
			);
		});

		it("should use empty object for metadata if not provided", () => {
			const error = new Error("Logged error");
			const context = "testContext";

			useStore.getState().errorActions.logError(error, context);

			const state = useStore.getState();

			expect(state.errors.history[0].metadata).toEqual({});
			expect(ErrorManager.handleError).toHaveBeenCalledWith(error, context, {});
		});
	});
});
