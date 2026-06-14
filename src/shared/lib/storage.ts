import { isDev } from "@/store/appStore.shared";

export function isStorageAvailable(): boolean {
	try {
		const testKey = "__storage_test__";
		window.localStorage.setItem(testKey, testKey);
		window.localStorage.removeItem(testKey);
		return true;
	} catch (e) {
		return false;
	}
}

export function getStorageString(key: string): string | null {
	if (!isStorageAvailable()) {
		return null;
	}
	try {
		return window.localStorage.getItem(key);
	} catch (error) {
		if (isDev()) {
			console.error(`[storage] Failed to read key "${key}" from localStorage:`, error);
		}
		return null;
	}
}

export function setStorageString(key: string, value: string): boolean {
	if (!isStorageAvailable()) {
		return false;
	}

	try {
		// lgtm [js/clear-text-storage-of-sensitive-data]
		// codeql[js/clear-text-storage-of-sensitive-data] false positive
		window.localStorage.setItem(key, value);
		return true;
	} catch (error) {
		if (isDev()) {
			console.error(`[storage] Failed to write key "${key}" to localStorage:`, error);
		}
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
		if (isDev()) {
			console.error(`[storage] Failed to remove key "${key}" from localStorage:`, error);
		}
	}
}

function parseJsonValue<T>(value: string | null, fallback: T): T {
	if (!value) {
		return fallback;
	}

	try {
		return JSON.parse(value) as T;
	} catch (error) {
		if (isDev()) {
			console.error("[storage] Failed to parse JSON from localStorage:", error);
		}
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
		// lgtm [js/clear-text-storage-of-sensitive-data]
		// codeql[js/clear-text-storage-of-sensitive-data] false positive
		window.localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch (error) {
		if (isDev()) {
			console.error(`[storage] Failed to write key "${key}" to localStorage:`, error);
		}
		return false;
	}
}
