import { STORAGE_KEYS } from "@/shared/lib/constants";
import { getStorageString, removeStorageItem, setStorageString } from "@/shared/lib/storage";
import {
	clearStoredUserSnapshot,
	readStoredUserSnapshot,
	writeStoredUserSnapshot,
} from "@/shared/lib/userStorage";
import type { ThemePreference, ThemeValue, UIState, UserState } from "@/shared/types";
import { type AppSliceCreator, IS_BROWSER, patch } from "@/store/appStore.shared";
import type { AppState } from "@/store/appStore.types";

let systemThemeCleanup: (() => void) | null = null;

function getInitialUserState(): UserState {
	const base: UserState = {
		id: null,
		name: "",
		isLoggedIn: false,
		isAdmin: false,
		preferences: {},
	};

	if (!IS_BROWSER) {
		return base;
	}

	const storedSnapshot = readStoredUserSnapshot();
	if (!storedSnapshot) {
		return base;
	}

	return {
		...base,
		id: storedSnapshot.id ?? null,
		name: storedSnapshot.name,
		isLoggedIn: true,
		isAdmin: Boolean(storedSnapshot.isAdmin),
		avatarUrl: storedSnapshot.avatarUrl,
	};
}

function getInitialTheme(): Pick<UIState, "theme" | "themePreference"> {
	if (!IS_BROWSER) {
		return { theme: "dark", themePreference: "dark" };
	}

	const stored = getStorageString(STORAGE_KEYS.THEME);
	if (stored === "light" || stored === "dark" || stored === "system") {
		const resolved: ThemeValue =
			stored === "system"
				? window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light"
				: stored;

		return { theme: resolved, themePreference: stored };
	}

	return { theme: "dark", themePreference: "dark" };
}

function getInitialSwipeMode(): boolean {
	if (!IS_BROWSER) {
		return false;
	}

	const stored = getStorageString(STORAGE_KEYS.SWIPE_MODE);
	if (stored !== null) {
		return stored === "true";
	}

	return window.matchMedia("(max-width: 768px)").matches;
}

function persistOptionalString(key: string, value: string | undefined): void {
	if (value) {
		setStorageString(key, value);
		return;
	}

	removeStorageItem(key);
}

function readThemePreferenceFromStorage(): ThemePreference {
	const stored = getStorageString(STORAGE_KEYS.THEME) ?? "dark";
	return ["light", "dark", "system"].includes(stored) ? (stored as ThemePreference) : "dark";
}

function persistUserState(user: UserState): void {
	if (!user.name.trim()) {
		clearStoredUserSnapshot();
		return;
	}

	writeStoredUserSnapshot({
		id: user.id,
		name: user.name,
		isAdmin: user.isAdmin,
		avatarUrl: user.avatarUrl,
	});
}

export const createUserAndSettingsSlice: AppSliceCreator<
	Pick<
		AppState,
		"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
	>
> = (set, get) => ({
	user: getInitialUserState(),

	userActions: {
		setUser: (data) => {
			const nextUser = { ...get().user, ...data };
			patch(set, "user", data);
			persistUserState(nextUser);
		},

		login: (userName, onContext) => {
			const nextUser = {
				...get().user,
				id: null,
				name: userName,
				isLoggedIn: true,
				isAdmin: false,
			};
			patch(set, "user", nextUser);
			persistUserState(nextUser);
			onContext?.(userName);
		},

		logout: (onContext) => {
			clearStoredUserSnapshot();
			onContext?.(null);
			set((state) => ({
				...state,
				user: { ...state.user, name: "", isLoggedIn: false, isAdmin: false },
				tournament: {
					...state.tournament,
					names: null,
					isComplete: false,
				},
			}));
		},

		setAdminStatus: (isAdmin) => {
			const nextUser = { ...get().user, isAdmin };
			patch(set, "user", { isAdmin });
			persistUserState(nextUser);
		},

		setAvatar: (avatarUrl) => {
			const nextUser = { ...get().user, avatarUrl };
			patch(set, "user", { avatarUrl });
			persistOptionalString(STORAGE_KEYS.USER_AVATAR, avatarUrl);
			persistUserState(nextUser);
		},

		initializeFromStorage: (onContext) => {
			const storedUser = readStoredUserSnapshot();
			const updates: Partial<UserState> = {};

			if (storedUser && get().user.name !== storedUser.name) {
				onContext?.(storedUser.name);
				updates.name = storedUser.name;
				updates.isLoggedIn = true;
			}

			if (storedUser?.id && get().user.id !== storedUser.id) {
				updates.id = storedUser.id;
			}

			if (storedUser && get().user.isAdmin !== Boolean(storedUser.isAdmin)) {
				updates.isAdmin = Boolean(storedUser.isAdmin);
			}

			if (storedUser?.avatarUrl && get().user.avatarUrl !== storedUser.avatarUrl) {
				updates.avatarUrl = storedUser.avatarUrl;
			}

			if (Object.keys(updates).length > 0) {
				patch(set, "user", updates);
			}
		},
	},

	ui: {
		...getInitialTheme(),
		isBootLoading: true,
		showGlobalAnalytics: false,
		showUserComparison: false,
		matrixMode: false,
		isSwipeMode: getInitialSwipeMode(),
		showCatPictures: true,
		isEditingProfile: false,
		isProfileOpen: false,
		isSuggestionOpen: false,
	},

	uiActions: {
		setTheme: (preference) => {
			systemThemeCleanup?.();
			systemThemeCleanup = null;

			let resolved: ThemeValue;

			if (preference === "system" && IS_BROWSER) {
				const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
				resolved = mediaQuery.matches ? "dark" : "light";

				const handleChange = (event: MediaQueryListEvent) => {
					if (get().ui.themePreference === "system") {
						patch(set, "ui", { theme: event.matches ? "dark" : "light" });
					}
				};

				mediaQuery.addEventListener("change", handleChange);
				systemThemeCleanup = () => mediaQuery.removeEventListener("change", handleChange);
			} else {
				resolved = preference === "light" ? "light" : "dark";
			}

			patch(set, "ui", { theme: resolved, themePreference: preference });
			setStorageString(STORAGE_KEYS.THEME, preference);
		},

		initializeTheme: () => {
			if (!IS_BROWSER) {
				return;
			}

			get().uiActions.setTheme(readThemePreferenceFromStorage());
		},

		setBootLoading: (loading) => patch(set, "ui", { isBootLoading: loading }),
		setMatrixMode: (enabled) => patch(set, "ui", { matrixMode: enabled }),
		setGlobalAnalytics: (show) => patch(set, "ui", { showGlobalAnalytics: show }),

		setSwipeMode: (enabled) => {
			patch(set, "ui", { isSwipeMode: enabled });
			setStorageString(STORAGE_KEYS.SWIPE_MODE, String(enabled));
		},

		setCatPictures: (show) => patch(set, "ui", { showCatPictures: show }),
		setUserComparison: (show) => patch(set, "ui", { showUserComparison: show }),
		setEditingProfile: (editing) => patch(set, "ui", { isEditingProfile: editing }),
		setProfileOpen: (open) => patch(set, "ui", { isProfileOpen: open }),
		setSuggestionOpen: (open) => patch(set, "ui", { isSuggestionOpen: open }),
	},

	siteSettings: {
		catChosenName: null,
		isLoaded: false,
	},

	siteSettingsActions: {
		setCatChosenName: (data) => patch(set, "siteSettings", { catChosenName: data }),
		markSettingsLoaded: () => patch(set, "siteSettings", { isLoaded: true }),
	},
});
