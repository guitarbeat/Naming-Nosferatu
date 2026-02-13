/**
 * @module Supabase
 * @description Consolidated Supabase client and API operations
 * Combines: client setup, API operations (images, names, site settings)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/react-query";
import type { NameItem } from "@/types/appTypes";
import { STORAGE_KEYS } from "@/utils/constants";
import type { Database } from "./types";

/* =========================================================================
   TANSTACK QUERY CLIENT
   ========================================================================= */

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

/* =========================================================================
   SUPABASE CLIENT CONFIGURATION
   ========================================================================= */

declare global {
	interface Window {
		__supabaseClient?: SupabaseClient<Database>;
	}
}

const getSupabaseCredentials = (): { url: string; key: string } => {
	const url = import.meta.env.VITE_SUPABASE_URL;
	const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

	if (!url || !key) {
		throw new Error(
			"Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.",
		);
	}

	return { url, key };
};

let supabaseInstance: SupabaseClient<Database> | null =
	typeof window !== "undefined" ? (window.__supabaseClient ?? null) : null;
let initializationPromise: Promise<SupabaseClient<Database> | null> | null = null;

const createSupabaseClient = async (): Promise<SupabaseClient<Database> | null> => {
	const { url: SupabaseUrl, key: SupabaseAnonKey } = getSupabaseCredentials();

	try {
		const { createClient } = await import("@supabase/supabase-js");
		const authOptions = {
			persistSession: true,
			autoRefreshToken: true,
			storage: (() => {
				try {
					return typeof window !== "undefined" ? window.localStorage : undefined;
				} catch {
					return undefined;
				}
			})(),
		} as const;

		let currentUserName: string | null = null;
		try {
			if (typeof window !== "undefined" && window.localStorage) {
				currentUserName = window.localStorage.getItem(STORAGE_KEYS.USER);
			}
		} catch {
			/* ignore */
		}

		const client = createClient<Database>(SupabaseUrl, SupabaseAnonKey, {
			auth: authOptions,
			global: {
				headers: {
					"X-Client-Info": "cat-name-tournament",
					...(currentUserName ? { "x-user-name": currentUserName } : {}),
				},
			},
			db: { schema: "public" },
		});

		if (typeof window !== "undefined") {
			window.__supabaseClient = client;
		}
		return client;
	} catch (error) {
		console.error("❌ Failed to create Supabase client:", error);
		return null;
	}
};

const getSupabaseClient = async (retryCount = 0): Promise<SupabaseClient<Database> | null> => {
	if (supabaseInstance) {
		return supabaseInstance;
	}
	if (!initializationPromise) {
		initializationPromise = createSupabaseClient()
			.then((client) => {
				supabaseInstance = client;
				return client;
			})
			.catch(async (_error) => {
				initializationPromise = null;
				if (retryCount < 3) {
					await new Promise((r) => setTimeout(r, 1000 * 2 ** retryCount));
					return getSupabaseClient(retryCount + 1);
				}
				return null;
			});
	}
	return initializationPromise;
};

export const resolveSupabaseClient = async () => supabaseInstance ?? (await getSupabaseClient());

export const updateSupabaseUserContext = (userName: string | null): void => {
	if (!supabaseInstance) {
		return;
	}
	// @ts-expect-error - accessing internal property
	if (supabaseInstance.rest?.headers) {
		if (userName) {
			// @ts-expect-error - Accessing internal Supabase client headers
			supabaseInstance.rest.headers["x-user-name"] = userName;
		} else {
			// @ts-expect-error - Accessing internal Supabase client headers
			supabaseInstance.rest.headers["x-user-name"] = undefined;
		}
	}
};

const isDev = typeof process !== "undefined" && process.env?.NODE_ENV === "development";

export const isSupabaseAvailable = async () => {
	const client = await resolveSupabaseClient();
	if (!client) {
		if (isDev) {
			console.warn("Supabase not configured. Some features may not work.");
		}
		return false;
	}
	return true;
};

export async function withSupabase<T>(
	operation: (client: SupabaseClient<Database>) => Promise<T>,
	fallback: T,
): Promise<T> {
	try {
		if (!(await isSupabaseAvailable())) {
			return fallback;
		}
		const client = await resolveSupabaseClient();
		if (!client) {
			return fallback;
		}
		return await operation(client);
	} catch (error) {
		if (isDev) {
			console.error("Supabase operation failed:", error);
		}
		return fallback;
	}
}

export { resolveSupabaseClient as supabase };

/* =========================================================================
   IMAGES API
   ========================================================================= */

export const imagesAPI = {
	/**
	 * List all images in the cat-photos bucket
	 */
	list: async (path = "") => {
		return withSupabase(async (client) => {
			const { data, error } = await client.storage.from("cat-photos").list(path);
			if (error) {
				console.error("Error listing images:", error);
				return [];
			}
			return data.map((file) => {
				const { data: urlData } = client.storage
					.from("cat-photos")
					.getPublicUrl(`${path}${file.name}`);
				return urlData.publicUrl;
			});
		}, [] as string[]);
	},

	/**
	 * Upload an image to the cat-photos bucket
	 */
	upload: async (file: File | Blob, userName: string) => {
		return withSupabase(
			async (client) => {
				const fileName = `${Date.now()}-${userName}-${(file as File).name || "blob"}`;
				const { data, error } = await client.storage.from("cat-photos").upload(fileName, file);

				if (error) {
					console.error("Upload error:", error);
					return { path: null, error: error.message };
				}

				const { data: urlData } = client.storage.from("cat-photos").getPublicUrl(data.path);
				return { path: urlData.publicUrl, success: true };
			},
			{ path: null, error: "Supabase not configured" },
		);
	},
};

/* =========================================================================
   NAMES API
   ========================================================================= */

interface HiddenNameItem {
	id: string;
	name: string;
	description: string | null;
	created_at: string;
}

async function updateHiddenStatus(userName: string, nameId: string | number, isHidden: boolean) {
	return withSupabase(
		async (client) => {
			try {
				await client.rpc("set_user_context", { user_name_param: userName });
			} catch {
				/* ignore */
			}

			const { error } = await client
				.from("cat_name_options")
				.update({ is_hidden: isHidden })
				.eq("id", String(nameId));

			if (error) {
				throw error;
			}
			return { nameId, success: true } as {
				nameId: string | number;
				success: boolean;
				error?: string;
			};
		},
		{
			nameId: String(nameId),
			success: false,
			error: "Supabase not configured",
		} as {
			nameId: string | number;
			success: boolean;
			error?: string;
		},
	);
}

async function updateHiddenStatuses(
	userName: string,
	nameIds: (string | number)[],
	isHidden: boolean,
) {
	return withSupabase(
		async (client) => {
			try {
				await client.rpc("set_user_context", { user_name_param: userName });
			} catch {
				/* ignore */
			}

			const results = await Promise.all(
				nameIds.map(async (id) => {
					const { error } = await client
						.from("cat_name_options")
						.update({ is_hidden: isHidden })
						.eq("id", String(id));
					return { nameId: id, success: !error, error: error?.message };
				}),
			);
			return results;
		},
		nameIds.map((id) => ({
			nameId: id,
			success: false,
			error: "Supabase not configured",
		})),
	);
}

async function deleteById(nameId: string | number) {
	return withSupabase(
		async (client) => {
			const { error } = await client.from("cat_name_options").delete().eq("id", String(nameId));
			if (error) {
				return {
					success: false,
					error: error.message || "Failed to delete name",
				};
			}
			return { success: true };
		},
		{ success: false, error: "Supabase not configured" },
	);
}

export const coreAPI = {
	/**
	 * Get all names with descriptions and ratings
	 */
	getTrendingNames: async (includeHidden: boolean = false) => {
		const isAvailable = await isSupabaseAvailable();
		if (!isAvailable) {
			throw new Error("Supabase is not configured or unavailable");
		}

		return withSupabase(async (client) => {
			let query = client
				.from("cat_name_options")
				.select(
					"id, name, description, created_at, avg_rating, is_active, is_hidden, status, provenance",
				)
				.eq("is_active", true)
				.order("avg_rating", { ascending: false })
				.limit(1000);

			if (!includeHidden) {
				query = query.eq("is_hidden", false);
			}

			const { data, error } = await query;
			if (error) {
				console.error("Error fetching names with descriptions:", error);
				throw error;
			}

			return ((data ?? []) as unknown as NameItem[]).map((item) => ({
				...item,
				updated_at: null,
				user_rating: null,
				user_wins: 0,
				user_losses: 0,
				isHidden: item.is_hidden || false,
				has_user_rating: false,
			}));
		}, [] as NameItem[]);
	},

	/**
	 * Add a new name option
	 */
	addName: async (name: string, description: string = "", userName: string | null = null) => {
		return withSupabase(
			async (client) => {
				if (userName?.trim()) {
					try {
						await client.rpc("set_user_context", {
							user_name_param: userName.trim(),
						});
					} catch {
						/* ignore */
					}
				}

				const { data, error } = await client
					.from("cat_name_options")
					.insert([
						{
							name: name.trim(),
							description: description.trim(),
							status: "candidate",
							provenance: [
								{
									action: "created",
									timestamp: new Date().toISOString(),
									details: { source: "user_input" },
								},
							],
						},
					])
					.select()
					.single();

				if (error) {
					console.error("Error adding name:", error);
					return {
						success: false,
						error: error.message || "Failed to add name",
					};
				}
				return { success: true, data };
			},
			{ success: false, error: "Supabase not configured or request failed" },
		);
	},

	/**
	 * Remove a name option by its name string
	 */
	deleteByName: async (name: string) => {
		return withSupabase(
			async (client) => {
				const { error } = await client.from("cat_name_options").delete().eq("name", name);
				if (error) {
					return {
						success: false,
						error: error.message || "Failed to remove name",
					};
				}
				return { success: true };
			},
			{ success: false, error: "Supabase not configured" },
		);
	},

	deleteById,
};

export const hiddenNamesAPI = {
	hideName: async (userName: string, nameId: string | number) => {
		return updateHiddenStatus(userName, nameId, true);
	},

	unhideName: async (userName: string, nameId: string | number) => {
		return updateHiddenStatus(userName, nameId, false);
	},

	hideNames: async (userName: string, nameIds: (string | number)[]) => {
		return updateHiddenStatuses(userName, nameIds, true);
	},

	unhideNames: async (userName: string, nameIds: (string | number)[]) => {
		return updateHiddenStatuses(userName, nameIds, false);
	},

	getHiddenNames: async () => {
		return withSupabase(async (client) => {
			const { data, error } = await client
				.from("cat_name_options")
				.select("id, name, description, created_at")
				.eq("is_hidden", true);

			if (error) {
				console.error("Error fetching hidden names:", error);
				return [];
			}
			return (data || []) as unknown as HiddenNameItem[];
		}, []);
	},
};

/* =========================================================================
   SITE SETTINGS API
   ========================================================================= */

interface CatChosenNameUpdate {
	first_name: string;
	middle_names?: string | string[];
	last_name?: string;
	greeting_text?: string;
	show_banner?: boolean;
}

export const siteSettingsAPI = {
	/**
	 * Get cat's chosen name
	 */
	getCatChosenName: async () => {
		return withSupabase(async (client) => {
			const { data, error } = await client
				.from("cat_chosen_name")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(1)
				.single();

			if (error) {
				console.error("Error fetching cat chosen name:", error);
				return null;
			}
			return data;
		}, null);
	},

	/**
	 * Update cat's chosen name
	 */
	updateCatChosenName: async (nameData: CatChosenNameUpdate, userName: string) => {
		return withSupabase(
			async (client) => {
				try {
					await client.rpc("set_user_context", {
						user_name_param: userName,
					});
				} catch (err) {
					if (import.meta.env.DEV) {
						console.warn("Could not set user context:", err);
					}
				}

				const { data, error } = await client
					.from("cat_chosen_name")
					.insert([nameData])
					.select()
					.single();

				if (error) {
					console.error("Error updating cat chosen name:", error);
					return { success: false, error: error.message };
				}
				return { success: true, data };
			},
			{ success: false, error: "Supabase not configured" },
		);
	},
};

/* =========================================================================
   RE-EXPORTS
   ========================================================================= */

export * from "@/services/analytics/analyticsService";
