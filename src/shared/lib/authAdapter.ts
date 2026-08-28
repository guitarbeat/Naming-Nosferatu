import type { AuthAdapter, AuthUser, LoginCredentials, RegisterData } from "@/app/Providers";
import { STORAGE_KEYS } from "@/shared/lib/constants";
import { getStorageString, removeStorageItem, setStorageString } from "@/shared/lib/storage";

export const localAuthAdapter: AuthAdapter = {
	getCurrentUser: async (): Promise<AuthUser | null> => {
		const name = getStorageString(STORAGE_KEYS.USER);
		const id = getStorageString(STORAGE_KEYS.USER_ID);
		if (!name || !id) {
			return null;
		}
		return { id, name, isAdmin: name.toLowerCase() === "admin" };
	},
	login: async (credentials: LoginCredentials): Promise<boolean> => {
		const name = credentials.name || credentials.email?.split("@")[0] || "Guest";
		const id = `local-usr-${Date.now()}`;
		setStorageString(STORAGE_KEYS.USER, name);
		setStorageString(STORAGE_KEYS.USER_ID, id);
		return true;
	},
	logout: async (): Promise<void> => {
		removeStorageItem(STORAGE_KEYS.USER);
		removeStorageItem(STORAGE_KEYS.USER_ID);
	},
	register: async (data: RegisterData): Promise<void> => {
		const name = data.name || data.email?.split("@")[0] || "Guest";
		const id = `local-usr-${Date.now()}`;
		setStorageString(STORAGE_KEYS.USER, name);
		setStorageString(STORAGE_KEYS.USER_ID, id);
	},
	checkAdminStatus: async (userIdOrName: string): Promise<boolean> => {
		return userIdOrName.toLowerCase() === "admin";
	},
};
