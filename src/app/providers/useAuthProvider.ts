import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
	AuthAdapter,
	AuthContextValue,
	AuthUser,
	LoginCredentials,
	RegisterData,
} from "./providerTypes";

export function useAuthProvider(adapter: AuthAdapter): AuthContextValue {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const adapterRef = useRef(adapter);
	adapterRef.current = adapter;

	useEffect(() => {
		let cancelled = false;

		adapterRef.current
			.getCurrentUser()
			.then((u) => {
				if (!cancelled) {
					setUser(u);
				}
			})
			.catch((err) => {
				console.error("[Providers] Failed to fetch current user:", err);
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
				const updated = await adapterRef.current.getCurrentUser();
				setUser(updated);
			}
			return success;
		} catch (err) {
			console.error("[Providers] Login failed:", err);
			throw err;
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			await adapterRef.current.logout();
			setUser(null);
		} catch (err) {
			console.error("[Providers] Logout failed:", err);
			throw err;
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
