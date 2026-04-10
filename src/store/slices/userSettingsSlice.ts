import { STORAGE_KEYS } from "@/shared/lib/constants";
import {
	getStorageString,
	parseJsonValue,
	removeStorageItem,
	setStorageString,
} from "@/shared/lib/storage";
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

	const stored = getStorageString(STORAGE_KEYS.USER);
	if (!stored?.trim()) {
		return base;
	}

	const parsed = parseJsonValue<unknown>(stored, null);
	if (typeof parsed === "string") {
		return { ...base, name: parsed, isLoggedIn: true };
	}

	if (parsed && typeof parsed === "object") {
		const parsedObject = parsed as { name?: unknown; isAdmin?: unknown };
		if (typeof parsedObject.name === "string") {
			return {
				...base,
				name: parsedObject.name,
				isLoggedIn: true,
				isAdmin: Boolean(parsedObject.isAdmin),
			};
		}
	}

	return { ...base, name: stored.trim(), isLoggedIn: true };
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

export const createUserAndSettingsSlice: AppSliceCreator<
	Pick<
		AppState,
		"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
	>
> = (set, get) => ({
	user: getInitialUserState(),

	userActions: {
		setUser: (data) => {
			patch(set, "user", data);
			persistOptionalString(STORAGE_KEYS.USER, data.name ?? get().user.name);
		},

		login: (userName, onContext) => {
			patch(set, "user", { name: userName, isLoggedIn: true });
			setStorageString(STORAGE_KEYS.USER, userName);
			onContext?.(userName);
		},

		logout: (onContext) => {
			removeStorageItem(STORAGE_KEYS.USER);
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

		setAdminStatus: (isAdmin) => patch(set, "user", { isAdmin }),

		setAvatar: (avatarUrl) => {
			patch(set, "user", { avatarUrl });
			persistOptionalString(STORAGE_KEYS.USER_AVATAR, avatarUrl);
		},

		initializeFromStorage: (onContext) => {
			const storedUser = getStorageString(STORAGE_KEYS.USER);
			const storedAvatar = getStorageString(STORAGE_KEYS.USER_AVATAR);
			const updates: Partial<UserState> = {};

			if (storedUser && get().user.name !== storedUser) {
				onContext?.(storedUser);
				updates.name = storedUser;
				updates.isLoggedIn = true;
			}

			if (storedAvatar && get().user.avatarUrl !== storedAvatar) {
				updates.avatarUrl = storedAvatar;
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
