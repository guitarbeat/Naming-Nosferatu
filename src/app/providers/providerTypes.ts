import type { ReactNode } from "react";

export const DEFAULT_TOAST_DURATION_MS = 5000;
export const DEFAULT_MAX_TOASTS = 5;

export interface AuthUser {
	id: string;
	name: string;
	email?: string;
	isAdmin: boolean;
	role?: "user" | "moderator" | "admin";
}

export interface LoginCredentials {
	email?: string;
	password?: string;
	name?: string;
}

export interface RegisterData {
	email: string;
	password: string;
	name: string;
}

export interface AuthAdapter {
	getCurrentUser: () => Promise<AuthUser | null>;
	login: (credentials: LoginCredentials) => Promise<boolean>;
	logout: () => Promise<void>;
	register: (data: RegisterData) => Promise<void>;
	checkAdminStatus: (userIdOrName: string) => Promise<boolean>;
}

export interface AuthContextValue {
	user: AuthUser | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (credentials: LoginCredentials) => Promise<boolean>;
	logout: () => Promise<void>;
	register: (data: RegisterData) => Promise<void>;
	checkAdminStatus: (userIdOrName: string) => Promise<boolean>;
}

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
	duration?: number;
	autoDismiss?: boolean;
}

export interface ToastItem {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
	autoDismiss: boolean;
	createdAt: number;
}

export interface ToastContextValue {
	toasts: ToastItem[];
	showToast: (message: string, type?: ToastType, options?: ToastOptions) => string;
	hideToast: (id: string) => void;
	clearToasts: () => void;
	showSuccess: (message: string, options?: ToastOptions) => string;
	showError: (message: string, options?: ToastOptions) => string;
	showInfo: (message: string, options?: ToastOptions) => string;
	showWarning: (message: string, options?: ToastOptions) => string;
}

export type ToastPosition =
	| "top-left"
	| "top-center"
	| "top-right"
	| "bottom-left"
	| "bottom-center"
	| "bottom-right";

export interface ProvidersProps {
	children: ReactNode;
	auth?: {
		adapter: AuthAdapter;
	};
	toastMaxToasts?: number;
	toastDefaultDuration?: number;
	toastPosition?: ToastPosition;
}
