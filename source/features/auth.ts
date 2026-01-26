/**
 * @module features/auth
 * @description Authentication, authorization, and user role management
 * Consolidated from adminService.ts, authUtils.ts, and authHooks.ts
 */

import { ErrorManager } from "@services/errorManager";
import { resolveSupabaseClient, withSupabase } from "@supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@supabase/types";
import { generateFunName } from "@utils";
import { playSound } from "@utils/ui";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { STORAGE_KEYS, VALIDATION } from "@/constants";
import { useValidatedForm } from "@/hooks/useValidatedForm";
import useAppStore from "@/store";

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const USER_ROLES = {
	USER: "user",
	MODERATOR: "moderator",
	ADMIN: "admin",
} as const;

const ROLE_SOURCES = ["cat_user_roles"] as const;

const ROLE_PRIORITY = {
	[USER_ROLES.USER]: 0,
	[USER_ROLES.MODERATOR]: 1,
	[USER_ROLES.ADMIN]: 2,
};

const FALLBACK_CAT_FACT = "Cats are amazing creatures with unique personalities!";
const CAT_FACT_API_URL = "https://catfact.ninja/fact";
const REQUEST_TIMEOUT_MS = 5000;

/* ==========================================================================
   ROLE UTILITIES
   ========================================================================== */

const normalizeRole = (role: string | null | undefined): string | null =>
	role?.toLowerCase?.() ?? null;

const compareRoles = (
	currentRole: string | null | undefined,
	requiredRole: string | null | undefined,
): boolean => {
	const current = ROLE_PRIORITY[normalizeRole(currentRole) as keyof typeof ROLE_PRIORITY] ?? -1;
	const required =
		ROLE_PRIORITY[normalizeRole(requiredRole) as keyof typeof ROLE_PRIORITY] ??
		Number.POSITIVE_INFINITY;
	return current >= required;
};

const normalizeStatusCode = (value: unknown): number | null => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string") {
		const numericMatch = value.match(/\d{3}/);
		if (numericMatch) {
			return Number.parseInt(numericMatch[0], 10);
		}
	}
	return null;
};

interface ErrorWithStatus {
	status?: unknown;
	statusCode?: unknown;
	status_code?: unknown;
	responseStatus?: unknown;
	statusText?: unknown;
	response?: Record<string, unknown> | ErrorWithStatus;
	error?: ErrorWithStatus;
	originalError?: ErrorWithStatus;
	data?: ErrorWithStatus;
	code?: unknown;
	sqlState?: unknown;
	message?: unknown;
	error_description?: unknown;
	errorMessage?: unknown;
	error_message?: unknown;
	hint?: unknown;
	details?: unknown;
	detail?: unknown;
	description?: unknown;
	body?: unknown;
	msg?: unknown;
	responseText?: unknown;
}

const extractErrorMetadata = (error: unknown) => {
	const statuses = new Set<number>();
	const codes = new Set<string>();
	const messages = new Set<string>();
	const stack = [error];
	const visited = new Set<unknown>();

	while (stack.length) {
		const current = stack.pop();
		if (current == null) {
			continue;
		}
		if (typeof current === "string") {
			messages.add(current);
			continue;
		}
		if (typeof current !== "object") {
			continue;
		}
		if (visited.has(current)) {
			continue;
		}
		visited.add(current);

		if (Array.isArray(current)) {
			for (const entry of current) {
				stack.push(entry);
			}
			continue;
		}

		const errorObj = current as ErrorWithStatus;

		const candidateStatuses = [
			errorObj.status,
			errorObj.statusCode,
			errorObj.status_code,
			errorObj.responseStatus,
			errorObj.statusText,
			(errorObj.response as Record<string, unknown>)?.status,
			(errorObj.response as Record<string, unknown>)?.statusCode,
			(errorObj.response as Record<string, unknown>)?.status_code,
			(errorObj.response as ErrorWithStatus)?.response?.status,
			(errorObj.response as ErrorWithStatus)?.error?.status,
			errorObj.error?.status,
			errorObj.error?.statusCode,
			errorObj.error?.status_code,
			errorObj.originalError?.status,
			errorObj.originalError?.statusCode,
			errorObj.originalError?.status_code,
			errorObj.data?.status,
			errorObj.data?.statusCode,
			errorObj.data?.status_code,
		];

		for (const candidate of candidateStatuses) {
			const normalized = normalizeStatusCode(candidate);
			if (normalized != null) {
				statuses.add(normalized);
			}
		}

		const candidateCodes = [
			errorObj.code,
			errorObj.sqlState,
			errorObj.error?.code,
			(errorObj.response as ErrorWithStatus)?.code,
			(errorObj.response as ErrorWithStatus)?.error?.code,
			errorObj.data?.code,
			errorObj.originalError?.code,
		];

		for (const candidate of candidateCodes) {
			if (candidate == null) {
				continue;
			}
			const normalized = String(candidate).trim().toUpperCase();
			if (normalized) {
				codes.add(normalized);
			}
		}

		const messageKeys: (keyof ErrorWithStatus)[] = [
			"message",
			"error",
			"error_description",
			"errorMessage",
			"error_message",
			"hint",
			"details",
			"detail",
			"description",
			"body",
			"msg",
			"responseText",
		];

		for (const key of messageKeys) {
			const value = errorObj[key];
			if (typeof value === "string") {
				messages.add(value);
			}
		}

		for (const value of Object.values(current)) {
			if (value && typeof value === "object") {
				stack.push(value);
			} else if (typeof value === "string") {
				messages.add(value);
			}
		}
	}

	return {
		statuses: [...statuses],
		codes: [...codes],
		messages: [...messages].map((message) => message.toLowerCase()),
	};
};

const isMissingResourceError = (error: unknown): boolean => {
	if (!error) {
		return false;
	}
	const { statuses, codes, messages } = extractErrorMetadata(error);

	const normalizedStatuses = statuses
		.map((value) => normalizeStatusCode(value))
		.filter((value) => value != null);
	const normalizedCodes = codes
		.map((value) => String(value).trim().toUpperCase())
		.filter((value) => value.length > 0);

	const statusIndicatesMissing = normalizedStatuses.some((value) => value === 404 || value === 410);
	const knownMissingCodes = new Set([
		"404",
		"PGRST301",
		"PGRST303",
		"PGRST304",
		"PGRST404",
		"42P01",
		"42704",
		"42883",
	]);
	const codeIndicatesMissing = normalizedCodes.some((value) => knownMissingCodes.has(value));

	const missingMessagePatterns = [
		"does not exist",
		"not found",
		"missing from the schema",
		"undefined table",
		"undefined function",
		"unknown function",
		"no function matches the given name and argument types",
		'relation "',
	];
	const messageIndicatesMissing = messages.some((message) =>
		missingMessagePatterns.some((pattern) => message.includes(pattern)),
	);

	return statusIndicatesMissing || codeIndicatesMissing || messageIndicatesMissing;
};

const isRpcParameterMismatchError = (error: unknown): boolean => {
	if (!error) {
		return false;
	}
	const { codes, messages } = extractErrorMetadata(error);
	const mismatchCodes = new Set(["42883", "42703"]);
	if (codes.some((value) => mismatchCodes.has(value))) {
		return true;
	}

	const parameterMismatchPatterns = [
		"missing required input parameter",
		"unexpected parameter",
		"unexpected key",
		"invalid parameter",
		"invalid input syntax",
		"required parameter",
		"function has_role(",
	];
	return messages.some((message) =>
		parameterMismatchPatterns.some((pattern) => message.includes(pattern)),
	);
};

const isUuid = (value: unknown): boolean =>
	typeof value === "string" &&
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/* ==========================================================================
   CLIENT STATE MANAGEMENT
   ========================================================================== */

interface ClientState {
	canUseRoleRpc: boolean;
	preferredRoleSource: string;
	disabledSources: Set<string>;
}

const clientStateMap = new WeakMap<object, ClientState>();

const getClientState = (client: object | null) => {
	if (!client) {
		return {
			canUseRoleRpc: false,
			preferredRoleSource: ROLE_SOURCES[0],
			disabledSources: new Set<string>(),
		};
	}
	let state = clientStateMap.get(client);
	if (!state) {
		state = {
			canUseRoleRpc: true,
			preferredRoleSource: ROLE_SOURCES[0],
			disabledSources: new Set<string>(),
		};
		clientStateMap.set(client, state);
	}
	return state;
};

const markSourceSuccessful = (state: ClientState | undefined, source: string) => {
	if (!state) {
		return;
	}
	state.disabledSources.delete(source);
	state.preferredRoleSource = source;
};

const markSourceUnavailable = (state: ClientState | undefined, source: string) => {
	if (!state) {
		return;
	}
	state.disabledSources.add(source);
	if (state.preferredRoleSource === source) {
		const fallback = ROLE_SOURCES.find(
			(candidate) => candidate !== source && !state.disabledSources.has(candidate),
		);
		if (fallback) {
			state.preferredRoleSource = fallback;
		}
	}
};

const getRoleSourceOrder = (state: ClientState | undefined) => {
	if (!state) {
		return [...ROLE_SOURCES];
	}
	const orderedSources = new Set();
	const preferred =
		state.preferredRoleSource && !state.disabledSources.has(state.preferredRoleSource)
			? state.preferredRoleSource
			: ROLE_SOURCES.find((source) => !state.disabledSources.has(source));

	if (preferred) {
		orderedSources.add(preferred);
	} else if (state.preferredRoleSource) {
		orderedSources.add(state.preferredRoleSource);
	}

	for (const source of ROLE_SOURCES) {
		if (!state.disabledSources.has(source)) {
			orderedSources.add(source);
		}
	}
	for (const source of ROLE_SOURCES) {
		orderedSources.add(source);
	}

	return [...orderedSources];
};

const handleRoleResponse = (
	data: Record<string, unknown> | null,
	error: unknown,
	source: string,
	state: ClientState | undefined,
	roleKey: string,
) => {
	if (error) {
		if (isMissingResourceError(error)) {
			markSourceUnavailable(state, source);
			return { role: null, handled: true };
		}
		throw error;
	}
	markSourceSuccessful(state, source);
	return { role: data?.[roleKey] ?? null, handled: false };
};

const fetchRoleFromSource = async (
	activeSupabase: SupabaseClient<Database> | null,
	userName: string,
	source: string,
	state: ClientState | undefined,
) => {
	if (!activeSupabase) {
		return { role: null, handled: true };
	}

	const trimmedUserName = userName.trim?.() ?? userName;

	if (source === "user_roles") {
		const { data, error } = await (activeSupabase as SupabaseClient)
			// biome-ignore lint/suspicious/noExplicitAny: Database schema dynamic
			.from("cat_user_roles" as any)
			.select("role")
			.eq("user_name", trimmedUserName)
			.order("role", { ascending: false })
			.limit(1)
			.maybeSingle();

		return handleRoleResponse(data as Record<string, unknown> | null, error, source, state, "role");
	}

	return { role: null, handled: true };
};

const fetchUserRole = async (activeSupabase: SupabaseClient<Database> | null, userName: string) => {
	const state = getClientState(activeSupabase);
	const sources = getRoleSourceOrder(state);

	for (const source of sources) {
		try {
			const result = await fetchRoleFromSource(activeSupabase, userName, source as string, state);
			if (result?.handled) {
				continue;
			}
			if (result?.role) {
				return normalizeRole(result.role as string);
			}
		} catch (error) {
			if (import.meta.env.DEV) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				console.error(`Error fetching user role from Supabase source "${source}": ${errorMsg}`);
			}
		}
	}
	return null;
};

async function _hasRole(userName: string, requiredRole: string): Promise<boolean> {
	if (!userName || !requiredRole) {
		return false;
	}

	const activeSupabase = await resolveSupabaseClient();
	if (!activeSupabase) {
		if (process.env.NODE_ENV === "development") {
			console.warn("Supabase client is not configured. Role check will default to false.");
		}
		return false;
	}

	try {
		const trimmedUserName = userName.trim?.() ?? userName;
		const normalizedRequiredRole = normalizeRole(requiredRole);
		const state = getClientState(activeSupabase);

		if (!normalizedRequiredRole) {
			return false;
		}

		if (state?.canUseRoleRpc) {
			const rpcPayloads: Record<string, string>[] = [
				{ _user_name: trimmedUserName, _role: normalizedRequiredRole },
			];

			if (isUuid(trimmedUserName)) {
				rpcPayloads.push({ _user_id: trimmedUserName, _role: normalizedRequiredRole });
			}

			// biome-ignore lint/suspicious/noExplicitAny: PostgrestError type varies
			let lastRpcError: any = null;

			for (const payload of rpcPayloads) {
				const { data, error } = await activeSupabase.rpc(
					"has_role",
					// biome-ignore lint/suspicious/noExplicitAny: has_role has multiple overloads
					payload as any,
				);

				if (!error) {
					return data === true;
				}
				lastRpcError = error;

				if (isRpcParameterMismatchError(error)) {
					continue;
				}
				if (isMissingResourceError(error)) {
					state.canUseRoleRpc = false;
					break;
				}

				const errorWithMessage =
					error instanceof Error
						? error
						: new Error(
								((error as Record<string, unknown>)?.message as string) ||
									((error as Record<string, unknown>)?.hint as string) ||
									((error as Record<string, unknown>)?.detail as string) ||
									"Failed to check user role",
							);
				throw errorWithMessage;
			}

			if (lastRpcError && isMissingResourceError(lastRpcError)) {
				state.canUseRoleRpc = false;
			}
		}

		const userRole = await fetchUserRole(activeSupabase, trimmedUserName);
		if (!userRole) {
			return false;
		}

		return compareRoles(userRole, normalizedRequiredRole);
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			console.error("Error checking user role:", error);
		}
		return false;
	}
}

/* ==========================================================================
   EXPORTED FUNCTIONS
   ========================================================================== */

export async function isUserAdmin(userIdOrName: string): Promise<boolean> {
	return _hasRole(userIdOrName, USER_ROLES.ADMIN);
}

/* ==========================================================================
   ADMIN API
   ========================================================================== */

export const adminAPI = {
	listUsers: async ({ searchTerm, limit = 200 }: { searchTerm?: string; limit?: number } = {}) => {
		return withSupabase(
			async (client) => {
				let query = client
					.from("cat_app_users")
					.select("user_name, updated_at", { count: "exact" });

				if (searchTerm) {
					query = query.ilike("user_name", `%${searchTerm}%`);
				}

				const { data, count, error } = await query
					.order("user_name", { ascending: true })
					.limit(limit);

				if (error) {
					console.error("Error listing users:", error);
					return { users: [], count: 0 };
				}

				if (data && data.length > 0) {
					const userNames = data.map((u) => u.user_name);
					const { data: roles, error: rolesError } = await client
						// biome-ignore lint/suspicious/noExplicitAny: Database schema dynamic
						.from("cat_user_roles" as any)
						.select("user_name, role")
						.in("user_name", userNames);

					if (!rolesError && roles) {
						const typedRoles = roles as unknown as { user_name: string; role: string }[];
						const roleMap = new Map(typedRoles.map((r) => [r.user_name, r.role]));
						return {
							users: data.map((u) => ({
								...u,
								role: roleMap.get(u.user_name) || "user",
							})),
							count: count || 0,
						};
					}
				}

				return {
					users: (data || []).map((u) => ({ ...u, role: "user" })),
					count: count || 0,
				};
			},
			{ users: [], count: 0 },
		);
	},
};

/* ==========================================================================
   HOOKS
   ========================================================================== */

export function useAdminStatus(userName: string | null) {
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<unknown>(null);

	useEffect(() => {
		let isMounted = true;

		const checkAdminStatus = async () => {
			if (!userName) {
				if (isMounted) {
					setIsAdmin(false);
					setIsLoading(false);
				}
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const adminStatus = await isUserAdmin(userName);
				if (isMounted) {
					setIsAdmin(adminStatus);
				}
			} catch (err) {
				if (isMounted) {
					if (process.env.NODE_ENV === "development") {
						console.error("Error checking admin status:", err);
					}
					setIsAdmin(false);
					setError(err);
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		checkAdminStatus();
		return () => {
			isMounted = false;
		};
	}, [userName]);

	return { isAdmin, isLoading, error };
}

function useCatFact() {
	const [catFact, setCatFact] = useState<string | null>(null);

	useEffect(() => {
		const fetchCatFact = async () => {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

			try {
				const response = await fetch(CAT_FACT_API_URL, { signal: controller.signal });
				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const catFactData = await response.json();
				if (catFactData && typeof catFactData.fact === "string") {
					setCatFact(catFactData.fact);
				} else {
					throw new Error("Invalid response format from cat fact API");
				}
			} catch (error: unknown) {
				const err = error as Error;
				if (err.name !== "AbortError" && err.name !== "TimeoutError") {
					ErrorManager.handleError(error, "Fetch Cat Fact", {
						isRetryable: true,
						affectsUserData: false,
						isCritical: false,
					});
				}
				setCatFact(FALLBACK_CAT_FACT);
			}
		};

		fetchCatFact();
	}, []);

	return catFact;
}

const LoginFormSchema = z.object({
	name: z
		.string()
		.min(VALIDATION.MIN_USERNAME_LENGTH || 2, "Name must be at least 2 characters")
		.max(VALIDATION.MAX_USERNAME_LENGTH || 30, "Name must be under 30 characters")
		.regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, - and _ are allowed"),
});

export function useLoginController(onLogin: (name: string) => Promise<void> | void) {
	const [globalError, setGlobalError] = useState("");
	const catFact = useCatFact();

	const form = useValidatedForm<typeof LoginFormSchema.shape>({
		schema: LoginFormSchema,
		initialValues: { name: "" },
		onSubmit: async (values: z.infer<typeof LoginFormSchema>) => {
			try {
				setGlobalError("");
				await onLogin(values.name);
				playSound("level-up");
			} catch (err) {
				const formattedError = ErrorManager.handleError(err, "User Login", {
					isRetryable: true,
					affectsUserData: false,
					isCritical: false,
				});
				const error = err as Error;
				setGlobalError(
					formattedError.userMessage ||
						error.message ||
						"Unable to log in. Please check your connection and try again.",
				);
				throw err;
			}
		},
	});

	const {
		values,
		errors,
		touched,
		isSubmitting,
		handleChange,
		handleBlur,
		handleSubmit,
		setValues,
	} = form;

	const handleNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			handleChange("name", e.target.value);
			if (globalError) {
				setGlobalError("");
			}
		},
		[handleChange, globalError],
	);

	useEffect(() => {
		try {
			const savedUser = localStorage.getItem(STORAGE_KEYS.USER_STORAGE);
			if (savedUser) {
				const parsed = JSON.parse(savedUser);
				const name = parsed?.state?.user?.name;
				if (name && typeof name === "string" && !values.name) {
					setValues({ name });
				}
			}
		} catch {
			// Ignore storage errors
		}
	}, [setValues, values.name]);

	const handleRandomName = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		const funName = generateFunName();
		setValues({ name: funName });
		if (globalError) {
			setGlobalError("");
		}
		playSound("surprise");
	}, [isSubmitting, globalError, setValues]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				void handleSubmit();
			}
		},
		[handleSubmit],
	);

	return {
		name: values.name,
		setName: (val: string) => setValues({ name: val }),
		isLoading: isSubmitting,
		error: errors.name || globalError,
		touched: touched.name,
		handleNameChange,
		handleBlur,
		handleSubmit,
		handleRandomName,
		handleKeyDown,
		clearError: () => setGlobalError(""),
		catFact,
	};
}

/* ==========================================================================
   USER SESSION HOOK (Consolidated)
   ========================================================================== */

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

		await (activeSupabase as any).rpc("set_user_context", {
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

export function useUserSession({
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
				.catch((error) => {
					// Log error but don't fail - user can still function without admin status
					if (import.meta.env.DEV) {
						console.warn("Failed to check admin status:", error);
					}
					userActions.setAdminStatus(false);
				});
		} else {
			// * Auto-login as guest if no user found
			import("@utils")
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
					const { error: rpcError } = await (activeSupabase as any).rpc("create_user_account", {
						p_user_name: trimmedName,
						p_preferences: {
							sound_enabled: true,
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
