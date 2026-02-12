/**
 * @module Providers
 * @description Consolidated provider components for authentication and toast notifications.
 * Combines AuthProvider and ToastProvider into a single source of truth.
 */

import { resolveSupabaseClient, supabase, updateSupabaseUserContext } from "@supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { type IToastItem, ToastContainer } from "@/layout/FeedbackComponents";

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
   AUTH TYPES
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
	checkAdminStatus: (userName: string) => Promise<boolean>;
}

/* ==========================================================================
   TOAST TYPES
   ========================================================================== */

type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
	duration?: number;
	autoDismiss?: boolean;
}

interface ToastContextValue {
	showToast: (message: string, type?: ToastType, options?: ToastOptions) => string;
	hideToast: (id: string) => void;
	clearToasts: () => void;
	showSuccess: (message: string, options?: ToastOptions) => string;
	showError: (message: string, options?: ToastOptions) => string;
	showInfo: (message: string, options?: ToastOptions) => string;
	showWarning: (message: string, options?: ToastOptions) => string;
	toasts: IToastItem[];
	removeToast: (id: string) => void;
}

/* ==========================================================================
   AUTH ROLE UTILITIES
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

async function isUserAdmin(userIdOrName: string): Promise<boolean> {
	if (!userIdOrName) {
		return false;
	}

	try {
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
   AUTH CONTEXT & HOOK
   ========================================================================== */

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within Providers (AuthProvider)");
	}
	return context;
};

/* ==========================================================================
   TOAST CONTEXT & HOOK
   ========================================================================== */

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error(
			"useToast must be used within Providers (ToastProvider). Ensure Providers wraps the component tree in main.tsx.",
		);
	}
	return context;
};

/* ==========================================================================
   COMBINED PROVIDERS
   ========================================================================== */

interface ProvidersProps {
	children: React.ReactNode;
	toastMaxToasts?: number;
	toastDefaultDuration?: number;
	toastPosition?:
		| "top-left"
		| "top-center"
		| "top-right"
		| "bottom-left"
		| "bottom-center"
		| "bottom-right";
}

export const Providers: React.FC<ProvidersProps> = ({
	children,
	toastMaxToasts = 5,
	toastDefaultDuration = 5000,
	toastPosition = "top-right",
}) => {
	const queryClient = useQueryClient();

	/* ========================================================================
	   AUTH PROVIDER LOGIC
	   ======================================================================== */

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
				console.error("Providers: Error in auth query", error);
				return null;
			}
		},
		staleTime: Infinity,
		retry: false,
	});

	const loginMutation = useMutation({
		mutationFn: async ({ email, password, name }: LoginCredentials) => {
			const client = await supabase();
			if (!client) {
				throw new Error("Supabase client not available");
			}

			if (email && password) {
				const { error } = await client.auth.signInWithPassword({ email, password });
				if (error) {
					throw error;
				}
				return true;
			}

			if (name) {
				try {
					const { data: existingUser } = await client
						.from("cat_app_users")
						.select("user_name")
						.eq("user_name", name)
						.single();

					if (!existingUser) {
						const { error: insertError } = await client
							.from("cat_app_users")
							.insert({ user_name: name });
						if (insertError) {
							console.error("Error creating user:", insertError);
							throw insertError;
						}
					}

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

	const authValue: AuthContextValue = {
		user: user || null,
		isLoading,
		isAuthenticated: !!user,
		login: loginMutation.mutateAsync,
		logout: logoutMutation.mutateAsync,
		register: registerMutation.mutateAsync,
		checkAdminStatus: isUserAdmin,
	};

	/* ========================================================================
	   TOAST PROVIDER LOGIC
	   ======================================================================== */

	const [toasts, setToasts] = useState<IToastItem[]>([]);

	const generateId = useCallback(() => {
		return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}, []);

	const showToast = useCallback(
		(message: string, type: ToastType = "info", options: ToastOptions = {}): string => {
			const id = generateId();
			const newToast: IToastItem = {
				id,
				message,
				type,
				duration: options.duration ?? toastDefaultDuration,
				autoDismiss: options.autoDismiss ?? true,
			};

			setToasts((prev) => {
				const updated = [newToast, ...prev];
				return updated.slice(0, toastMaxToasts);
			});

			return id;
		},
		[generateId, toastDefaultDuration, toastMaxToasts],
	);

	const hideToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const clearToasts = useCallback(() => {
		setToasts([]);
	}, []);

	const showSuccess = useCallback(
		(message: string, options?: ToastOptions) => showToast(message, "success", options),
		[showToast],
	);

	const showError = useCallback(
		(message: string, options?: ToastOptions) => showToast(message, "error", options),
		[showToast],
	);

	const showInfo = useCallback(
		(message: string, options?: ToastOptions) => showToast(message, "info", options),
		[showToast],
	);

	const showWarning = useCallback(
		(message: string, options?: ToastOptions) => showToast(message, "warning", options),
		[showToast],
	);

	const toastValue: ToastContextValue = {
		showToast,
		hideToast,
		clearToasts,
		showSuccess,
		showError,
		showInfo,
		showWarning,
		toasts,
		removeToast: hideToast,
	};

	/* ========================================================================
	   RENDER COMBINED PROVIDERS
	   ======================================================================== */

	return (
		<AuthContext.Provider value={authValue}>
			<ToastContext.Provider value={toastValue}>
				{children}
				<ToastContainer
					toasts={toasts}
					removeToast={hideToast}
					position={toastPosition}
					maxToasts={toastMaxToasts}
				/>
			</ToastContext.Provider>
		</AuthContext.Provider>
	);
};

/* ==========================================================================
   LEGACY EXPORTS FOR BACKWARD COMPATIBILITY
   ========================================================================== */

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<Providers>{children}</Providers>
);

export const ToastProvider: React.FC<ProvidersProps> = (props) => <Providers {...props} />;
