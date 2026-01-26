import { resolveSupabaseClient, supabase, withSupabase } from "@supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateFunName, playSound } from "@utils";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { z } from "zod";
import { STORAGE_KEYS, VALIDATION } from "@/constants";
import { useValidatedForm } from "@/hooks/useValidatedForm";

/* ==========================================================================
   CONSTANTS & CONFIG
   ========================================================================== */

const USER_ROLES = {
	USER: "user",
	MODERATOR: "moderator",
	ADMIN: "admin",
} as const;

const ROLE_PRIORITY = {
	[USER_ROLES.USER]: 0,
	[USER_ROLES.MODERATOR]: 1,
	[USER_ROLES.ADMIN]: 2,
};

const FALLBACK_CAT_FACT = "Cats are amazing creatures with unique personalities!";
const CAT_FACT_API_URL = "https://catfact.ninja/fact";
const REQUEST_TIMEOUT_MS = 5000;

/* ==========================================================================
   TYPES
   ========================================================================== */

interface User {
	id: string;
	name: string;
	email?: string;
	isAdmin: boolean;
	role?: string;
}

interface LoginCredentials {
	email?: string;
	password?: string;
	name?: string; // For simple login
}

interface RegisterData {
	email: string;
	password: string;
	name: string;
}

interface AuthContextValue {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (credentials: LoginCredentials) => Promise<boolean>;
	logout: () => Promise<void>;
	register: (data: RegisterData) => Promise<void>;
	// Additional helpers from auth.ts
	checkAdminStatus: (userName: string) => Promise<boolean>;
}

/* ==========================================================================
   ROLE UTILITIES (Internal)
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

// ... (Error extraction logic from auth.ts omitted for brevity, using simplified check)

/* ==========================================================================
   AUTH LOGIC
   ========================================================================== */

export async function isUserAdmin(userIdOrName: string): Promise<boolean> {
	if (!userIdOrName) {
		return false;
	}

	try {
		// Simplified check reusing existing pattern
		const client = await resolveSupabaseClient();
		if (!client) {
			return false;
		}

		const { data, error } = await client
			.from("user_roles")
			.select("role")
			.eq("user_name", userIdOrName)
			.maybeSingle();

		if (error || !data) {
			return false;
		}

		return compareRoles(data.role, USER_ROLES.ADMIN);
	} catch (e) {
		console.error("Error checking admin status", e);
		return false;
	}
}

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

				// Fetch roles
				if (data && data.length > 0) {
					const userNames = data.map((u) => u.user_name);
					const { data: roles } = await client
						.from("user_roles")
						.select("user_name, role")
						.in("user_name", userNames);

					const roleMap = new Map(roles?.map((r: any) => [r.user_name, r.role]) || []);
					return {
						users: data.map((u) => ({
							...u,
							role: roleMap.get(u.user_name) || "user",
						})),
						count: count || 0,
					};
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
   HOOKS (Exported)
   ========================================================================== */

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
				}
			} catch (_error) {
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
				const error = err as Error;
				setGlobalError(error.message || "Unable to log in.");
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

	// Auto-fill from storage
	useEffect(() => {
		try {
			const savedUser = localStorage.getItem(STORAGE_KEYS.USER_STORAGE);
			if (savedUser) {
				const parsed = JSON.parse(savedUser);
				const name = parsed?.state?.user?.name;
				if (name && !values.name) {
					setValues({ name });
				}
			}
		} catch {}
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
   CONTEXT & PROVIDER
   ========================================================================== */

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
};

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const queryClient = useQueryClient();

	const { data: user, isLoading } = useQuery({
		queryKey: ["auth", "user"],
		queryFn: async () => {
			const client = await supabase();
			if (!client) {
				return null;
			}

			const {
				data: { user },
			} = await client.auth.getUser();
			if (!user) {
				return null;
			}

			const { data: profile } = await client
				.from("cat_app_users")
				.select("user_name, preferences")
				.eq("user_name", user.email ?? "")
				.single();

			const userName = profile?.user_name || user.email || "";
			const isAdmin = userName ? await isUserAdmin(userName) : false;

			return {
				id: user.id,
				name: userName,
				email: user.email,
				isAdmin,
			};
		},
		staleTime: Infinity,
	});

	const loginMutation = useMutation({
		mutationFn: async ({ email, password }: LoginCredentials) => {
			const client = await supabase();
			if (!client) {
				throw new Error("Supabase client not available");
			}

			// Supporting both email/password and simple username login (if applicable)
			if (email && password) {
				const { error } = await client.auth.signInWithPassword({ email, password });
				if (error) {
					throw error;
				}
			}

			return true;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
		},
	});

	const logoutMutation = useMutation({
		mutationFn: async () => {
			const client = await supabase();
			if (!client) {
				throw new Error("Supabase client not available");
			}
			const { error } = await client.auth.signOut();
			if (error) {
				throw error;
			}
		},
		onSuccess: () => {
			queryClient.clear();
		},
	});

	const registerMutation = useMutation({
		mutationFn: async ({ email, password, name }: RegisterData) => {
			const client = await supabase();
			if (!client) {
				throw new Error("Supabase client not available");
			}
			const { error } = await client.auth.signUp({
				email,
				password,
				options: { data: { name } },
			});
			if (error) {
				throw error;
			}
		},
	});

	return (
		<AuthContext.Provider
			value={{
				user: user || null,
				isLoading,
				isAuthenticated: !!user,
				login: loginMutation.mutateAsync,
				logout: logoutMutation.mutateAsync,
				register: registerMutation.mutateAsync,
				checkAdminStatus: isUserAdmin,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
