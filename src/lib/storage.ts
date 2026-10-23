import { logger, STORAGE_KEYS } from "@/lib/utils";
import type {
	MatchRecord,
	NameItem,
	RatingData,
	Team,
	TournamentMode,
	TournamentState,
	VoteRecord,
} from "@/types";

const memoryFallbackStore = new Map<string, string>();

function isStorageAvailable(): boolean {
	try {
		if (typeof window === "undefined" || !window.localStorage) {
			return false;
		}
		const key = "__storage_test__";
		window.localStorage.setItem(key, key);
		window.localStorage.removeItem(key);
		return true;
	} catch {
		return false;
	}
}

export function resetStorageModuleCache(): void {
	memoryFallbackStore.clear();
}

export function getStorageString(key: string, fallback: string | null = null): string | null {
	if (!isStorageAvailable()) {
		const memVal = memoryFallbackStore.get(key);
		return memVal === undefined ? fallback : memVal;
	}

	try {
		const value = window.localStorage.getItem(key);
		if (value === null) {
			const memVal = memoryFallbackStore.get(key);
			return memVal === undefined ? fallback : memVal;
		}
		return value;
	} catch (error) {
		logger.error(`[storage] Failed to read key "${key}" from localStorage:`, error);
		const memVal = memoryFallbackStore.get(key);
		return memVal === undefined ? fallback : memVal;
	}
}

export function setStorageString(key: string, value: string): boolean {
	memoryFallbackStore.set(key, value);
	if (!isStorageAvailable()) {
		return true;
	}

	try {
		window.localStorage.setItem(key, value);
		return true;
	} catch (error) {
		logger.error(`[storage] Failed to write key "${key}" to localStorage:`, error);
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
		logger.error(`[storage] Failed to remove key "${key}" from localStorage:`, error);
	}
}

export function parseJsonValue<T>(value: string | null | undefined, fallback: T): T {
	if (!value) {
		return fallback;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return fallback;
	}

	const firstChar = trimmed[0];
	if (
		firstChar !== "{" &&
		firstChar !== "[" &&
		firstChar !== '"' &&
		firstChar !== "t" &&
		firstChar !== "f" &&
		firstChar !== "n" &&
		firstChar !== "-" &&
		(firstChar < "0" || firstChar > "9")
	) {
		return fallback;
	}

	try {
		return JSON.parse(trimmed) as T;
	} catch {
		return fallback;
	}
}

function readStorageJson<T>(key: string, fallback: T): T {
	const rawValue = getStorageString(key);
	const parsed = parseJsonValue<T>(rawValue, fallback);
	if (rawValue && parsed === fallback) {
		removeStorageItem(key);
	}
	return parsed;
}

export function writeStorageJson<T>(key: string, value: T): boolean {
	try {
		return setStorageString(key, JSON.stringify(value));
	} catch (error) {
		logger.error(`[storage] Failed to write key "${key}" to localStorage:`, error);
		return false;
	}
}

export function decryptValue(text: string | null | undefined): string {
	return text ?? "";
}

// Stored user storage snapshot helpers
export interface StoredUserSnapshot {
	id?: string | null;
	name: string;
	isAdmin?: boolean;
	avatarUrl?: string;
	email?: string;
}

function normalizeStoredUserSnapshot(value: unknown): StoredUserSnapshot | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const candidate = value as Record<string, unknown>;
	const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
	if (!name) {
		return null;
	}

	return {
		id: typeof candidate.id === "string" ? candidate.id : candidate.id === null ? null : undefined,
		name,
		isAdmin: typeof candidate.isAdmin === "boolean" ? candidate.isAdmin : undefined,
		avatarUrl: typeof candidate.avatarUrl === "string" ? candidate.avatarUrl : undefined,
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

export function writeStoredUserSnapshot(snapshot: StoredUserSnapshot | null): void {
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

function normalizeStoredTournamentSnapshot(value: unknown): StoredTournamentSnapshot | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const candidate = value as Record<string, unknown>;
	const names = Array.isArray(candidate.names) ? (candidate.names as NameItem[]) : null;
	const ratings: Record<string, RatingData> = {};
	if (candidate.ratings && typeof candidate.ratings === "object") {
		for (const [key, val] of Object.entries(candidate.ratings as Record<string, unknown>)) {
			if (typeof val === "number") {
				ratings[key] = { rating: val, wins: 0, losses: 0 };
			} else if (val && typeof val === "object" && typeof (val as RatingData).rating === "number") {
				ratings[key] = {
					rating: (val as RatingData).rating,
					wins: typeof (val as RatingData).wins === "number" ? (val as RatingData).wins : 0,
					losses: typeof (val as RatingData).losses === "number" ? (val as RatingData).losses : 0,
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
		typeof candidate.currentRound === "number" ? candidate.currentRound : undefined;
	const currentMatch =
		typeof candidate.currentMatch === "number" ? candidate.currentMatch : undefined;
	const totalMatches =
		typeof candidate.totalMatches === "number" ? candidate.totalMatches : undefined;
	const mode =
		candidate.mode === "1v1" || candidate.mode === "2v2"
			? (candidate.mode as TournamentMode)
			: undefined;
	const teams = Array.isArray(candidate.teams) ? (candidate.teams as Team[]) : undefined;
	const bracketEntrants = Array.isArray(candidate.bracketEntrants)
		? (candidate.bracketEntrants as string[])
		: undefined;
	const lastUpdated =
		typeof candidate.lastUpdated === "number" ? candidate.lastUpdated : Date.now();

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

	return normalizeStoredTournamentSnapshot(readStorageJson<unknown>(STORAGE_KEYS.TOURNAMENT, null));
}

export function writeStoredTournamentSnapshot(snapshot: StoredTournamentSnapshot | null): void {
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

/* ==========================================================================
   IndexedDB Offline Persistence
   ========================================================================== */
const IDB_DB_NAME = "nn_offline_db";
const IDB_STORE_NAME = "tournament";
const IDB_DB_VERSION = 1;
const IDB_KEY = "current_tournament";

function openIDB(): Promise<IDBDatabase | null> {
	if (typeof window === "undefined" || !("indexedDB" in window)) {
		return Promise.resolve(null);
	}

	return new Promise((resolve) => {
		try {
			const request = window.indexedDB.open(IDB_DB_NAME, IDB_DB_VERSION);

			request.onupgradeneeded = () => {
				const db = request.result;
				if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
					db.createObjectStore(IDB_STORE_NAME);
				}
			};

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = () => {
				resolve(null);
			};
		} catch {
			resolve(null);
		}
	});
}

export async function getStoredTournamentFromIDB(): Promise<StoredTournamentSnapshot | null> {
	const db = await openIDB();
	if (!db) {
		return null;
	}

	return new Promise((resolve) => {
		try {
			const tx = db.transaction(IDB_STORE_NAME, "readonly");
			const store = tx.objectStore(IDB_STORE_NAME);
			const request = store.get(IDB_KEY);

			request.onsuccess = () => {
				resolve(request.result as StoredTournamentSnapshot | null);
			};

			request.onerror = () => {
				resolve(null);
			};
		} catch {
			resolve(null);
		}
	});
}

export async function saveStoredTournamentToIDB(snapshot: StoredTournamentSnapshot): Promise<void> {
	const db = await openIDB();
	if (!db) {
		return;
	}

	return new Promise((resolve) => {
		try {
			const tx = db.transaction(IDB_STORE_NAME, "readwrite");
			const store = tx.objectStore(IDB_STORE_NAME);
			store.put(snapshot, IDB_KEY);

			tx.oncomplete = () => {
				resolve();
			};

			tx.onerror = () => {
				resolve();
			};
		} catch {
			resolve();
		}
	});
}

export async function clearStoredTournamentFromIDB(): Promise<void> {
	const db = await openIDB();
	if (!db) {
		return;
	}

	return new Promise((resolve) => {
		try {
			const tx = db.transaction(IDB_STORE_NAME, "readwrite");
			const store = tx.objectStore(IDB_STORE_NAME);
			store.delete(IDB_KEY);

			tx.oncomplete = () => {
				resolve();
			};

			tx.onerror = () => {
				resolve();
			};
		} catch {
			resolve();
		}
	});
}
