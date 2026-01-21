import { siteSettingsAPI } from "@supabase/client";
import type { StateCreator } from "zustand";
import { STORAGE_KEYS } from "../../../core/constants";
import type { AppState, CatChosenName, UIState } from "../../../types/store";
import { updateSlice } from "../useAppStore";

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

export const createSettingsSlice: StateCreator<
	AppState,
	[],
	[],
	Pick<AppState, "ui" | "siteSettings" | "uiActions" | "siteSettingsActions">
> = (set, get) => ({
	// UI state (from uiSlice)
	ui: {
		...getInitialThemeState(),
		showGlobalAnalytics: false,
		showUserComparison: false,
		matrixMode: false,
		isSwipeMode: false,
		showCatPictures: false,
		showGallery: false,
		isEditingProfile: false,
	},

	// Site settings state (from siteSettingsSlice)
	siteSettings: {
		catChosenName: null,
		isLoaded: false,
	},

	// Combined actions
	uiActions: {
		setMatrixMode: (enabled) => updateSlice(set, "ui", { matrixMode: enabled }),

		setGlobalAnalytics: (show) => updateSlice(set, "ui", { showGlobalAnalytics: show }),

		setSwipeMode: (enabled) => updateSlice(set, "ui", { isSwipeMode: enabled }),

		setCatPictures: (show) => updateSlice(set, "ui", { showCatPictures: show }),

		setGalleryVisible: (visible) => updateSlice(set, "ui", { showGallery: visible }),

		setUserComparison: (show) => updateSlice(set, "ui", { showUserComparison: show }),

		setEditingProfile: (editing) => updateSlice(set, "ui", { isEditingProfile: editing }),

		setTheme: (newTheme) => {
			const isSystem = newTheme === "system";

			let resolvedTheme = newTheme;
			if (isSystem && typeof window !== "undefined" && window.matchMedia) {
				resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light";
			}

			updateSlice(set, "ui", {
				theme: resolvedTheme,
				themePreference: newTheme,
			});

			if (typeof window !== "undefined") {
				localStorage.setItem(STORAGE_KEYS.THEME, newTheme);

				// Handle system theme listener
				if (isSystem) {
					const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
					const listener = (e: MediaQueryListEvent) => {
						// Only update if preference is still system
						if (get().ui.themePreference === "system") {
							updateSlice(set, "ui", {
								theme: e.matches ? "dark" : "light",
							});
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

	siteSettingsActions: {
		loadCatChosenName: async () => {
			try {
				const chosenNameData = (await siteSettingsAPI.getCatChosenName()) as CatChosenName | null;
				updateSlice(set, "siteSettings", {
					catChosenName: chosenNameData,
					isLoaded: true,
				});
				return chosenNameData;
			} catch (error) {
				console.error("Error loading cat chosen name:", error);
				updateSlice(set, "siteSettings", { isLoaded: true });
				return null;
			}
		},

		updateCatChosenName: (nameData) =>
			updateSlice(set, "siteSettings", { catChosenName: nameData }),
	},
});
