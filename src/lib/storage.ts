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
		if (typeof window === "undefined" || !window.localStorage) return false;
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
	if (!isStorageAvailable()) return memoryFallbackStore.get(key) ?? fallback;
	try {
		return window.localStorage.getItem(key) ?? memoryFallbackStore.get(key) ?? fallback;
	} catch (error) {
		logger.error(`[storage] Failed to read key "${key}":`, error);
		return memoryFallbackStore.get(key) ?? fallback;
	}
}

export function setStorageString(key: string, value: string): boolean {
	memoryFallbackStore.set(key, value);
	if (!isStorageAvailable()) return true;
	try {
		window.localStorage.setItem(key, value);
		return true;
	} catch (error) {
		logger.error(`[storage] Failed to write key "${key}":`, error);
		return false;
	}
}

export function removeStorageItem(key: string): void {
	memoryFallbackStore.delete(key);
	if (!isStorageAvailable()) return;
	try {
		window.localStorage.removeItem(key);
	} catch (error) {
		logger.error(`[storage] Failed to remove key "${key}":`, error);
	}
}

export function parseJsonValue<T>(value: string | null | undefined, fallback: T): T {
	const trimmed = value?.trim();
	if (!trimmed) return fallback;
	const first = trimmed[0];
	if (
		first !== "{" &&
		first !== "[" &&
		first !== '"' &&
		first !== "t" &&
		first !== "f" &&
		first !== "n" &&
		first !== "-" &&
		(first < "0" || first > "9")
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
	if (rawValue && parsed === fallback) removeStorageItem(key);
	return parsed;
}

export function writeStorageJson<T>(key: string, value: T): boolean {
	try {
		return setStorageString(key, JSON.stringify(value));
	} catch (error) {
		logger.error(`[storage] Failed to write JSON "${key}":`, error);
		return false;
	}
}

export function decryptValue(text: string | null | undefined): string {
	return text ?? "";
}

export interface StoredUserSnapshot {
	id?: string | null;
	name: string;
	isAdmin?: boolean;
	avatarUrl?: string;
	email?: string;
}

function normalizeStoredUserSnapshot(value: unknown): StoredUserSnapshot | null {
	if (!value || typeof value !== "object") return null;
	const c = value as Record<string, unknown>;
	const name = typeof c.name === "string" ? c.name.trim() : "";
	if (!name) return null;
	return {
		id: typeof c.id === "string" ? c.id : c.id === null ? null : undefined,
		name,
		isAdmin: typeof c.isAdmin === "boolean" ? c.isAdmin : undefined,
		avatarUrl: typeof c.avatarUrl === "string" ? c.avatarUrl : undefined,
		email: typeof c.email === "string" ? c.email : undefined,
	};
}

export function readStoredUserSnapshot(): StoredUserSnapshot | null {
	if (!isStorageAvailable()) return null;
	const snapshot = normalizeStoredUserSnapshot(
		readStorageJson<unknown>(STORAGE_KEYS.USER_STORAGE, null),
	);
	if (snapshot) return snapshot;
	clearStoredUserSnapshot();
	return null;
}

export function writeStoredUserSnapshot(snapshot: StoredUserSnapshot | null): void {
	if (!isStorageAvailable()) return;
	const normalized = normalizeStoredUserSnapshot(snapshot);
	if (!normalized) {
		clearStoredUserSnapshot();
		return;
	}
	writeStorageJson(STORAGE_KEYS.USER_STORAGE, normalized);
	setStorageString(STORAGE_KEYS.USER, normalized.name);
	if (normalized.id) setStorageString(STORAGE_KEYS.USER_ID, normalized.id);
	else removeStorageItem(STORAGE_KEYS.USER_ID);
	if (normalized.avatarUrl) setStorageString(STORAGE_KEYS.USER_AVATAR, normalized.avatarUrl);
	else removeStorageItem(STORAGE_KEYS.USER_AVATAR);
}

export function clearStoredUserSnapshot(): void {
	if (!isStorageAvailable()) return;
	removeStorageItem(STORAGE_KEYS.USER);
	removeStorageItem(STORAGE_KEYS.USER_ID);
	removeStorageItem(STORAGE_KEYS.USER_AVATAR);
	removeStorageItem(STORAGE_KEYS.USER_STORAGE);
}

export type StoredTournamentSnapshot = Omit<TournamentState, "isLoading">;

function normalizeStoredTournamentSnapshot(value: unknown): StoredTournamentSnapshot | null {
	if (!value || typeof value !== "object") return null;
	const c = value as Record<string, unknown>;
	const names = Array.isArray(c.names) ? (c.names as NameItem[]) : null;
	const ratings: Record<string, RatingData> = {};
	if (c.ratings && typeof c.ratings === "object") {
		for (const [key, val] of Object.entries(c.ratings as Record<string, unknown>)) {
			if (typeof val === "number") ratings[key] = { rating: val, wins: 0, losses: 0 };
			else if (val && typeof val === "object" && typeof (val as RatingData).rating === "number") {
				ratings[key] = {
					rating: (val as RatingData).rating,
					wins: typeof (val as RatingData).wins === "number" ? (val as RatingData).wins : 0,
					losses: typeof (val as RatingData).losses === "number" ? (val as RatingData).losses : 0,
				};
			}
		}
	}
	const isComplete = Boolean(c.isComplete);
	const voteHistory = Array.isArray(c.voteHistory) ? (c.voteHistory as VoteRecord[]) : [];
	const selectedNames = Array.isArray(c.selectedNames) ? (c.selectedNames as NameItem[]) : [];
	const matchHistory = Array.isArray(c.matchHistory)
		? (c.matchHistory as MatchRecord[])
		: undefined;
	const currentRound = typeof c.currentRound === "number" ? c.currentRound : undefined;
	const currentMatch = typeof c.currentMatch === "number" ? c.currentMatch : undefined;
	const totalMatches = typeof c.totalMatches === "number" ? c.totalMatches : undefined;
	const mode = c.mode === "1v1" || c.mode === "2v2" ? (c.mode as TournamentMode) : undefined;
	const teams = Array.isArray(c.teams) ? (c.teams as Team[]) : undefined;
	const bracketEntrants = Array.isArray(c.bracketEntrants)
		? (c.bracketEntrants as string[])
		: undefined;
	const lastUpdated = typeof c.lastUpdated === "number" ? c.lastUpdated : Date.now();

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
	return isStorageAvailable()
		? normalizeStoredTournamentSnapshot(readStorageJson<unknown>(STORAGE_KEYS.TOURNAMENT, null))
		: null;
}

export function writeStoredTournamentSnapshot(snapshot: StoredTournamentSnapshot | null): void {
	if (!isStorageAvailable()) return;
	const normalized = normalizeStoredTournamentSnapshot(snapshot);
	if (normalized) writeStorageJson(STORAGE_KEYS.TOURNAMENT, normalized);
	else clearStoredTournamentSnapshot();
}

export function clearStoredTournamentSnapshot(): void {
	if (isStorageAvailable()) removeStorageItem(STORAGE_KEYS.TOURNAMENT);
}

const IDB_DB_NAME = "nn_offline_db";
const IDB_STORE_NAME = "tournament";
const IDB_KEY = "current_tournament";

function openIDB(): Promise<IDBDatabase | null> {
	if (typeof window === "undefined" || !("indexedDB" in window)) return Promise.resolve(null);
	return new Promise((resolve) => {
		try {
			const req = window.indexedDB.open(IDB_DB_NAME, 1);
			req.onupgradeneeded = () => {
				if (!req.result.objectStoreNames.contains(IDB_STORE_NAME))
					req.result.createObjectStore(IDB_STORE_NAME);
			};
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => resolve(null);
		} catch {
			resolve(null);
		}
	});
}

export async function getStoredTournamentFromIDB(): Promise<StoredTournamentSnapshot | null> {
	const db = await openIDB();
	if (!db) return null;
	return new Promise((resolve) => {
		try {
			const req = db
				.transaction(IDB_STORE_NAME, "readonly")
				.objectStore(IDB_STORE_NAME)
				.get(IDB_KEY);
			req.onsuccess = () => resolve(req.result as StoredTournamentSnapshot | null);
			req.onerror = () => resolve(null);
		} catch {
			resolve(null);
		}
	});
}

export async function saveStoredTournamentToIDB(snapshot: StoredTournamentSnapshot): Promise<void> {
	const db = await openIDB();
	if (!db) return;
	return new Promise((resolve) => {
		try {
			const tx = db.transaction(IDB_STORE_NAME, "readwrite");
			tx.objectStore(IDB_STORE_NAME).put(snapshot, IDB_KEY);
			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		} catch {
			resolve();
		}
	});
}

export async function clearStoredTournamentFromIDB(): Promise<void> {
	const db = await openIDB();
	if (!db) return;
	return new Promise((resolve) => {
		try {
			const tx = db.transaction(IDB_STORE_NAME, "readwrite");
			tx.objectStore(IDB_STORE_NAME).delete(IDB_KEY);
			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		} catch {
			resolve();
		}
	});
}
