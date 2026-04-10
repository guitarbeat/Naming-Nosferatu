import type { StateCreator } from "zustand";
import type { AppState } from "@/store/appStore.types";

export type AppSet = Parameters<StateCreator<AppState>>[0];
export type AppSliceCreator<TSlice> = StateCreator<AppState, [], [], TSlice>;

export const IS_BROWSER = typeof window !== "undefined";
export const IS_DEV = import.meta.env?.DEV ?? false;

export function patch<K extends keyof AppState>(
	set: AppSet,
	key: K,
	updates: Partial<AppState[K]>,
): void {
	set((state) => ({
		...state,
		[key]: { ...state[key], ...updates },
	}));
}
