import { StateCreator } from "zustand";
import { AppState } from "../../../types/store";

export const createErrorSlice: StateCreator<
    AppState,
    [],
    [],
    Pick<AppState, "errors" | "errorActions">
> = (set, get) => ({
    errors: {
        current: null,
        history: [],
    },

    errorActions: {
        setError: (error) =>
            set((state) => ({
                errors: {
                    current: error,
                    history: error
                        ? [...state.errors.history, error]
                        : state.errors.history,
                },
            })),

        clearError: () =>
            set((state) => ({
                errors: {
                    ...state.errors,
                    current: null,
                },
            })),

        logError: (error, context, metadata = {}) => {
            const errorLog = {
                error,
                context,
                metadata,
                timestamp: new Date().toISOString(),
            };

            set((state) => ({
                errors: {
                    ...state.errors,
                    history: [...state.errors.history, errorLog],
                },
            }));

            // * Log to console for development
            if (process.env.NODE_ENV === "development") {
                console.error("Error logged:", errorLog);
            }
        },
    },
});
