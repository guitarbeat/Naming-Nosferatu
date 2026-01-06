import { StateCreator } from "zustand";
import { AppState } from "../../../types/store";
import { siteSettingsAPI } from "../../../shared/services/supabase/client";

export const createSiteSettingsSlice: StateCreator<
    AppState,
    [],
    [],
    Pick<AppState, "siteSettings" | "siteSettingsActions">
> = (set, get) => ({
    siteSettings: {
        catChosenName: null,
        isLoaded: false,
    },

    siteSettingsActions: {
        loadCatChosenName: async () => {
            try {
                const data = await siteSettingsAPI.getCatChosenName();
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
