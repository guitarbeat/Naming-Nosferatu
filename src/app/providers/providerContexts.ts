import { createContext, useContext } from "react";
import type { AuthContextValue, ToastContextValue } from "./providerTypes";

export const AuthContext = createContext<AuthContextValue | null>(null);
export const ToastContext = createContext<ToastContextValue | null>(null);

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error(
			"useAuth must be used within <Providers>. " +
				"Wrap your component tree with <Providers> in main.tsx.",
		);
	}
	return ctx;
}

export function useToast(): ToastContextValue {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		throw new Error(
			"useToast must be used within <Providers>. " +
				"Wrap your component tree with <Providers> in main.tsx.",
		);
	}
	return ctx;
}
