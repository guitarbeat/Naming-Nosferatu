import CryptoJS from "crypto-js";
import { STORAGE_KEYS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import type {
	MatchRecord,
	NameItem,
	RatingData,
	Team,
	TournamentMode,
	TournamentState,
	VoteRecord,
} from "@/types";

const DEVICE_KEY_STORAGE_KEY = "__device_key__";

let cachedDeviceKeyHex: CryptoJS.lib.WordArray | null = null;
const memoryFallbackStore = new Map<string, string>();
const decryptionCache = new Map<string, string>();
const MAX_DECRYPT_CACHE = 100;

function isQuotaExceeded(error: unknown): boolean {
	return (
		error instanceof DOMException &&
		(error.code === 22 ||
			error.code === 1014 ||
			error.name === "QuotaExceededError" ||
			error.name === "NS_ERROR_DOM_QUOTA_REACHED")
	);
}

function evictTransientCache(): void {
	try {
		if (typeof window !== "undefined") {
			window.localStorage.removeItem("names_cache_map");
			window.localStorage.removeItem("__storage_test__");
		}
	} catch {
		// Ignore
	}
}

function getDeviceEncryptionKey(): CryptoJS.lib.WordArray {
	if (cachedDeviceKeyHex) {
		return cachedDeviceKeyHex;
	}

	try {
		if (typeof window !== "undefined") {
			// Migrate legacy cleartext key if present in localStorage
			const legacyKey = window.localStorage.getItem(DEVICE_KEY_STORAGE_KEY);
			if (legacyKey && !window.sessionStorage.getItem(DEVICE_KEY_STORAGE_KEY)) {
				window.sessionStorage.setItem(DEVICE_KEY_STORAGE_KEY, legacyKey);
				window.localStorage.removeItem(DEVICE_KEY_STORAGE_KEY);
			}

			let keyHexStr = window.sessionStorage.getItem(DEVICE_KEY_STORAGE_KEY);
			if (!keyHexStr) {
				const newKey = CryptoJS.lib.WordArray.random(32) /* key generation */;
				keyHexStr = CryptoJS.enc.Hex.stringify(newKey);
				window.sessionStorage.setItem(DEVICE_KEY_STORAGE_KEY, keyHexStr);
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
	const result = `${ivHexStr}:${encrypted}`;
	if (decryptionCache.size >= MAX_DECRYPT_CACHE) {
		const firstKey = decryptionCache.keys().next().value;
		if (firstKey) {
			decryptionCache.delete(firstKey);
		}
	}
	decryptionCache.set(result, text);
	return result;
}

function decrypt(text: string): string {
	if (!text) {
		return "";
	}
	const cached = decryptionCache.get(text);
	if (cached !== undefined) {
		return cached;
	}

	try {
		// Check for prepended IV (16 bytes = 32 hex chars)
		const colonIndex = text.indexOf(":");
		if (colonIndex === 32) {
			const ivStr = text.slice(0, 32);
			const iv = CryptoJS.enc.Hex.parse(ivStr);
			const ciphertext = text.slice(33);

			try {
				const bytes = CryptoJS.AES.decrypt(
					ciphertext,
					getDeviceEncryptionKey(),
					{
						iv,
						mode: CryptoJS.mode.CBC,
						padding: CryptoJS.pad.Pkcs7,
					},
				);
				const decrypted = bytes.toString(CryptoJS.enc.Utf8);
				if (decrypted) {
					if (decryptionCache.size > MAX_DECRYPT_CACHE) {
						const firstKey = decryptionCache.keys().next().value;
						if (firstKey) {
							decryptionCache.delete(firstKey);
						}
					}
					decryptionCache.set(text, decrypted);
					return decrypted;
				}
			} catch (_error) {
				// Ignore and fallback
			}
		}

		// If missing prepended IV or decryption failed, treat as unencrypted plaintext
		if (decryptionCache.size > MAX_DECRYPT_CACHE) {
			const firstKey = decryptionCache.keys().next().value;
			if (firstKey) {
				decryptionCache.delete(firstKey);
			}
		}
		decryptionCache.set(text, text);
		return text;
	} catch (_error) {
		// Fallback to returning original text if decryption errors
		return text;
	}
}

// Export internal cachedDeviceKeyHex for testing purposes so tests can reset module state
export function resetStorageModuleCache(): void {
	cachedDeviceKeyHex = null;
}

export function getStorageString(
	key: string,
	fallback: string | null = null,
): string | null {
	if (!isStorageAvailable()) {
		const memVal = memoryFallbackStore.get(key);
		return memVal === undefined ? fallback : decrypt(memVal);
	}

	try {
		const value = window.localStorage.getItem(key);
		if (value === null) {
			const memVal = memoryFallbackStore.get(key);
			return memVal === undefined ? fallback : decrypt(memVal);
		}
		return decrypt(value);
	} catch (error) {
		logger.error(
			`[storage] Failed to read key "${key}" from localStorage:`,
			error,
		);
		const memVal = memoryFallbackStore.get(key);
		return memVal === undefined ? fallback : decrypt(memVal);
	}
}

export function setStorageString(key: string, value: string): boolean {
	try {
		const encryptedValue = encrypt(value);
		if (isStorageAvailable()) {
			try {
				window.localStorage.setItem(key, encryptedValue);
				memoryFallbackStore.set(key, encryptedValue);
				return true;
			} catch (writeError) {
				if (isQuotaExceeded(writeError)) {
					evictTransientCache();
					try {
						window.localStorage.setItem(key, encryptedValue);
						memoryFallbackStore.set(key, encryptedValue);
						return true;
					} catch {
						// Fallback to in-memory store
						memoryFallbackStore.set(key, encryptedValue);
						return true;
					}
				}
				memoryFallbackStore.set(key, encryptedValue);
				return true;
			}
		}

		memoryFallbackStore.set(key, encryptedValue);
		return true;
	} catch (error) {
		logger.error(`[storage] Failed to write key "${key}":`, error);
		return false;
	}
}

export function removeStorageItem(key: string): void {
	memoryFallbackStore.delete(key);
	if (!isStorageAvailable()) {
		return;
	}

	try {
		window.localStorage.removeItem(key);
	} catch (error) {
		logger.error(
			`[storage] Failed to remove key "${key}" from localStorage:`,
			error,
		);
	}
}

export function parseJsonValue<T>(value: string | null, fallback: T): T {
	if (value === null) {
		return fallback;
	}

	try {
		return JSON.parse(value) as T;
	} catch (error) {
		logger.error("[storage] Failed to parse JSON from localStorage:", error);
		return fallback;
	}
}

function readStorageJson<T>(key: string, fallback: T): T {
	return parseJsonValue<T>(getStorageString(key), fallback);
}

export function writeStorageJson<T>(key: string, value: T): boolean {
	try {
		return setStorageString(key, JSON.stringify(value));
	} catch (error) {
		logger.error(
			`[storage] Failed to write key "${key}" to localStorage:`,
			error,
		);
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

// Stored user storage snapshot helpers consolidated from userStorage.ts
interface StoredUserSnapshot {
	id?: string | null;
	name: string;
	isAdmin?: boolean;
	avatarUrl?: string;
	email?: string;
}

function normalizeStoredUserSnapshot(
	value: unknown,
): StoredUserSnapshot | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const candidate = value as Record<string, unknown>;
	const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
	if (!name) {
		return null;
	}

	return {
		id:
			typeof candidate.id === "string"
				? candidate.id
				: candidate.id === null
					? null
					: undefined,
		name,
		isAdmin:
			typeof candidate.isAdmin === "boolean" ? candidate.isAdmin : undefined,
		avatarUrl:
			typeof candidate.avatarUrl === "string" ? candidate.avatarUrl : undefined,
		email: typeof candidate.email === "string" ? candidate.email : undefined,
	};
}

export function readStoredUserSnapshot(): StoredUserSnapshot | null {
	if (!isStorageAvailable()) {
		return null;
	}

	const structuredSnapshot = normalizeStoredUserSnapshot(
		readStorageJson<unknown>(STORAGE_KEYS.USER_STORAGE, null),
	);
	if (structuredSnapshot) {
		return structuredSnapshot;
	}
	clearStoredUserSnapshot();
	return null;
}

export function writeStoredUserSnapshot(
	snapshot: StoredUserSnapshot | null,
): void {
	if (!isStorageAvailable()) {
		return;
	}

	const normalizedSnapshot = normalizeStoredUserSnapshot(snapshot);
	if (!normalizedSnapshot) {
		clearStoredUserSnapshot();
		return;
	}

	writeStorageJson(STORAGE_KEYS.USER_STORAGE, normalizedSnapshot);
	setStorageString(STORAGE_KEYS.USER, normalizedSnapshot.name);

	if (normalizedSnapshot.id) {
		setStorageString(STORAGE_KEYS.USER_ID, normalizedSnapshot.id);
	} else {
		removeStorageItem(STORAGE_KEYS.USER_ID);
	}

	if (normalizedSnapshot.avatarUrl) {
		setStorageString(STORAGE_KEYS.USER_AVATAR, normalizedSnapshot.avatarUrl);
	} else {
		removeStorageItem(STORAGE_KEYS.USER_AVATAR);
	}
}

export function clearStoredUserSnapshot(): void {
	if (!isStorageAvailable()) {
		return;
	}

	removeStorageItem(STORAGE_KEYS.USER);
	removeStorageItem(STORAGE_KEYS.USER_ID);
	removeStorageItem(STORAGE_KEYS.USER_AVATAR);
	removeStorageItem(STORAGE_KEYS.USER_STORAGE);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Stored Tournament Snapshot
// ═══════════════════════════════════════════════════════════════════════════════

export type StoredTournamentSnapshot = Omit<TournamentState, "isLoading">;

function normalizeStoredTournamentSnapshot(
	value: unknown,
): StoredTournamentSnapshot | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const candidate = value as Record<string, unknown>;
	const names = Array.isArray(candidate.names)
		? (candidate.names as NameItem[])
		: null;
	const ratings: Record<string, RatingData> = {};
	if (candidate.ratings && typeof candidate.ratings === "object") {
		for (const [key, val] of Object.entries(
			candidate.ratings as Record<string, unknown>,
		)) {
			if (typeof val === "number") {
				ratings[key] = { rating: val, wins: 0, losses: 0 };
			} else if (
				val &&
				typeof val === "object" &&
				typeof (val as RatingData).rating === "number"
			) {
				ratings[key] = {
					rating: (val as RatingData).rating,
					wins:
						typeof (val as RatingData).wins === "number"
							? (val as RatingData).wins
							: 0,
					losses:
						typeof (val as RatingData).losses === "number"
							? (val as RatingData).losses
							: 0,
				};
			}
		}
	}
	const isComplete = Boolean(candidate.isComplete);
	const voteHistory = Array.isArray(candidate.voteHistory)
		? (candidate.voteHistory as VoteRecord[])
		: [];
	const selectedNames = Array.isArray(candidate.selectedNames)
		? (candidate.selectedNames as NameItem[])
		: [];
	const matchHistory = Array.isArray(candidate.matchHistory)
		? (candidate.matchHistory as MatchRecord[])
		: undefined;
	const currentRound =
		typeof candidate.currentRound === "number"
			? candidate.currentRound
			: undefined;
	const currentMatch =
		typeof candidate.currentMatch === "number"
			? candidate.currentMatch
			: undefined;
	const totalMatches =
		typeof candidate.totalMatches === "number"
			? candidate.totalMatches
			: undefined;
	const mode =
		candidate.mode === "1v1" || candidate.mode === "2v2"
			? (candidate.mode as TournamentMode)
			: undefined;
	const teams = Array.isArray(candidate.teams)
		? (candidate.teams as Team[])
		: undefined;
	const bracketEntrants = Array.isArray(candidate.bracketEntrants)
		? (candidate.bracketEntrants as string[])
		: undefined;
	const lastUpdated =
		typeof candidate.lastUpdated === "number"
			? candidate.lastUpdated
			: Date.now();

	// If snapshot is empty, treat as no stored tournament
	if (
		!names &&
		selectedNames.length === 0 &&
		Object.keys(ratings).length === 0 &&
		voteHistory.length === 0 &&
		(!matchHistory || matchHistory.length === 0)
	) {
		return null;
	}

	return {
		names,
		ratings,
		isComplete,
		voteHistory,
		selectedNames,
		matchHistory,
		currentRound,
		currentMatch,
		totalMatches,
		mode,
		teams,
		bracketEntrants,
		lastUpdated,
	};
}

export function readStoredTournamentSnapshot(): StoredTournamentSnapshot | null {
	if (!isStorageAvailable()) {
		return null;
	}

	const structuredSnapshot = normalizeStoredTournamentSnapshot(
		readStorageJson<unknown>(STORAGE_KEYS.TOURNAMENT, null),
	);
	return structuredSnapshot;
}

export function writeStoredTournamentSnapshot(
	snapshot: StoredTournamentSnapshot | null,
): void {
	if (!isStorageAvailable()) {
		return;
	}

	const normalizedSnapshot = normalizeStoredTournamentSnapshot(snapshot);
	if (!normalizedSnapshot) {
		clearStoredTournamentSnapshot();
		return;
	}

	writeStorageJson(STORAGE_KEYS.TOURNAMENT, normalizedSnapshot);
}

export function clearStoredTournamentSnapshot(): void {
	if (!isStorageAvailable()) {
		return;
	}

	removeStorageItem(STORAGE_KEYS.TOURNAMENT);
}
function isStorageAvailable() {
	try {
		const key = "__storage_test__";
		window.localStorage.setItem(key, key);
		window.localStorage.removeItem(key);
		return true;
	} catch (_e) {
		return false;
	}
}
