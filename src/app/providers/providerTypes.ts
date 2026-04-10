export type UserRole = "user" | "moderator" | "admin";

export interface AuthUser {
	id: string;
	name: string;
	email?: string;
	isAdmin: boolean;
	role?: UserRole;
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
