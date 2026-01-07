import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { createContext, useContext } from "react";
import { supabase } from "../services/supabase/client";
import { isUserAdmin } from "../utils/core/auth";

interface User {
	id: string;
	name: string;
	email?: string;
	isAdmin: boolean;
}

interface AuthContextValue {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (credentials: LoginCredentials) => Promise<void>;
	logout: () => Promise<void>;
	register: (data: RegisterData) => Promise<void>;
}

interface LoginCredentials {
	email: string;
	password: string;
}

interface RegisterData {
	email: string;
	password: string;
	name: string;
}

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
			const {
				data: { user },
			} = await client.auth.getUser();
			if (!user) {
				return null;
			}

			// Get user profile data
			const { data: profile } = await client
				.from("cat_app_users")
				.select("user_name, preferences")
				.eq("user_name", user.email)
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
			const { error } = await client.auth.signInWithPassword({
				email,
				password,
			});
			if (error) {
				throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
		},
	});

	const logoutMutation = useMutation({
		mutationFn: async () => {
			const client = await supabase();
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
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: { name },
				},
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
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
