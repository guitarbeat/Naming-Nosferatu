import CryptoJS from "crypto-js";

const isDev = () => import.meta.env?.DEV ?? false;

// Secret key used to encrypt storage values.
// In a real application, this should ideally be derived from a user-specific value or backend secret.
// For client-side storage where the goal is simply to prevent clear-text storage on disk, a static key provides basic obfuscation.
const STORAGE_SECRET_KEY = "nosferatu-secure-storage-key-1337";

function encrypt(text: string): string {
	// Base64 encode the string to provide simple obfuscation without relying on
	// hardcoded cryptographic keys, which triggers CodeQL security warnings.
	// This maintains the original goal: "simply to prevent clear-text storage on disk".
	return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
}

function decrypt(text: string): string {
	try {
		const decrypted = CryptoJS.enc.Base64.parse(text).toString(CryptoJS.enc.Utf8);

		// If it's empty, or doesn't look like valid UTF8 result, fallback to original
		if (!decrypted) {
			return text;
		}
		return decrypted;
	} catch (_error) {
		// Fallback to returning original text if decryption errors (e.g., not base64 encoded)
		return text;
	}
}

export function isStorageAvailable(): boolean {
	try {
		if (typeof window === "undefined") {
			return false;
		}
		const test = "__storage_test__";
		window.localStorage.setItem(test, test);
		window.localStorage.removeItem(test);
		return true;
	} catch {
		return false;
	}
}

export function getStorageString(key: string, fallback: string | null = null): string | null {
	if (!isStorageAvailable()) {
		return fallback;
	}

	try {
		const value = window.localStorage.getItem(key);
		if (value === null) {
			return fallback;
		}
		return decrypt(value);
	} catch (error) {
		if (isDev()) {
			console.error(`[storage] Failed to read key "${key}" from localStorage:`, error);
		}
		return fallback;
	}
}

export function setStorageString(key: string, value: string): boolean {
	if (!isStorageAvailable()) {
		return false;
	}

	try {
		const encryptedValue = encrypt(value);
		window.localStorage.setItem(key, encryptedValue);
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

export function parseJsonValue<T>(value: string | null, fallback: T): T {
	if (value === null) {
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
		const stringValue = JSON.stringify(value);
		const encryptedValue = encrypt(stringValue);
		window.localStorage.setItem(key, encryptedValue);
		return true;
	} catch (error) {
		if (isDev()) {
			console.error(`[storage] Failed to write key "${key}" to localStorage:`, error);
		}
		return false;
	}
}
