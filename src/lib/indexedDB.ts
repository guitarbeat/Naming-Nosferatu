import type { StoredTournamentSnapshot } from "./storage";

const DB_NAME = "nn_offline_db";
const STORE_NAME = "tournament";
const DB_VERSION = 1;
const KEY = "current_tournament";

function openDB(): Promise<IDBDatabase | null> {
	if (typeof window === "undefined" || !("indexedDB" in window)) {
		return Promise.resolve(null);
	}

	return new Promise((resolve) => {
		try {
			const request = window.indexedDB.open(DB_NAME, DB_VERSION);

			request.onupgradeneeded = () => {
				const db = request.result;
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME);
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
	const db = await openDB();
	if (!db) {
		return null;
	}

	return new Promise((resolve) => {
		try {
			const tx = db.transaction(STORE_NAME, "readonly");
			const store = tx.objectStore(STORE_NAME);
			const request = store.get(KEY);

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
	const db = await openDB();
	if (!db) {
		return;
	}

	return new Promise((resolve) => {
		try {
			const tx = db.transaction(STORE_NAME, "readwrite");
			const store = tx.objectStore(STORE_NAME);
			store.put(snapshot, KEY);

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
	const db = await openDB();
	if (!db) {
		return;
	}

	return new Promise((resolve) => {
		try {
			const tx = db.transaction(STORE_NAME, "readwrite");
			const store = tx.objectStore(STORE_NAME);
			store.delete(KEY);

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
