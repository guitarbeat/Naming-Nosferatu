import type { AppState } from "../../types/store";

/**
 * Common helper for nested Zustand slice updates to reduce boilerplate spreading.
 */
export const updateSlice = <K extends keyof AppState>(
	set: (fn: (state: AppState) => Partial<AppState> | AppState) => void,
	key: K,
	updates: Partial<AppState[K]>,
) => {
	set((state) => ({
		[key]: {
			...(state[key] as object),
			...(updates as object),
		},
	}));
};
