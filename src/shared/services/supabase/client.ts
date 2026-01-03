/**
 * @module supabaseClient
 * @description Consolidated Supabase client with unified API for cat name tournament system.
 * Combines all database operations, real-time subscriptions, and utility functions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Re-export all modules
export * from "./modules/cat-names-consolidated";
export * from "./modules/general";

// Re-export types
export type { Database } from "./types";

declare global {
	interface Window {
		__supabaseClient?: SupabaseClient<Database>;
	}
}

const getEnvVar = (key: string): string | undefined => {
	interface ImportMetaWithEnv {
		env: Record<string, string | undefined>;
	}
	if (
		typeof import.meta !== "undefined" &&
		(import.meta as unknown as ImportMetaWithEnv).env
	) {
		const viteKey = `VITE_${key}`;
		if ((import.meta as unknown as ImportMetaWithEnv).env[viteKey])
			return (import.meta as unknown as ImportMetaWithEnv).env[viteKey];
		if ((import.meta as unknown as ImportMetaWithEnv).env[key])
			return (import.meta as unknown as ImportMetaWithEnv).env[key];
	}
	if (typeof process !== "undefined" && process.env) {
		if (process.env[key]) return process.env[key];
		if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`];
	}
	return undefined;
};

const SUPABASE_URL =
	getEnvVar("SUPABASE_URL") || "https://ocghxwwwuubgmwsxgyoy.supabase.co";
const SUPABASE_ANON_KEY =
	getEnvVar("SUPABASE_ANON_KEY") ||
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ2h4d3d3dXViZ213c3hneW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTgzMjksImV4cCI6MjA2NTY3NDMyOX0.93cpwT3YCC5GTwhlw4YAzSBgtxbp6fGkjcfqzdKX4E0";

let supabase: SupabaseClient<Database> | null =
	typeof window !== "undefined" ? (window.__supabaseClient ?? null) : null;
let initializationPromise: Promise<SupabaseClient<Database> | null> | null =
	null;

const createSupabaseClient =
	async (): Promise<SupabaseClient<Database> | null> => {
		if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

		try {
			const { createClient } = await import("@supabase/supabase-js");
			const authOptions = {
				persistSession: true,
				autoRefreshToken: true,
				storage: (() => {
					try {
						return typeof window !== "undefined"
							? window.localStorage
							: undefined;
					} catch {
						return undefined;
					}
				})(),
			} as const;

			let currentUserName: string | null = null;
			try {
				if (typeof window !== "undefined" && window.localStorage) {
					currentUserName = window.localStorage.getItem("catNamesUser");
				}
			} catch {
				/* ignore */
			}

			const client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

export const getSupabaseClient = async (
	retryCount = 0,
): Promise<SupabaseClient<Database> | null> => {
	if (supabase) return supabase;
	if (!initializationPromise) {
		initializationPromise = createSupabaseClient()
			.then((client) => {
				supabase = client;
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

export const resolveSupabaseClient = async () =>
	supabase ?? (await getSupabaseClient());

export const updateSupabaseUserContext = (userName: string | null): void => {
	if (!supabase) return;
	// @ts-expect-error - accessing internal property
	if (supabase.rest?.headers) {
		if (userName) {
			// @ts-expect-error - Accessing internal Supabase client headers
			supabase.rest.headers["x-user-name"] = userName;
		} else {
			// @ts-expect-error - Accessing internal Supabase client headers
			delete supabase.rest.headers["x-user-name"];
		}
	}
};

export const isDev =
	typeof process !== "undefined" && process.env?.NODE_ENV === "development";

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

// Convenience exports from catNamesAPI for backward compatibility - DEPRECATED
// Please use catNamesAPI directly
// import { catNamesAPI } from "./modules/catNames";
// export const {
// 	getNamesWithDescriptions,
// 	getNamesWithUserRatings,
// 	getUserStats,
// } = catNamesAPI;
