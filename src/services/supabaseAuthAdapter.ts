/**
 * @module supabaseAuthAdapter
 * @description Supabase authentication adapter for the naming tournament app.
 */

import type {
	AuthAdapter,
	AuthUser,
	LoginCredentials,
	RegisterData,
} from "@/app/providers/Providers";
import { STORAGE_KEYS } from "@/shared/lib/constants";
import {
	getStorageString,
	isStorageAvailable,
	removeStorageItem,
	setStorageString,
} from "@/shared/lib/storage";
import { resolveSupabaseClient } from "@/shared/services/supabase/runtime";

function getStoredDisplayName(): string | null {
	if (!isStorageAvailable()) {
		return null;
	}

	return getStorageString(STORAGE_KEYS.USER)?.trim() || null;
}

function getStoredUserId(): string | null {
	if (!isStorageAvailable()) {
		return null;
	}

	return getStorageString(STORAGE_KEYS.USER_ID)?.trim() || null;
}

function storeProfile(user: {
	email?: string | null;
	id?: string | null;
	userName?: string | null;
}): void {
	if (!isStorageAvailable()) {
		return;
	}

	if (user.userName) {
		setStorageString(STORAGE_KEYS.USER, user.userName);
	}

	if (user.id) {
		setStorageString(STORAGE_KEYS.USER_ID, user.id);
	}
}

function clearStoredProfile(): void {
	if (!isStorageAvailable()) {
		return;
	}

	removeStorageItem(STORAGE_KEYS.USER);
	removeStorageItem(STORAGE_KEYS.USER_ID);
}

function getResolvedUserName(
	user: { email?: string | null; id: string; user_metadata?: { user_name?: string | null } | null },
	fallbackName?: string | null,
): string {
	return (
		fallbackName?.trim() ||
		user.user_metadata?.user_name?.trim() ||
		getStoredDisplayName() ||
		user.email ||
		user.id
	);
}

async function ensureAppUserProfile(
	user: { email?: string | null; id: string; user_metadata?: { user_name?: string | null } | null },
	preferredName?: string | null,
): Promise<string> {
	const client = await resolveSupabaseClient();
	if (!client) {
		return getResolvedUserName(user, preferredName);
	}

	const userName = getResolvedUserName(user, preferredName);
	const preferences = {};

	const { error: upsertError } = await client.from("cat_app_users").upsert(
		{
			user_id: user.id,
			user_name: userName,
			preferences,
		},
		{ onConflict: "user_name" },
	);

	if (!upsertError) {
		return userName;
	}

	const { error: rpcError } = await client.rpc("create_user_account", {
		p_user_name: userName,
		p_preferences: preferences,
		p_user_role: "user",
	});

	if (rpcError) {
		throw new Error(rpcError.message || "Failed to create user profile");
	}

	return userName;
}

async function buildSessionUser(): Promise<AuthUser | null> {
	const client = await resolveSupabaseClient();
	if (!client) {
		return null;
	}

	const {
		data: { user },
		error,
	} = await client.auth.getUser();

	if (error || !user) {
		return null;
	}

	const [{ data: roleRows }, { data: profileRows }] = await Promise.all([
		client
			.from("cat_user_roles")
			.select("role")
			.eq("user_id", user.id)
			.eq("role", "admin")
			.limit(1),
		client.from("cat_app_users").select("user_name").eq("user_id", user.id).limit(1),
	]);

	const displayName =
		getStoredDisplayName() || profileRows?.[0]?.user_name || getResolvedUserName(user);
	const isAdmin = (roleRows ?? []).length > 0;

	storeProfile({
		email: user.email,
		id: user.id,
		userName: displayName,
	});

	return {
		id: user.id,
		name: displayName,
		userName: displayName,
		email: user.email,
		isAdmin,
		role: isAdmin ? "admin" : "user",
	};
}

async function signInWithAccount(
	credentials: Required<Pick<LoginCredentials, "email" | "password">> & {
		name?: string;
	},
): Promise<boolean> {
	const client = await resolveSupabaseClient();
	if (!client) {
		return false;
	}

	const { data, error } = await client.auth.signInWithPassword({
		email: credentials.email,
		password: credentials.password,
	});

	if (error || !data.user) {
		console.error("Supabase login failed:", error);
		return false;
	}

	try {
		const userName = await ensureAppUserProfile(data.user, credentials.name);
		storeProfile({
			email: data.user.email,
			id: data.user.id,
			userName,
		});
	} catch (profileError) {
		console.error("Failed to sync app profile on login:", profileError);
		storeProfile({
			email: data.user.email,
			id: data.user.id,
			userName: getResolvedUserName(data.user, credentials.name),
		});
	}

	return true;
}

async function registerAccount(data: RegisterData): Promise<void> {
	const client = await resolveSupabaseClient();
	if (!client) {
		throw new Error("Supabase auth is not configured for this environment.");
	}

	const { data: signUpData, error } = await client.auth.signUp({
		email: data.email.trim(),
		password: data.password,
		options: {
			data: {
				user_name: data.name.trim(),
			},
		},
	});

	if (error) {
		throw new Error(error.message || "Failed to create account");
	}

	if (signUpData.user) {
		try {
			const userName = await ensureAppUserProfile(signUpData.user, data.name);
			storeProfile({
				email: signUpData.user.email,
				id: signUpData.user.id,
				userName,
			});
		} catch (profileError) {
			console.error("Failed to sync app profile on registration:", profileError);
		}
	}
}

export const supabaseAuthAdapter: AuthAdapter = {
	async getCurrentUser(): Promise<AuthUser | null> {
		try {
			const sessionUser = await buildSessionUser();
			if (sessionUser) {
				return sessionUser;
			}

			const userName = getStoredDisplayName();
			if (!userName) {
				return null;
			}

			return {
				id: getStoredUserId() || `local:${userName}`,
				name: userName,
				userName,
				email: undefined,
				isAdmin: false,
				role: "user",
			};
		} catch (error) {
			console.error("Error getting current user:", error);
			return null;
		}
	},

	async login(credentials: LoginCredentials): Promise<boolean> {
		const trimmedName = credentials.name?.trim();

		try {
			if (credentials.email && credentials.password) {
				return await signInWithAccount({
					email: credentials.email.trim(),
					password: credentials.password,
					name: trimmedName,
				});
			}

			if (trimmedName) {
				storeProfile({
					id: getStoredUserId(),
					userName: trimmedName,
				});
				return true;
			}

			return false;
		} catch (error) {
			console.error("Login error:", error);
			return false;
		}
	},

	async register(data: RegisterData): Promise<void> {
		await registerAccount(data);
	},

	async logout(): Promise<void> {
		try {
			const client = await resolveSupabaseClient();
			if (client) {
				await client.auth.signOut();
			}

			clearStoredProfile();
		} catch (error) {
			console.error("Logout error:", error);
		}
	},

	async checkAdminStatus(userId: string): Promise<boolean> {
		try {
			const client = await resolveSupabaseClient();
			if (!client) {
				return false;
			}

			const { data, error } = await client
				.from("cat_user_roles")
				.select("role")
				.eq("user_id", userId)
				.eq("role", "admin")
				.limit(1);

			if (error) {
				return false;
			}

			return (data ?? []).length > 0;
		} catch (error) {
			console.error("Error checking admin status:", error);
			return false;
		}
	},
};
