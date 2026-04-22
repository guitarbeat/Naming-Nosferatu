import { STORAGE_KEYS } from "@/shared/lib/constants";
import {
	getStorageString,
	isStorageAvailable,
	parseJsonValue,
	readStorageJson,
	removeStorageItem,
	setStorageString,
	writeStorageJson,
} from "@/shared/lib/storage";

export interface StoredUserSnapshot {
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

	const legacyRaw = getStorageString(STORAGE_KEYS.USER)?.trim();
	if (!legacyRaw) {
		return null;
	}

	const legacyId = getStorageString(STORAGE_KEYS.USER_ID);
	const legacyAvatar = getStorageString(STORAGE_KEYS.USER_AVATAR) ?? undefined;
	const parsedLegacy = parseJsonValue<unknown>(legacyRaw, legacyRaw);

	if (typeof parsedLegacy === "string") {
		const legacyName = parsedLegacy.trim();
		return legacyName
			? {
					id: legacyId ?? legacyName,
					name: legacyName,
					avatarUrl: legacyAvatar,
				}
			: null;
	}

	const legacySnapshot = normalizeStoredUserSnapshot(parsedLegacy);
	if (legacySnapshot) {
		return {
			...legacySnapshot,
			id: legacySnapshot.id ?? legacyId ?? legacySnapshot.name,
			avatarUrl: legacySnapshot.avatarUrl ?? legacyAvatar,
		};
	}

	return {
		id: legacyId ?? legacyRaw,
		name: legacyRaw,
		avatarUrl: legacyAvatar,
	};
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
