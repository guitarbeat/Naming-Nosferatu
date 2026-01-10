/**
 * @module useUserSession
 * @description Hook for managing user sessions with username-based authentication (no email/password)
 * @example
 * const { login, logout, error, userName, isLoggedIn } = useUserSession({ showToast });
 * await login('MyUsername');
 * await logout();
 */

import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../../core/constants";
import { isUserAdmin } from "../../features/auth/utils/authUtils";
import { resolveSupabaseClient } from "../../shared/services/supabase/client";
import useAppStore from "../store/useAppStore";

let canUseSetUserContext = true;

const isRpcUnavailableError = (error: unknown) => {
	if (!error || typeof error !== "object") {
		return false;
	}
	const err = error as Record<string, unknown>;

	const statusCode = typeof err.status === "number" ? err.status : null;
	const errorCode = typeof err.code === "string" ? err.code.toUpperCase() : "";
	const message = (err.message as string)?.toLowerCase?.() ?? "";

	return (
		statusCode === 404 ||
		errorCode === "404" ||
		errorCode === "PGRST301" ||
		errorCode === "PGRST303" ||
		message.includes("not found") ||
		message.includes("does not exist")
	);
};

const setSupabaseUserContext = async (activeSupabase: unknown, userName: string) => {
	if (!canUseSetUserContext || !activeSupabase || !userName) {
		return;
	}

	try {
		const trimmedName = userName.trim?.() ?? userName;
		if (!trimmedName) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		// RPC parameter names must match database function signature (snake_case required)
		await (activeSupabase as any).rpc("set_user_context", {
			// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
			user_name_param: trimmedName,
		});
	} catch (error) {
		if (isRpcUnavailableError(error)) {
			canUseSetUserContext = false;
			if (import.meta.env.DEV) {
				console.info(
					"Supabase set_user_context RPC is unavailable. Skipping future context calls.",
				);
			}
		} else if (import.meta.env.DEV) {
			console.warn("Failed to set Supabase user context:", error);
		}
	}
};

/**
 * Normalize username to prevent duplicate accounts with different casing
 * Capitalizes first letter, lowercases the rest
 * @param {string} name - Raw username input
 * @returns {string} Normalized username
 */
const normalizeUsername = (name: string) => {
	if (!name || typeof name !== "string") {
		return "";
	}
	const trimmed = name.trim();
	if (!trimmed) {
		return "";
	}
	// Capitalize first letter, lowercase the rest
	return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

function useUserSession({
	showToast,
}: {
	showToast?: (props: { message: string; type: string }) => void;
} = {}) {
	const [error, setError] = useState<string | null>(null);
	const [isInitialized, setIsInitialized] = useState<boolean>(false);
	const { user, userActions } = useAppStore();

	// Initialize user from localStorage on mount
	useEffect(() => {
		let storedUserName: string | null = null;
		try {
			storedUserName = localStorage.getItem(STORAGE_KEYS.USER);
		} catch (error) {
			// localStorage might not be available (private browsing, etc.)
			if (import.meta.env.DEV) {
				console.warn("Unable to access localStorage:", error);
			}
		}

		if (storedUserName?.trim()) {
			userActions.login(storedUserName);

			// Set username context for RLS policies (username-based auth)
			(async () => {
				try {
					const activeSupabase = await resolveSupabaseClient();
					await setSupabaseUserContext(activeSupabase, storedUserName);
				} catch (error) {
					if (import.meta.env.DEV) {
						console.warn("Failed to initialize Supabase user context:", error);
					}
				}
			})();

			// Check admin status server-side
			isUserAdmin(storedUserName)
				.then((adminStatus: boolean) => {
					userActions.setAdminStatus(adminStatus);
				})
				.catch(() => {
					userActions.setAdminStatus(false);
				});
		} else {
			// * Auto-login as guest if no user found
			import("../../shared/utils")
				.then(({ generateFunName }) => {
					const randomName = generateFunName();
					// We don't save to localStorage here to keep it "ephemeral" until they maybe choose to keep it?
					// Actually, for better UX let's save it so refresh works.
					// If they want to be admin they can "re-login".
					localStorage.setItem(STORAGE_KEYS.USER, randomName);
					userActions.login(randomName);

					// Also need to set the supabase context for this new guest
					(async () => {
						try {
							const activeSupabase = await resolveSupabaseClient();
							await setSupabaseUserContext(activeSupabase, randomName);
						} catch {
							// ignore
						}
					})();
				})
				.catch((error) => {
					if (import.meta.env.DEV) {
						console.warn("Failed to import utils for guest login:", error);
					}
					// Fallback: use a default guest name if import fails
					const fallbackName = "Guest Cat";
					localStorage.setItem(STORAGE_KEYS.USER, fallbackName);
					userActions.login(fallbackName);
				});
		}
		setIsInitialized(true);
	}, [userActions]);

	/**
	 * Login with username only (no password required)
	 * Creates user in database if doesn't exist
	 * @param {string} userName - The user's chosen username
	 */
	const login = useCallback(
		async (userName: string) => {
			if (!userName || !userName.trim()) {
				setError("Username is required");
				return false;
			}

			try {
				setError(null);
				const trimmedName = normalizeUsername(userName);

				const activeSupabase = await resolveSupabaseClient();

				if (!activeSupabase) {
					console.warn("Supabase client is not configured. Proceeding with local-only login.");

					localStorage.setItem(STORAGE_KEYS.USER, trimmedName);
					userActions.login(trimmedName);
					return true;
				}

				// Ensure the RLS session uses the current username
				await setSupabaseUserContext(activeSupabase, trimmedName);

				// Check if user exists in database
				const { data: existingUser, error: fetchError } = await activeSupabase
					.from("cat_app_users")
					.select("user_name, preferences")
					.eq("user_name", trimmedName)
					.maybeSingle();

				if (fetchError) {
					console.error("Error fetching user:", fetchError);
					const errorMessage = fetchError.message || "Cannot verify existing user";
					showToast?.({ message: errorMessage, type: "error" });
					throw fetchError;
				}

				// Create user if doesn't exist using RPC function (bypasses RLS)
				if (existingUser) {
					showToast?.({ message: "Logging in...", type: "info" });
				} else {
					// * Use the create_user_account RPC function which bypasses RLS
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					// RPC parameter names must match database function signature (snake_case required)
					const { error: rpcError } = await (activeSupabase as any).rpc("create_user_account", {
						// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
						p_user_name: trimmedName,
						// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
						p_preferences: {
							// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
							sound_enabled: true,
							// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
							theme_preference: "dark",
						},
					});

					if (rpcError) {
						// * Check if this is a duplicate key error (race condition)
						// * PostgreSQL error code 23505 = unique_violation
						// * Supabase may also return code "PGRST116" for unique constraint violations
						const isDuplicateKeyError =
							rpcError.code === "23505" ||
							rpcError.code === "PGRST116" ||
							rpcError.message?.includes("duplicate key") ||
							rpcError.message?.includes("unique constraint") ||
							rpcError.message?.includes("already exists");

						if (isDuplicateKeyError) {
							// * This is likely a race condition - verify if user was actually created
							if (import.meta.env.DEV) {
								console.warn(
									"RPC create_user_account duplicate key error (race condition):",
									rpcError,
								);
							}

							const { data: verifyUser } = await activeSupabase
								.from("cat_app_users")
								.select("user_name")
								.eq("user_name", trimmedName)
								.maybeSingle();

							if (verifyUser) {
								// * User was created (race condition), continue
								showToast?.({ message: "Logging in...", type: "info" });
							} else {
								// * Unexpected: duplicate key error but user doesn't exist
								const errorMessage = rpcError.message || "Failed to create user account";
								if (import.meta.env.DEV) {
									console.error("Duplicate key error but user not found:", errorMessage);
								}
								showToast?.({ message: errorMessage, type: "error" });
								throw rpcError;
							}
						} else {
							// * Not a duplicate key error - this is a real error
							const errorMessage = rpcError.message || "Failed to create user account";
							if (import.meta.env.DEV) {
								console.error("Error creating user:", errorMessage, rpcError);
							}
							showToast?.({ message: errorMessage, type: "error" });
							throw rpcError;
						}
					} else {
						showToast?.({
							message: "Account created successfully!",
							type: "success",
						});
					}
				}

				// Store username and update state
				localStorage.setItem("catNamesUser", trimmedName);
				userActions.login(trimmedName);

				// Check admin status server-side
				const adminStatus = await isUserAdmin(trimmedName);
				userActions.setAdminStatus(adminStatus);

				return true;
			} catch (err: unknown) {
				const error = err as Error;
				let errorMessage = "Failed to login";

				// Handle specific error types
				if (error.message?.includes("fetch")) {
					errorMessage = "Cannot connect to database. Please check your connection.";
				} else if (error.message?.includes("JWT")) {
					errorMessage = "Authentication error. Please try again.";
				} else if (error.message) {
					errorMessage = error.message;
				}

				console.error("Login error:", errorMessage);
				setError(errorMessage);
				showToast?.({ message: errorMessage, type: "error" });
				return false;
			}
		},
		[userActions, showToast],
	);

	/**
	 * Logout current user
	 */
	const logout = useCallback(async () => {
		try {
			setError(null);
			localStorage.removeItem(STORAGE_KEYS.USER);
			userActions.logout();
			return true;
		} catch (err: unknown) {
			const error = err as Error;
			console.error("Logout error:", error);
			setError(error.message || "Failed to logout");
			return false;
		}
	}, [userActions]);

	return {
		userName: user.name,
		isLoggedIn: user.isLoggedIn,
		error,
		login,
		logout,
		isInitialized,
	};
}

export default useUserSession;
