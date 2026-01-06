import type { StateCreator } from "zustand";
import { STORAGE_KEYS } from "../../../core/constants";
import type { AppState, UIState } from "../../../types/store";

const getInitialThemeState = (): Pick<UIState, "theme" | "themePreference"> => {
	if (typeof window !== "undefined") {
		try {
			const storedTheme = window.localStorage.getItem(STORAGE_KEYS.THEME);
			if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
				return {
					theme: storedTheme,
					themePreference: storedTheme,
				};
			}
		} catch (e) {
			console.warn("Failed to read theme from localStorage", e);
		}
	}
	return {
		theme: "dark",
		themePreference: "dark",
	};
};

export const createUISlice: StateCreator<AppState, [], [], Pick<AppState, "ui" | "uiActions">> = (
	set,
	get,
) => ({
	ui: {
		...getInitialThemeState(),
		showGlobalAnalytics: false,
		showUserComparison: false,
		matrixMode: false,
		isSwipeMode: false,
		showCatPictures: false,
	},

	uiActions: {
		setMatrixMode: (enabled) =>
			set((state) => ({
				ui: {
					...state.ui,
					matrixMode: enabled,
				},
			})),

		setGlobalAnalytics: (show) =>
			set((state) => ({
				ui: {
					...state.ui,
					showGlobalAnalytics: show,
				},
			})),

		setSwipeMode: (enabled) =>
			set((state) => ({
				ui: {
					...state.ui,
					isSwipeMode: enabled,
				},
			})),

		setCatPictures: (show) =>
			set((state) => ({
				ui: {
					...state.ui,
					showCatPictures: show,
				},
			})),

		setUserComparison: (show) =>
			set((state) => ({
				ui: {
					...state.ui,
					showUserComparison: show,
				},
			})),

		setTheme: (newTheme) => {
			const isSystem = newTheme === "system";

			let resolvedTheme = newTheme;
			if (isSystem && typeof window !== "undefined" && window.matchMedia) {
				resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light";
			}

			set((state) => ({
				ui: {
					...state.ui,
					theme: resolvedTheme,
					themePreference: newTheme,
				},
			}));

			if (typeof window !== "undefined") {
				localStorage.setItem(STORAGE_KEYS.THEME, newTheme);

				// Handle system theme listener
				if (isSystem) {
					// Define the listener
					const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
					const listener = (e: MediaQueryListEvent) => {
						// Only update if preference is still system
						if (get().ui.themePreference === "system") {
							set((s) => ({
								ui: {
									...s.ui,
									theme: e.matches ? "dark" : "light",
								},
							}));
						}
					};
					mediaQuery.addEventListener("change", listener);
				}
			}
		},

		initializeTheme: () => {
			if (typeof window !== "undefined") {
				const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
				get().uiActions.setTheme(storedTheme);
			}
		},
	},
});
