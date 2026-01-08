import type { StateCreator } from "zustand";
import { siteSettingsAPI } from "../../../shared/services/supabase/client";
import type { AppState, CatChosenName } from "../../../types/store";
import { updateSlice } from "../utils";

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
				updateSlice(set, "siteSettings", {
					catChosenName: data,
					isLoaded: true,
				});
				return data;
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
