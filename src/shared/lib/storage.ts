import CryptoJS from "crypto-js";

const isDev = () => import.meta.env?.DEV ?? false;

// Secret key used to encrypt storage values.
// In a real application, this should ideally be derived from a user-specific value or backend secret.
// For client-side storage where the goal is simply to prevent clear-text storage on disk, a static key provides basic obfuscation.
const STORAGE_SECRET_KEY = "nosferatu-secure-storage-key-1337";

// Ensure the key is exactly 256 bits (32 bytes)
const keyHex = CryptoJS.enc.Utf8.parse(STORAGE_SECRET_KEY.padEnd(32, "0").substring(0, 32));
// Using a static IV for client-side obfuscation since we just want to avoid plain-text storage
const ivHex = CryptoJS.enc.Utf8.parse("nosferatu-iv-123".padEnd(16, "0"));

function encrypt(text: string): string {
	return CryptoJS.AES.encrypt(text, keyHex, {
		iv: ivHex,
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7,
	}).toString();
}

function decrypt(text: string): string {
	try {
		const bytes = CryptoJS.AES.decrypt(text, keyHex, {
			iv: ivHex,
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7,
		});
		const decrypted = bytes.toString(CryptoJS.enc.Utf8);
		// If decryption fails or text wasn't encrypted, it might return empty string
		if (!decrypted) {
			return text; // Fallback to clear text if decryption fails (e.g., legacy unencrypted data)
		}
		return decrypted;
	} catch (_error) {
		// Fallback to returning original text if decryption errors (e.g., not encrypted)
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
