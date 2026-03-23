export function isStorageAvailable(): boolean {
        try {
                return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
        } catch {
                return false;
        }
}

export function getStorageString(key: string, fallback: string | null = null): string | null {
        if (!isStorageAvailable()) {
                return fallback;
        }

        try {
                return window.localStorage.getItem(key);
        } catch {
                return fallback;
        }
}

export function setStorageString(key: string, value: string): void {
        if (!isStorageAvailable()) {
                return;
        }

        try {
                window.localStorage.setItem(key, value);
        } catch {
                /* quota or privacy-mode errors */
        }
}

export function removeStorageItem(key: string): void {
        if (!isStorageAvailable()) {
                return;
        }

        try {
                window.localStorage.removeItem(key);
        } catch {
                /* quota or privacy-mode errors */
        }
}

export function parseJsonValue<T>(value: string | null, fallback: T): T {
        if (value === null) {
                return fallback;
        }

        try {
                return JSON.parse(value) as T;
        } catch {
                return fallback;
        }
}

export function readStorageJson<T>(key: string, fallback: T): T {
        return parseJsonValue<T>(getStorageString(key), fallback);
}

export function writeStorageJson<T>(key: string, value: T): void {
        if (!isStorageAvailable()) {
                return;
        }

        try {
                window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
                /* quota or privacy-mode errors */
        }
}

/**
 * Clears all user-identity and session data from localStorage.
 *
 * Policy:
 *   CLEARED  — user identity / session / per-user data
 *   KEPT     — device preferences (theme, sound, UI layout)
 *
 * Call from every logout path so they share a single source of truth.
 */
export function clearUserStorage(): void {
        // Explicit list of keys that belong to the user's session/identity.
        // Device-preference keys (THEME, SWIPE_MODE, SOUND_*, MUSIC_VOLUME,
        // EFFECTS_VOLUME, *_COLLAPSED, NAVBAR_COLLAPSED) are intentionally
        // preserved so the device experience survives account switches.
        const USER_DATA_KEYS = [
                "catNamesUser",
                "catNamesUserId",
                "catNamesUserAvatar",
                "tournament-storage",
                "user-storage",
                "ratings_fallback",
        ];

        for (const key of USER_DATA_KEYS) {
                removeStorageItem(key);
        }
}
