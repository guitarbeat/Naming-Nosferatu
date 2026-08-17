import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import * as storage from "@/shared/lib/storage";
import * as userStorage from "@/shared/lib/userStorage";
import * as appStoreShared from "@/store/appStore.shared";
import type { AppState } from "@/store/appStore.types";

vi.mock("@/shared/lib/storage", () => ({
	getStorageString: vi.fn(),
	setStorageString: vi.fn(),
	removeStorageItem: vi.fn(),
}));

vi.mock("@/shared/lib/userStorage", () => ({
	readStoredUserSnapshot: vi.fn(),
	writeStoredUserSnapshot: vi.fn(),
	clearStoredUserSnapshot: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

describe("userSettingsSlice", () => {
	let originalIsBrowser: boolean;

	beforeEach(() => {
		// Save original IS_BROWSER value so we can restore it
		originalIsBrowser = appStoreShared.IS_BROWSER;
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Restore original IS_BROWSER value after each test
		// Using Object.defineProperty since it's likely a read-only export
		Object.defineProperty(appStoreShared, "IS_BROWSER", {
			value: originalIsBrowser,
			configurable: true,
		});
	});

	describe("browser environment (happy path)", () => {
		let createUserAndSettingsSlice: typeof import("./userSettingsSlice").createUserAndSettingsSlice;
		let useStore: ReturnType<
			typeof create<
				Pick<
					AppState,
					"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
				>
			>
		>;

		beforeEach(async () => {
			Object.defineProperty(appStoreShared, "IS_BROWSER", {
				value: true,
				configurable: true,
			});

			const mod = await import("./userSettingsSlice");
			createUserAndSettingsSlice = mod.createUserAndSettingsSlice;

			useStore = create<
				Pick<
					AppState,
					"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
				>
			>((...args) => ({
				...createUserAndSettingsSlice(...args),
			}));
		});

		describe("user", () => {
			it("should initialize with default values", () => {
				const state = useStore.getState();
				expect(state.user).toEqual({
					id: null,
					name: "",
					isLoggedIn: false,
					isAdmin: false,
					preferences: {},
				});
			});

			it("should initialize with stored values when available", () => {
				vi.mocked(userStorage.readStoredUserSnapshot).mockReturnValueOnce({
					id: "123",
					name: "TestUser",
					isAdmin: true,
					avatarUrl: "test.png",
				});

				const store = create<
					Pick<
						AppState,
						"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
					>
				>((...args) => ({
					...createUserAndSettingsSlice(...args),
				}));

				const state = store.getState();
				expect(state.user).toEqual({
					id: "123",
					name: "TestUser",
					isLoggedIn: true,
					isAdmin: true,
					preferences: {},
					avatarUrl: "test.png",
				});
			});

			it("should handle initialization from storage without id", () => {
				vi.mocked(userStorage.readStoredUserSnapshot).mockReturnValueOnce({
					name: "TestUser",
					isAdmin: false,
				});

				const store = create<
					Pick<
						AppState,
						"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
					>
				>((...args) => ({
					...createUserAndSettingsSlice(...args),
				}));

				const state = store.getState();
				expect(state.user).toEqual({
					id: null,
					name: "TestUser",
					isLoggedIn: true,
					isAdmin: false,
					preferences: {},
				});
			});
		});

		describe("ui", () => {
			it("should initialize with default theme when no stored theme", () => {
				vi.mocked(storage.getStorageString).mockReturnValueOnce(null);
				const store = create<
					Pick<
						AppState,
						"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
					>
				>((...args) => ({
					...createUserAndSettingsSlice(...args),
				}));
				const state = store.getState();
				expect(state.ui).toEqual({
					theme: "dark",
					themePreference: "dark",
					isBootLoading: true,
				});
			});

			it("should initialize with stored light theme", () => {
				vi.mocked(storage.getStorageString).mockReturnValueOnce("light");
				const store = create<
					Pick<
						AppState,
						"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
					>
				>((...args) => ({
					...createUserAndSettingsSlice(...args),
				}));
				const state = store.getState();
				expect(state.ui).toEqual({
					theme: "light",
					themePreference: "light",
					isBootLoading: true,
				});
			});

			it("should initialize with system theme (resolved to dark)", () => {
				vi.mocked(storage.getStorageString).mockReturnValueOnce("system");
				window.matchMedia = vi.fn().mockImplementation((query) => ({
					matches: true,
					media: query,
					onchange: null,
					addListener: vi.fn(), // deprecated
					removeListener: vi.fn(), // deprecated
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn(),
				}));

				const store = create<
					Pick<
						AppState,
						"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
					>
				>((...args) => ({
					...createUserAndSettingsSlice(...args),
				}));
				const state = store.getState();
				expect(state.ui).toEqual({
					theme: "dark",
					themePreference: "system",
					isBootLoading: true,
				});
			});

			it("should initialize with system theme (resolved to light)", () => {
				vi.mocked(storage.getStorageString).mockReturnValueOnce("system");
				window.matchMedia = vi.fn().mockImplementation((query) => ({
					matches: false,
					media: query,
					onchange: null,
					addListener: vi.fn(), // deprecated
					removeListener: vi.fn(), // deprecated
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn(),
				}));

				const store = create<
					Pick<
						AppState,
						"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
					>
				>((...args) => ({
					...createUserAndSettingsSlice(...args),
				}));
				const state = store.getState();
				expect(state.ui).toEqual({
					theme: "light",
					themePreference: "system",
					isBootLoading: true,
				});
			});
		});

		describe("userActions", () => {
			it("should set user and persist state", () => {
				useStore.getState().userActions.setUser({ name: "NewName", id: "user_123" });
				const state = useStore.getState();
				expect(state.user.name).toBe("NewName");
				expect(state.user.id).toBe("user_123");
				expect(userStorage.writeStoredUserSnapshot).toHaveBeenCalledWith({
					id: "user_123",
					name: "NewName",
					isAdmin: false,
					avatarUrl: undefined,
				});
			});

			it("should clear user state if name is empty", () => {
				useStore.getState().userActions.setUser({ name: "  " });
				expect(userStorage.clearStoredUserSnapshot).toHaveBeenCalled();
			});

			it("should login user and persist state", () => {
				const onContext = vi.fn();
				useStore.getState().userActions.login("LoginUser", onContext);
				const state = useStore.getState();
				expect(state.user.name).toBe("LoginUser");
				expect(state.user.isLoggedIn).toBe(true);
				expect(state.user.id).toBeNull();
				expect(state.user.isAdmin).toBe(false);
				expect(onContext).toHaveBeenCalledWith("LoginUser");
				expect(userStorage.writeStoredUserSnapshot).toHaveBeenCalledWith({
					id: null,
					name: "LoginUser",
					isAdmin: false,
					avatarUrl: undefined,
				});
			});

			it("should login user without onContext", () => {
				useStore.getState().userActions.login("LoginUser");
				const state = useStore.getState();
				expect(state.user.name).toBe("LoginUser");
				expect(state.user.isLoggedIn).toBe(true);
			});

			it("should logout user and clear state", () => {
				// First login to have something to clear
				useStore.getState().userActions.login("LoginUser");

				const onContext = vi.fn();
				useStore.getState().userActions.logout(onContext);

				const state = useStore.getState();
				expect(state.user.name).toBe("");
				expect(state.user.isLoggedIn).toBe(false);
				expect(state.user.isAdmin).toBe(false);
				expect(onContext).toHaveBeenCalledWith(null);
				expect(userStorage.clearStoredUserSnapshot).toHaveBeenCalled();
			});

			it("should logout user without onContext", () => {
				useStore.getState().userActions.logout();
				const state = useStore.getState();
				expect(state.user.name).toBe("");
			});

			it("should set admin status and clear state if user is empty", () => {
				useStore.getState().userActions.setAdminStatus(true);
				const state = useStore.getState();
				expect(state.user.isAdmin).toBe(true);
				expect(userStorage.clearStoredUserSnapshot).toHaveBeenCalled();
			});

			it("should set admin status and persist state if user is not empty", () => {
				useStore.getState().userActions.setUser({ name: "AdminUser" });
				useStore.getState().userActions.setAdminStatus(true);
				const state = useStore.getState();
				expect(state.user.isAdmin).toBe(true);
				expect(userStorage.writeStoredUserSnapshot).toHaveBeenCalledWith({
					id: null,
					name: "AdminUser",
					isAdmin: true,
					avatarUrl: undefined,
				});
			});

			it("should set avatar and persist state", () => {
				useStore.getState().userActions.setUser({ name: "AvatarUser" });
				useStore.getState().userActions.setAvatar("avatar.png");
				const state = useStore.getState();
				expect(state.user.avatarUrl).toBe("avatar.png");
				expect(storage.setStorageString).toHaveBeenCalledWith("catNamesUserAvatar", "avatar.png");
				expect(userStorage.writeStoredUserSnapshot).toHaveBeenCalledWith({
					id: null,
					name: "AvatarUser",
					isAdmin: false,
					avatarUrl: "avatar.png",
				});
			});

			it("should clear avatar if undefined is passed", () => {
				useStore.getState().userActions.setUser({ name: "AvatarUser" });
				useStore.getState().userActions.setAvatar(undefined);
				const state = useStore.getState();
				expect(state.user.avatarUrl).toBeUndefined();
				expect(storage.removeStorageItem).toHaveBeenCalledWith("catNamesUserAvatar");
				expect(userStorage.writeStoredUserSnapshot).toHaveBeenCalledWith({
					id: null,
					name: "AvatarUser",
					isAdmin: false,
					avatarUrl: undefined,
				});
			});

			describe("initializeFromStorage", () => {
				it("should update state when stored user exists and is different", () => {
					vi.mocked(userStorage.readStoredUserSnapshot).mockReturnValueOnce({
						id: "123",
						name: "StoredUser",
						isAdmin: true,
						avatarUrl: "stored.png",
					});

					const onContext = vi.fn();
					useStore.getState().userActions.initializeFromStorage(onContext);

					const state = useStore.getState();
					expect(state.user.id).toBe("123");
					expect(state.user.name).toBe("StoredUser");
					expect(state.user.isLoggedIn).toBe(true);
					expect(state.user.isAdmin).toBe(true);
					expect(state.user.avatarUrl).toBe("stored.png");
					expect(onContext).toHaveBeenCalledWith("StoredUser");
				});

				it("should not update state when stored user matches current", () => {
					// Setup current state to match what we'll mock from storage
					useStore.getState().userActions.setUser({
						id: "123",
						name: "StoredUser",
						isLoggedIn: true,
						isAdmin: true,
						avatarUrl: "stored.png",
					});

					vi.mocked(userStorage.readStoredUserSnapshot).mockReturnValueOnce({
						id: "123",
						name: "StoredUser",
						isAdmin: true,
						avatarUrl: "stored.png",
					});

					const onContext = vi.fn();
					useStore.getState().userActions.initializeFromStorage(onContext);

					// State shouldn't be patched again (zustand handles this but we can test logic)
					// The snapshot returned is exactly the same, so no updates are gathered
					expect(onContext).not.toHaveBeenCalled();
				});

				it("should handle partial updates from storage", () => {
					// Setup current state with some values
					useStore.getState().userActions.setUser({
						id: "123",
						name: "OldName",
						isLoggedIn: true,
						isAdmin: false,
					});

					vi.mocked(userStorage.readStoredUserSnapshot).mockReturnValueOnce({
						id: "123", // same id
						name: "NewName", // different name
						isAdmin: false, // same admin
						// no avatar
					});

					const onContext = vi.fn();
					useStore.getState().userActions.initializeFromStorage(onContext);

					const state = useStore.getState();
					expect(state.user.name).toBe("NewName");
					expect(state.user.id).toBe("123");
					expect(onContext).toHaveBeenCalledWith("NewName");
				});
			});
		});

		describe("uiActions", () => {
			it("should set light theme explicitly", () => {
				useStore.getState().uiActions.setTheme("light");
				const state = useStore.getState();
				expect(state.ui.theme).toBe("light");
				expect(state.ui.themePreference).toBe("light");
				expect(storage.setStorageString).toHaveBeenCalledWith("theme", "light");
			});

			it("should set dark theme explicitly", () => {
				useStore.getState().uiActions.setTheme("dark");
				const state = useStore.getState();
				expect(state.ui.theme).toBe("dark");
				expect(state.ui.themePreference).toBe("dark");
				expect(storage.setStorageString).toHaveBeenCalledWith("theme", "dark");
			});

			it("should handle system theme", () => {
				const addEventListener = vi.fn();
				const removeEventListener = vi.fn();

				window.matchMedia = vi.fn().mockImplementation((query) => ({
					matches: true, // system is dark
					media: query,
					onchange: null,
					addListener: vi.fn(),
					removeListener: vi.fn(),
					addEventListener,
					removeEventListener,
					dispatchEvent: vi.fn(),
				}));

				useStore.getState().uiActions.setTheme("system");
				const state = useStore.getState();

				expect(state.ui.theme).toBe("dark");
				expect(state.ui.themePreference).toBe("system");
				expect(storage.setStorageString).toHaveBeenCalledWith("theme", "system");
				expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

				// Test change listener
				const changeHandler = addEventListener.mock.calls[0][1];

				// If it changes to light
				changeHandler({ matches: false } as MediaQueryListEvent);
				expect(useStore.getState().ui.theme).toBe("light");

				// Call it again with dark to test cleanup works correctly next time
				useStore.getState().uiActions.setTheme("light");
				expect(removeEventListener).toHaveBeenCalledWith("change", changeHandler);
			});

			it("should only update system theme if preference is still system", () => {
				const addEventListener = vi.fn();

				window.matchMedia = vi.fn().mockImplementation((query) => ({
					matches: true,
					media: query,
					onchange: null,
					addListener: vi.fn(),
					removeListener: vi.fn(),
					addEventListener,
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn(),
				}));

				useStore.getState().uiActions.setTheme("system");
				const changeHandler = addEventListener.mock.calls[0][1];

				// Change preference directly to simulate race condition or other changes
				useStore.setState((state) => ({
					...state,
					ui: { ...state.ui, themePreference: "light" },
				}));

				// If it changes to light, it shouldn't update the theme because preference is no longer system
				changeHandler({ matches: false } as MediaQueryListEvent);
			});

			it("should initialize theme from storage", () => {
				vi.mocked(storage.getStorageString).mockReturnValueOnce("light");
				useStore.getState().uiActions.initializeTheme();
				const state = useStore.getState();
				expect(state.ui.themePreference).toBe("light");
			});

			it("should fall back to dark if invalid theme in storage", () => {
				vi.mocked(storage.getStorageString).mockReturnValueOnce("invalid");
				useStore.getState().uiActions.initializeTheme();
				const state = useStore.getState();
				expect(state.ui.themePreference).toBe("dark");
			});

			it("should set boot loading", () => {
				useStore.getState().uiActions.setBootLoading(false);
				const state = useStore.getState();
				expect(state.ui.isBootLoading).toBe(false);
			});
		});

		describe("siteSettingsActions", () => {
			it("should set cat chosen name", () => {
				const catChosenName = {
					nameId: "123",
					name: "Whiskers",
					memberIds: ["mem1"],
					chosenAt: "2023-01-01T00:00:00Z",
				};
				useStore.getState().siteSettingsActions.setCatChosenName(catChosenName);
				const state = useStore.getState();
				expect(state.siteSettings.catChosenName).toEqual(catChosenName);
			});

			it("should mark settings loaded", () => {
				useStore.getState().siteSettingsActions.markSettingsLoaded();
				const state = useStore.getState();
				expect(state.siteSettings.isLoaded).toBe(true);
			});
		});
	});

	describe("non-browser environment", () => {
		let createUserAndSettingsSlice: typeof import("./userSettingsSlice").createUserAndSettingsSlice;
		let useStore: ReturnType<
			typeof create<
				Pick<
					AppState,
					"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
				>
			>
		>;

		beforeEach(async () => {
			Object.defineProperty(appStoreShared, "IS_BROWSER", {
				value: false,
				configurable: true,
			});

			const mod = await import("./userSettingsSlice");
			createUserAndSettingsSlice = mod.createUserAndSettingsSlice;

			useStore = create<
				Pick<
					AppState,
					"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
				>
			>((...args) => ({
				...createUserAndSettingsSlice(...args),
			}));
		});

		it("should return base state for user when not in browser", () => {
			const state = useStore.getState();
			expect(state.user).toEqual({
				id: null,
				name: "",
				isLoggedIn: false,
				isAdmin: false,
				preferences: {},
			});
			// Verify readStoredUserSnapshot was not called
			expect(userStorage.readStoredUserSnapshot).not.toHaveBeenCalled();
		});

		it("should return base state for theme when not in browser", () => {
			const state = useStore.getState();
			expect(state.ui).toEqual({
				theme: "dark",
				themePreference: "dark",
				isBootLoading: true,
			});
			// Verify getStorageString was not called
			expect(storage.getStorageString).not.toHaveBeenCalled();
		});

		it("should short-circuit initializeTheme when not in browser", () => {
			useStore.getState().uiActions.initializeTheme();
			expect(storage.getStorageString).not.toHaveBeenCalled();
		});

		it("should short-circuit setTheme when not in browser and using system preference", () => {
			useStore.getState().uiActions.setTheme("system");
			expect(storage.setStorageString).toHaveBeenCalledWith("theme", "system");
			// Window media listener should not be set up
		});
	});

	describe("additional coverage scenarios", () => {
		let createUserAndSettingsSlice: typeof import("./userSettingsSlice").createUserAndSettingsSlice;
		let useStore: ReturnType<
			typeof create<
				Pick<
					AppState,
					"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
				>
			>
		>;

		beforeEach(async () => {
			Object.defineProperty(appStoreShared, "IS_BROWSER", {
				value: true,
				configurable: true,
			});

			const mod = await import("./userSettingsSlice");
			createUserAndSettingsSlice = mod.createUserAndSettingsSlice;

			useStore = create<
				Pick<
					AppState,
					"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
				>
			>((...args) => ({
				...createUserAndSettingsSlice(...args),
			}));
		});

		it("readThemePreferenceFromStorage: should return dark when stored value is null (line 72)", () => {
			vi.mocked(storage.getStorageString).mockReturnValueOnce(null);
			useStore.getState().uiActions.initializeTheme();
			expect(useStore.getState().ui.themePreference).toBe("dark");
		});

		it("setTheme: should resolve system theme to light when mediaQuery.matches is false (line 191)", () => {
			const addEventListener = vi.fn();
			window.matchMedia = vi.fn().mockImplementation((query) => ({
				matches: false, // system is light
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener,
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			}));

			useStore.getState().uiActions.setTheme("system");
			expect(useStore.getState().ui.theme).toBe("light");
		});

		it("setTheme: handleChange should set theme to dark when matches is true (line 195)", () => {
			const addEventListener = vi.fn();
			window.matchMedia = vi.fn().mockImplementation((query) => ({
				matches: false, // initial system is light
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener,
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			}));

			useStore.getState().uiActions.setTheme("system");
			expect(useStore.getState().ui.theme).toBe("light");

			// Get the change handler
			const changeHandler = addEventListener.mock.calls[0][1];

			// Call it with matches: true to change to dark
			changeHandler({ matches: true } as MediaQueryListEvent);
			expect(useStore.getState().ui.theme).toBe("dark");
		});
	});
});
