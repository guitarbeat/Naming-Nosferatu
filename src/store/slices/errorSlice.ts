import { ErrorManager } from "@/shared/services/errorManager";
import type { ErrorLog } from "@/shared/types";
import { type AppSliceCreator, patch } from "@/store/appStore.shared";
import type { AppState } from "@/store/appStore.types";

export const createErrorSlice: AppSliceCreator<Pick<AppState, "errors" | "errorActions">> = (
	set,
	get,
) => ({
	errors: {
		current: null,
		history: [],
	},

	errorActions: {
		setError: (error) => {
			const log: ErrorLog | null = error
				? {
						error,
						context: "setError",
						metadata: {},
						timestamp: new Date().toISOString(),
					}
				: null;

			patch(set, "errors", {
				current: error,
				history: log ? [...get().errors.history, log] : get().errors.history,
			});
		},

		clearError: () => patch(set, "errors", { current: null }),

		logError: (error, context, metadata = {}) => {
			const entry: ErrorLog = {
				error,
				context,
				metadata,
				timestamp: new Date().toISOString(),
			};

			patch(set, "errors", {
				history: [...get().errors.history, entry],
			});

			// Defer to ErrorManager for standardized logging
			ErrorManager.handleError(error, context, metadata);
		},
	},
});
