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

export function setStorageString(key: string, value: string): boolean {
        if (!isStorageAvailable()) {
                return false;
        }

        try {
                window.localStorage.setItem(key, value);
                return true;
        } catch (error) {
                console.error(`[storage] Failed to write key "${key}" to localStorage:`, error);
                return false;
        }
}

export function removeStorageItem(key: string): void {
        if (!isStorageAvailable()) {
                return;
        }

        try {
                window.localStorage.removeItem(key);
        } catch (error) {
                console.error(`[storage] Failed to remove key "${key}" from localStorage:`, error);
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

export function writeStorageJson<T>(key: string, value: T): boolean {
        if (!isStorageAvailable()) {
                return false;
        }

        try {
                window.localStorage.setItem(key, JSON.stringify(value));
                return true;
        } catch (error) {
                console.error(`[storage] Failed to write key "${key}" to localStorage:`, error);
                return false;
        }
}
