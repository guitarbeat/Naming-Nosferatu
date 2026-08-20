import CryptoJS from "crypto-js";

const isDev = () => import.meta.env?.DEV ?? false;

// Secret key used to encrypt storage values.
// In a real application, this should ideally be derived from a user-specific value or backend secret.
// For client-side storage where the goal is simply to prevent clear-text storage on disk, a static key provides basic obfuscation.
const LEGACY_STORAGE_SECRET_KEY = import.meta.env?.VITE_LEGACY_KEY ?? "";

// Ensure the key is exactly 256 bits (32 bytes)
const legacyKeyHex = CryptoJS.enc.Utf8.parse(
	LEGACY_STORAGE_SECRET_KEY.padEnd(32, "0").substring(0, 32),
);
// Legacy static IV used only as a fallback for decrypting data encrypted before the random-IV migration
const LEGACY_IV = CryptoJS.enc.Utf8.parse("nosferatu-iv-123".padEnd(16, "0"));

const DEVICE_KEY_STORAGE_KEY = "__device_key__";

let cachedDeviceKeyHex: CryptoJS.lib.WordArray | null = null;

function getDeviceEncryptionKey(): CryptoJS.lib.WordArray {
	if (cachedDeviceKeyHex) {
		return cachedDeviceKeyHex;
	}

	try {
		if (typeof window !== "undefined") {
			let keyHexStr = window.localStorage.getItem(DEVICE_KEY_STORAGE_KEY);
			if (!keyHexStr) {
				const newKey = CryptoJS.lib.WordArray.random(32) /* key generation */;
				keyHexStr = CryptoJS.enc.Hex.stringify(newKey);
				window.localStorage.setItem(DEVICE_KEY_STORAGE_KEY, keyHexStr);
			}
			cachedDeviceKeyHex = CryptoJS.enc.Hex.parse(keyHexStr);
			return cachedDeviceKeyHex;
		}
	} catch {
		// Ignore storage errors, will fall through to temporary session key
	}

	// Fallback to a temporary random key for this session if localStorage is unavailable
	cachedDeviceKeyHex = CryptoJS.lib.WordArray.random(32) /* key generation */;
	return cachedDeviceKeyHex;
}

function encrypt(text: string): string {
	const iv = CryptoJS.lib.WordArray.random(16);
	// lgtm[js/insecure-password-hash] False positive: data obfuscation, not hashing a password
	const encrypted = CryptoJS.AES.encrypt(text, getDeviceEncryptionKey(), {
		iv,
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7,
	}).toString();
	const ivHexStr = CryptoJS.enc.Hex.stringify(iv);
	return `${ivHexStr}:${encrypted}`;
}

function decrypt(text: string): string {
	try {
		let iv: CryptoJS.lib.WordArray = LEGACY_IV; // Default static IV for legacy data
		let ciphertext = text;

		// Check for new format with prepended IV (16 bytes = 32 hex chars)
		const colonIndex = text.indexOf(":");
		if (colonIndex === 32) {
			const ivStr = text.slice(0, 32);
			iv = CryptoJS.enc.Hex.parse(ivStr);
			ciphertext = text.slice(33);
		}

		// First try with the device-specific key
		try {
			const bytes = CryptoJS.AES.decrypt(ciphertext, getDeviceEncryptionKey(), {
				iv,
				mode: CryptoJS.mode.CBC,
				padding: CryptoJS.pad.Pkcs7,
			});
			const decrypted = bytes.toString(CryptoJS.enc.Utf8);
			if (decrypted) {
				return decrypted;
			}
		} catch (_error) {
			// Ignore and fallback
		}

		// Fallback to legacy static key for backward compatibility
		try {
			const legacyBytes = CryptoJS.AES.decrypt(ciphertext, legacyKeyHex, {
				iv,
				mode: CryptoJS.mode.CBC,
				padding: CryptoJS.pad.Pkcs7,
			});
			const legacyDecrypted = legacyBytes.toString(CryptoJS.enc.Utf8);
			if (legacyDecrypted) {
				return legacyDecrypted;
			}
		} catch (_error) {
			// Ignore and fallback
		}

		// If all decryption fails or text wasn't encrypted, it might return empty string
		return text; // Fallback to clear text if decryption fails (e.g., legacy unencrypted data)
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

export function getStorageString(
	key: string,
	fallback: string | null = null,
): string | null {
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
			console.error(
				`[storage] Failed to read key "${key}" from localStorage:`,
				error,
			);
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
			console.error(
				`[storage] Failed to write key "${key}" to localStorage:`,
				error,
			);
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
			console.error(
				`[storage] Failed to remove key "${key}" from localStorage:`,
				error,
			);
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
			console.error(
				`[storage] Failed to write key "${key}" to localStorage:`,
				error,
			);
		}
		return false;
	}
}

/**
 * Decrypt a raw encrypted string from localStorage.
 * Useful for decrypting values received via StorageEvent from other tabs.
 */
export function decryptValue(encryptedText: string | null | undefined): string {
	if (encryptedText == null) {
		return "";
	}
	return decrypt(encryptedText);
}
