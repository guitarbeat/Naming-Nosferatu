import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type {
	AuthAdapter,
	AuthContextValue,
	LoginCredentials,
	RegisterData,
} from "@/app/providers/providerTypes";

const noopAdapter: AuthAdapter = {
	getCurrentUser: async () => null,
	login: async () => false,
	logout: async () => {
		/* No-op: Auth not implemented */
	},
	register: async () => {
		/* No-op: Auth not implemented */
	},
	checkAdminStatus: async () => false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error(
			"useAuth must be used within <Providers>. Wrap your component tree with <Providers> in main.tsx.",
		);
	}

	return context;
}

function useAuthProvider(adapter: AuthAdapter): AuthContextValue {
	const [user, setUser] = useState<AuthContextValue["user"]>(null);
	const [isLoading, setIsLoading] = useState(true);
	const adapterRef = useRef(adapter);
	adapterRef.current = adapter;

	useEffect(() => {
		let cancelled = false;

		adapterRef.current
			.getCurrentUser()
			.then((nextUser) => {
				if (!cancelled) {
					setUser(nextUser);
				}
			})
			.catch((error) => {
				console.error("[Providers] Failed to fetch current user:", error);
			})
			.finally(() => {
				if (!cancelled) {
					setIsLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
		try {
			const success = await adapterRef.current.login(credentials);
			if (success) {
				const updatedUser = await adapterRef.current.getCurrentUser();
				setUser(updatedUser);
			}
			return success;
		} catch (error) {
			console.error("[Providers] Login failed:", error);
			throw error;
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			await adapterRef.current.logout();
			setUser(null);
		} catch (error) {
			console.error("[Providers] Logout failed:", error);
			throw error;
		}
	}, []);

	const register = useCallback(async (data: RegisterData) => {
		await adapterRef.current.register(data);
	}, []);

	const checkAdminStatus = useCallback(async (userIdOrName: string) => {
		return adapterRef.current.checkAdminStatus(userIdOrName);
	}, []);

	return useMemo(
		() => ({
			user,
			isLoading,
			isAuthenticated: user !== null,
			login,
			logout,
			register,
			checkAdminStatus,
		}),
		[user, isLoading, login, logout, register, checkAdminStatus],
	);
}

interface AuthProviderProps {
	children: ReactNode;
	adapter?: AuthAdapter;
}

export function AuthProvider({ children, adapter = noopAdapter }: AuthProviderProps) {
	const value = useAuthProvider(adapter);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
