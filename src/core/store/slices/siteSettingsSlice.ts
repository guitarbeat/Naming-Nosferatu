import type { StateCreator } from "zustand";
import { siteSettingsAPI } from "../../../shared/services/supabase/client";
import type { AppState, CatChosenName } from "../../../types/store";

export const createSiteSettingsSlice: StateCreator<
	AppState,
	[],
	[],
	Pick<AppState, "siteSettings" | "siteSettingsActions">
> = (set, _get) => ({
	siteSettings: {
		catChosenName: null,
		isLoaded: false,
	},

	siteSettingsActions: {
		loadCatChosenName: async () => {
			try {
				const data = (await siteSettingsAPI.getCatChosenName()) as CatChosenName | null;
				set((state) => ({
					siteSettings: {
						...state.siteSettings,
						catChosenName: data,
						isLoaded: true,
					},
				}));
				return data;
			} catch (error) {
				console.error("Error loading cat chosen name:", error);
				set((state) => ({
					siteSettings: {
						...state.siteSettings,
						isLoaded: true,
					},
				}));
				return null;
			}
		},

		updateCatChosenName: (nameData) =>
			set((state) => ({
				siteSettings: {
					...state.siteSettings,
					catChosenName: nameData,
				},
			})),
	},
});
