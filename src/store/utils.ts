import type { AppSet, AppState } from "./types";

export const IS_BROWSER = typeof window !== "undefined";
export const _IS_DEV = import.meta.env?.DEV ?? false;

export function patch<K extends keyof AppState>(
	set: AppSet,
	key: K,
	updates: Partial<AppState[K]>,
): void {
	set((state) => {
		const current = state[key];
		let hasChanged = false;
		for (const uKey in updates) {
			if (updates[uKey] !== current[uKey as unknown as keyof typeof current]) {
				hasChanged = true;
				break;
			}
		}
		if (!hasChanged) {
			return state;
		}
		return {
			...state,
			[key]: { ...state[key], ...updates },
		};
	});
}
