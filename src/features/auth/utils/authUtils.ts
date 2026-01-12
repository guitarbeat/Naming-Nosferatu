import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveSupabaseClient } from "../../../shared/services/supabase/client";
import type { Database } from "../../../shared/services/supabase/types";

// Constants use UPPER_CASE keys (intentional for role constants)
const USER_ROLES = {
	USER: "user",
	MODERATOR: "moderator",
	ADMIN: "admin",
} as const;

// Database table name - snake_case required
const ROLE_SOURCES = ["user_roles"] as const;

const ROLE_PRIORITY = {
	[USER_ROLES.USER]: 0,
	[USER_ROLES.MODERATOR]: 1,
	[USER_ROLES.ADMIN]: 2,
};

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

/**
 * Error object structure matching various error sources (HTTP, database, etc.)
 * Snake_case fields match actual error object properties from different sources
 */
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
	// Common error properties - snake_case matches actual error object structures
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

		// Use type assertion to a structural interface
		const obj = current as ErrorWithStatus;

		// Extract Statuses
		const candidateStatuses = [
			obj.status,
			obj.statusCode,
			obj.status_code,
			obj.responseStatus,
			obj.statusText,
			(obj.response as Record<string, unknown>)?.status,
			(obj.response as Record<string, unknown>)?.statusCode,
			(obj.response as Record<string, unknown>)?.status_code,
			// Deep nested checks
			(obj.response as ErrorWithStatus)?.response?.status,
			(obj.response as ErrorWithStatus)?.error?.status,
			obj.error?.status,
			obj.error?.statusCode,
			obj.error?.status_code,
			obj.originalError?.status,
			obj.originalError?.statusCode,
			obj.originalError?.status_code,
			obj.data?.status,
			obj.data?.statusCode,
			obj.data?.status_code,
		];

		for (const candidate of candidateStatuses) {
			const normalized = normalizeStatusCode(candidate);
			if (normalized != null) {
				statuses.add(normalized);
			}
		}

		// Extract Codes
		const candidateCodes = [
			obj.code,
			obj.sqlState,
			obj.error?.code,
			(obj.response as ErrorWithStatus)?.code,
			(obj.response as ErrorWithStatus)?.error?.code,
			obj.data?.code,
			obj.originalError?.code,
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

		// Extract Messages
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
			const value = obj[key];
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
		// user_roles table exists in DB but may not be in auto-generated types
		const { data, error } = await (activeSupabase as SupabaseClient)
			.from("user_roles")
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
			// Log the error but continue trying other sources
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
				rpcPayloads.push({
					_user_id: trimmedUserName,
					_role: normalizedRequiredRole,
				});
			}

			// biome-ignore lint/suspicious/noExplicitAny: PostgrestError type varies
			let lastRpcError: any = null;

			for (const payload of rpcPayloads) {
				const { data, error } = await activeSupabase.rpc(
					"has_role",
					// biome-ignore lint/suspicious/noExplicitAny: has_role has multiple overloads, type system can't infer correct one
					payload as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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

				// Create a proper error with a message if the error doesn't have one
				const errorWithMessage = error instanceof Error ? error : new Error(
					(error as Record<string, unknown>)?.message as string ||
					(error as Record<string, unknown>)?.hint as string ||
					(error as Record<string, unknown>)?.detail as string ||
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
		// Return false on error instead of throwing to prevent app crashes
		return false;
	}
}

export async function isUserAdmin(userIdOrName: string): Promise<boolean> {
	return _hasRole(userIdOrName, USER_ROLES.ADMIN);
}
