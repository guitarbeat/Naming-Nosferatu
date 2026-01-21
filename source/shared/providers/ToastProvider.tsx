/**
 * @module ToastProvider
 * @description Consolidated toast notification system with convenience methods.
 * Supports multiple toasts, auto-dismiss, and type-specific helpers.
 */

import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { type IToastItem, ToastContainer } from "../components/Toast";

// ============================================================================
// TYPES
// ============================================================================

type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
	duration?: number;
	autoDismiss?: boolean;
}

interface ToastContextValue {
	/** Show a toast with full configuration */
	showToast: (message: string, type?: ToastType, options?: ToastOptions) => string;
	/** Hide a specific toast by ID */
	hideToast: (id: string) => void;
	/** Clear all toasts */
	clearToasts: () => void;
	/** Convenience: show success toast */
	showSuccess: (message: string, options?: ToastOptions) => string;
	/** Convenience: show error toast */
	showError: (message: string, options?: ToastOptions) => string;
	/** Convenience: show info toast */
	showInfo: (message: string, options?: ToastOptions) => string;
	/** Convenience: show warning toast */
	showWarning: (message: string, options?: ToastOptions) => string;
	/** Current toasts for external rendering if needed */
	toasts: IToastItem[];
	/** Remove a toast (alias for hideToast) */
	removeToast: (id: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error(
			"useToast must be used within ToastProvider. Ensure ToastProvider wraps the component tree in main.tsx.",
		);
	}
	return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

interface ToastProviderProps {
	children: React.ReactNode;
	/** Maximum number of toasts to display (default: 5) */
	maxToasts?: number;
	/** Default duration in ms (default: 5000) */
	defaultDuration?: number;
	/** Toast container position */
	position?:
		| "top-left"
		| "top-center"
		| "top-right"
		| "bottom-left"
		| "bottom-center"
		| "bottom-right";
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
	children,
	maxToasts = 5,
	defaultDuration = 5000,
	position = "top-right",
}) => {
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
				duration: options.duration ?? defaultDuration,
				autoDismiss: options.autoDismiss ?? true,
			};

			setToasts((prev) => {
				const updated = [newToast, ...prev];
				return updated.slice(0, maxToasts);
			});

			return id;
		},
		[generateId, defaultDuration, maxToasts],
	);

	const hideToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const clearToasts = useCallback(() => {
		setToasts([]);
	}, []);

	// Convenience methods
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

	const value: ToastContextValue = {
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

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastContainer
				toasts={toasts}
				removeToast={hideToast}
				position={position}
				maxToasts={maxToasts}
			/>
		</ToastContext.Provider>
	);
};
