/**
 * @module supabaseClient
 * @description Consolidated Supabase client with unified API for cat name tournament system.
 * Combines all database operations, real-time subscriptions, and utility functions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@supabase/types";
import { QueryClient } from "@tanstack/react-query";
import { STORAGE_KEYS } from "@/constants";

/* ==========================================================================
   TANSTACK QUERY CLIENT
   ========================================================================== */

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

/* ==========================================================================
   SUPABASE CLIENT CONFIGURATION
   ========================================================================== */

declare global {
	interface Window {
		__supabaseClient?: SupabaseClient<Database>;
	}
}

const getEnvVar = (key: string): string | undefined => {
	interface ImportMetaWithEnv {
		env: Record<string, string | undefined>;
	}
	if (typeof import.meta !== "undefined" && (import.meta as unknown as ImportMetaWithEnv).env) {
		const viteKey = `VITE_${key}`;
		if ((import.meta as unknown as ImportMetaWithEnv).env[viteKey]) {
			return (import.meta as unknown as ImportMetaWithEnv).env[viteKey];
		}
		if ((import.meta as unknown as ImportMetaWithEnv).env[key]) {
			return (import.meta as unknown as ImportMetaWithEnv).env[key];
		}
	}
	if (typeof process !== "undefined" && process.env) {
		if (process.env[key]) {
			return process.env[key];
		}
		if (process.env[`VITE_${key}`]) {
			return process.env[`VITE_${key}`];
		}
	}
	return undefined;
};

// Lazy validation - only check when actually creating the client
const getSupabaseCredentials = (): { url: string; key: string } => {
	const url = getEnvVar("SUPABASE_URL");
	const key = getEnvVar("SUPABASE_ANON_KEY");

	if (!url || !key) {
		const missingVars: string[] = [];
		if (!url) {
			missingVars.push("VITE_SUPABASE_URL or SUPABASE_URL");
		}
		if (!key) {
			missingVars.push("VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY");
		}

		const errorMessage = `Missing required Supabase environment variables: ${missingVars.join(", ")}. Please set them in your .env.local file or environment.`;

		if (typeof window !== "undefined") {
			console.error("❌", errorMessage);
			// In development, show a helpful error
			if (process.env.NODE_ENV === "development") {
				console.error("💡 Create a .env.local file with:");
				console.error("   VITE_SUPABASE_URL=your_supabase_url");
				console.error("   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key");
				console.error(
					"💡 on Lovable/Vercel: Add these to your Project Settings > Environment Variables",
				);
			}
		}

		// Throw error to prevent silent failures
		throw new Error(errorMessage);
	}

	return { url, key };
};

let supabaseInstance: SupabaseClient<Database> | null =
	typeof window !== "undefined" ? (window.__supabaseClient ?? null) : null;
let initializationPromise: Promise<SupabaseClient<Database> | null> | null = null;

const createSupabaseClient = async (): Promise<SupabaseClient<Database> | null> => {
	// Validate and get credentials (throws if missing)
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

export const getSupabaseClient = async (
	retryCount = 0,
): Promise<SupabaseClient<Database> | null> => {
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

export const isDev = typeof process !== "undefined" && process.env?.NODE_ENV === "development";

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

/**
 * Helper to execute Supabase operations with standardized availability checks and error handling.
 */
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

// Re-export client for modern usage
export { resolveSupabaseClient as supabase };

/* ==========================================================================
   SERVICE RE-EXPORTS
   ========================================================================== */

// Re-export common helpers/types if needed by other modules
export * from "@/features/analytics/analyticsService";
export { adminAPI } from "@/features/auth";
export * from "./imageService";
export * from "./nameService";
export { deleteById, deleteById as deleteName } from "./nameService";
export * from "./siteSettingsService";
