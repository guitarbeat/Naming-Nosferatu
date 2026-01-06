/**
 * @module storage
 * @description Centralized localStorage service with consistent error handling.
 * Provides type-safe storage operations with automatic JSON serialization.
 */

import { STORAGE_KEYS } from "@/core/constants";
import { devWarn } from "./core";

/**
 * Get a value from localStorage with type safety
 * @param key - Storage key (use STORAGE_KEYS constants)
 * @param defaultValue - Default value if key doesn't exist or parsing fails
 * @returns The stored value or defaultValue
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
	if (typeof window === "undefined") {
		return defaultValue;
	}

	try {
		const item = window.localStorage.getItem(key);
		if (item === null) {
			return defaultValue;
		}
		return JSON.parse(item) as T;
	} catch (error) {
		devWarn(`Failed to read ${key} from localStorage:`, error);
		return defaultValue;
	}
}

/**
 * Set a value in localStorage with type safety
 * @param key - Storage key (use STORAGE_KEYS constants)
 * @param value - Value to store (will be JSON stringified)
 * @returns true if successful, false otherwise
 */
export function setStorageItem<T>(key: string, value: T): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	try {
		window.localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch (error) {
		devWarn(`Failed to write ${key} to localStorage:`, error);
		return false;
	}
}

/**
 * Remove a value from localStorage
 * @param key - Storage key (use STORAGE_KEYS constants)
 * @returns true if successful, false otherwise
 */
export function removeStorageItem(key: string): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	try {
		window.localStorage.removeItem(key);
		return true;
	} catch (error) {
		devWarn(`Failed to remove ${key} from localStorage:`, error);
		return false;
	}
}

/**
 * Get a string value from localStorage (for non-JSON values like theme)
 * @param key - Storage key (use STORAGE_KEYS constants)
 * @param defaultValue - Default value if key doesn't exist
 * @returns The stored string value or defaultValue
 */
export function getStorageString(key: string, defaultValue: string): string {
	if (typeof window === "undefined") {
		return defaultValue;
	}

	try {
		const item = window.localStorage.getItem(key);
		return item ?? defaultValue;
	} catch (error) {
		devWarn(`Failed to read ${key} from localStorage:`, error);
		return defaultValue;
	}
}

/**
 * Set a string value in localStorage (for non-JSON values like theme)
 * @param key - Storage key (use STORAGE_KEYS constants)
 * @param value - String value to store
 * @returns true if successful, false otherwise
 */
export function setStorageString(key: string, value: string): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	try {
		window.localStorage.setItem(key, value);
		return true;
	} catch (error) {
		devWarn(`Failed to write ${key} to localStorage:`, error);
		return false;
	}
}

/**
 * Storage service object with convenience methods
 */
export const storageService = {
	get: getStorageItem,
	set: setStorageItem,
	remove: removeStorageItem,
	getString: getStorageString,
	setString: setStorageString,
	keys: STORAGE_KEYS,
} as const;
