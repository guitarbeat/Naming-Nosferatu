import type { StateCreator } from "zustand";
import { STORAGE_KEYS } from "../../../core/constants";
import { updateSupabaseUserContext } from "../../../shared/services/supabase/client";
import type { AppState, UserState } from "../../../types/store";
import { updateSlice } from "../utils";

const getInitialUserState = (): UserState => {
	const defaultState: UserState = {
		name: "",
		isLoggedIn: false,
		isAdmin: false,
		preferences: {},
	};

	if (typeof window === "undefined") {
		return defaultState;
	}

	try {
		const storedUser = window.localStorage.getItem(STORAGE_KEYS.USER);
		if (storedUser?.trim()) {
			return {
				...defaultState,
				name: storedUser.trim(),
				isLoggedIn: true,
			};
		}
	} catch (error) {
		if (import.meta.env.DEV) {
			console.warn("Unable to read stored user from localStorage:", error);
		}
	}

	return defaultState;
};

export const createUserSlice: StateCreator<
	AppState,
	[],
	[],
	Pick<AppState, "user" | "userActions">
> = (set, _get) => ({
	user: getInitialUserState(),

	userActions: {
		setUser: (userData) => {
			updateSlice(set, "user", userData);
			// * Persist to localStorage
			try {
				const name = userData.name ?? _get().user.name;
				if (name) {
					localStorage.setItem(STORAGE_KEYS.USER, name);
				} else {
					localStorage.removeItem(STORAGE_KEYS.USER);
				}
			} catch (error) {
				if (import.meta.env.DEV) {
					console.error("Error updating localStorage:", error);
				}
			}
		},

		login: (userName) => {
			updateSlice(set, "user", { name: userName, isLoggedIn: true });
			// * Persist to localStorage
			try {
				localStorage.setItem(STORAGE_KEYS.USER, userName);
				// Update Supabase client headers for RLS policies
				updateSupabaseUserContext(userName);
			} catch (error) {
				if (import.meta.env.DEV) {
					console.error("Error updating localStorage:", error);
				}
			}
		},

		logout: () => {
			// * Clear localStorage
			try {
				localStorage.removeItem(STORAGE_KEYS.USER);
				// Clear Supabase client headers
				updateSupabaseUserContext(null);
			} catch (error) {
				if (import.meta.env.DEV) {
					console.error("Error clearing localStorage:", error);
				}
			}
			set((state) => ({
				user: {
					...state.user,
					name: "",
					isLoggedIn: false,
					isAdmin: false,
				},
				tournament: {
					...state.tournament,
					names: null,
					isComplete: false,
					voteHistory: [],
				},
			}));
		},

		setAdminStatus: (isAdmin) => updateSlice(set, "user", { isAdmin }),

		// * Initialize user from localStorage
		initializeFromStorage: () => {
			try {
				const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
				if (storedUser && _get().user.name !== storedUser) {
					// Update Supabase client headers for RLS policies
					updateSupabaseUserContext(storedUser);
					updateSlice(set, "user", {
						name: storedUser,
						isLoggedIn: true,
					});
				}
			} catch (error) {
				if (import.meta.env.DEV) {
					console.error("Error reading from localStorage:", error);
				}
			}
		},
	},
});
