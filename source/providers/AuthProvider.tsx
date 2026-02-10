import { resolveSupabaseClient, supabase } from "@supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { createContext, useContext } from "react";

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

async function isUserAdmin(userIdOrName: string): Promise<boolean> {
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
			try {
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
			} catch (error) {
				console.error("AuthProvider: Error in auth query", error);
				return null;
			}
		},
		staleTime: Infinity,
		retry: false, // Don't retry on error to avoid infinite loops
	});

	const loginMutation = useMutation({
		mutationFn: async ({ email, password, name }: LoginCredentials) => {
			const client = await supabase();
			if (!client) {
				throw new Error("Supabase client not available");
			}

			// Supporting both email/password and simple username login
			if (email && password) {
				const { error } = await client.auth.signInWithPassword({ email, password });
				if (error) {
					throw error;
				}
				return true;
			}

			// Name-based login: ensure user exists in cat_app_users table
			if (name) {
				try {
					const { data: existingUser } = await client
						.from("cat_app_users")
						.select("user_name")
						.eq("user_name", name)
						.single();

					// Create user if doesn't exist
					if (!existingUser) {
						const { error: insertError } = await client
							.from("cat_app_users")
							.insert({ user_name: name });
						if (insertError) {
							console.error("Error creating user:", insertError);
							throw insertError;
						}
					}

					// Update Supabase context with the username
					await updateSupabaseUserContext(name);
					return true;
				} catch (error) {
					console.error("Error during name-based login:", error);
					throw error;
				}
			}

			throw new Error("No valid login credentials provided");
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
