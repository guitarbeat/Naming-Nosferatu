import type { StateCreator } from "zustand";
import type { AppState } from "../../../types/store";
import { updateSlice } from "../utils";

export const createErrorSlice: StateCreator<
  AppState,
  [],
  [],
  Pick<AppState, "errors" | "errorActions">
> = (set, _get) => ({
  errors: {
    current: null,
    history: [],
  },

  errorActions: {
    setError: (error) =>
      updateSlice(set, "errors", {
        current: error,
        history: error
          ? [..._get().errors.history, error]
          : _get().errors.history,
      }),

    clearError: () => updateSlice(set, "errors", { current: null }),

    logError: (error, context, metadata = {}) => {
      const errorLog = {
        error,
        context,
        metadata,
        timestamp: new Date().toISOString(),
      };

      updateSlice(set, "errors", {
        history: [..._get().errors.history, errorLog],
      });

      // * Log to console for development
      if (import.meta.env.DEV) {
        console.error("Error logged:", errorLog);
      }
    },
  },
});
