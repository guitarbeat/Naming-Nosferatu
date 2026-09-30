import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../lib/constants";
import { getStorageString, setStorageString } from "../lib/storage";
import useAppStore from "./index";

describe("User Store Actions", () => {
	beforeEach(() => {
		useAppStore.getState().userActions.logout();
	});

	it("generates a secure user ID using UUID format upon login", () => {
		useAppStore.getState().userActions.login("TestUser");
		const user = useAppStore.getState().user;

		expect(user.isLoggedIn).toBe(true);
		expect(user.name).toBe("TestUser");
		expect(user.id).toMatch(/^user_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
	});
});

describe("UI Store Actions", () => {
	const originalMatchMedia = window.matchMedia;

	beforeEach(() => {
		localStorage.clear();
		useAppStore.getState().uiActions.setBootLoading(true);
		useAppStore.getState().uiActions.setTheme("dark");
	});

	afterEach(() => {
		window.matchMedia = originalMatchMedia;
		localStorage.clear();
	});

	it("sets light and dark themes and persists to storage", () => {
		const { uiActions } = useAppStore.getState();

		uiActions.setTheme("light");
		let ui = useAppStore.getState().ui;
		expect(ui.theme).toBe("light");
		expect(ui.themePreference).toBe("light");
		expect(getStorageString(STORAGE_KEYS.THEME)).toBe("light");

		uiActions.setTheme("dark");
		ui = useAppStore.getState().ui;
		expect(ui.theme).toBe("dark");
		expect(ui.themePreference).toBe("dark");
		expect(getStorageString(STORAGE_KEYS.THEME)).toBe("dark");
	});

	it("handles system theme preference with addEventListener change handler and cleanup", () => {
		let changeListener: ((e: { matches: boolean }) => void) | null = null;
		const removeEventListenerSpy = vi.fn();

		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: query.includes("dark"),
			media: query,
			onchange: null,
			addEventListener: vi.fn((event: string, handler: (e: { matches: boolean }) => void) => {
				if (event === "change") {
					changeListener = handler;
				}
			}),
			removeEventListener: removeEventListenerSpy,
			dispatchEvent: vi.fn(),
		})) as unknown as typeof window.matchMedia;

		const { uiActions } = useAppStore.getState();

		uiActions.setTheme("system");
		const initialUi = useAppStore.getState().ui;

		expect(initialUi.themePreference).toBe("system");
		expect(initialUi.theme).toBe("dark");
		expect(getStorageString(STORAGE_KEYS.THEME)).toBe("system");
		expect(changeListener).not.toBeNull();

		// Simulate system preference change to light mode
		if (changeListener) {
			(changeListener as (e: { matches: boolean }) => void)({ matches: false });
		}
		let ui = useAppStore.getState().ui;
		expect(ui.theme).toBe("light");

		// Simulate system preference change back to dark mode
		if (changeListener) {
			(changeListener as (e: { matches: boolean }) => void)({ matches: true });
		}
		ui = useAppStore.getState().ui;
		expect(ui.theme).toBe("dark");

		// Switch theme away from system to trigger cleanup function
		uiActions.setTheme("light");
		expect(removeEventListenerSpy).toHaveBeenCalledWith("change", changeListener);
	});

	it("supports system theme preference with legacy addListener / removeListener fallback", () => {
		let legacyListener: ((e: { matches: boolean }) => void) | null = null;
		const removeListenerSpy = vi.fn();

		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn((handler: (e: { matches: boolean }) => void) => {
				legacyListener = handler;
			}),
			removeListener: removeListenerSpy,
			addEventListener: undefined,
			removeEventListener: undefined,
			dispatchEvent: vi.fn(),
		})) as unknown as typeof window.matchMedia;

		const { uiActions } = useAppStore.getState();

		uiActions.setTheme("system");
		const ui = useAppStore.getState().ui;

		expect(ui.themePreference).toBe("system");
		expect(ui.theme).toBe("light");
		expect(legacyListener).not.toBeNull();

		// Switch theme away to verify legacy cleanup
		uiActions.setTheme("dark");
		expect(removeListenerSpy).toHaveBeenCalledWith(legacyListener);
	});

	it("gracefully handles error during system theme preference initialization", () => {
		window.matchMedia = vi.fn().mockImplementation(() => {
			throw new Error("matchMedia error");
		}) as unknown as typeof window.matchMedia;

		const { uiActions } = useAppStore.getState();

		expect(() => uiActions.setTheme("system")).not.toThrow();
		const ui = useAppStore.getState().ui;
		expect(ui.themePreference).toBe("system");
		expect(ui.theme).toBe("dark");
	});

	it("initializes theme preference from local storage", () => {
		setStorageString(STORAGE_KEYS.THEME, "light");

		const { uiActions } = useAppStore.getState();
		uiActions.initializeTheme();

		const ui = useAppStore.getState().ui;
		expect(ui.themePreference).toBe("light");
		expect(ui.theme).toBe("light");
	});

	it("sets boot loading status", () => {
		const { uiActions } = useAppStore.getState();

		uiActions.setBootLoading(false);
		let ui = useAppStore.getState().ui;
		expect(ui.isBootLoading).toBe(false);

		uiActions.setBootLoading(true);
		ui = useAppStore.getState().ui;
		expect(ui.isBootLoading).toBe(true);
	});
});
