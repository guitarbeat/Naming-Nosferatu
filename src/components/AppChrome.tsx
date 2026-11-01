import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

/* ==========================================================================
   TOAST PROVIDER & HOOK
   ========================================================================== */

const DEFAULT_TOAST_DURATION_MS = 4500;
const DEFAULT_MAX_TOASTS = 4;

type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
	duration?: number;
	autoDismiss?: boolean;
}

interface ToastItem {
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

const TYPE_STYLES: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
	success: {
		bg: "bg-secondary text-secondary-foreground",
		icon: <CheckCircle className="size-4" />,
	},
	error: { bg: "bg-destructive text-destructive-foreground", icon: <XCircle className="size-4" /> },
	warning: { bg: "bg-amber-500/90 text-white", icon: <AlertTriangle className="size-4" /> },
	info: { bg: "bg-primary text-primary-foreground", icon: <Info className="size-4" /> },
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within <Providers>.");
	}
	return context;
}

function ToastContainer({
	toasts,
	onDismiss,
}: {
	toasts: ToastItem[];
	onDismiss: (id: string) => void;
}) {
	if (toasts.length === 0) {
		return null;
	}

	return (
		<section
			className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] flex flex-col items-end gap-2"
			aria-live="polite"
			aria-label="Notifications"
		>
			{toasts.map((toast) => {
				const style = TYPE_STYLES[toast.type];
				return (
					<div
						key={toast.id}
						className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md transition-all duration-200 ${style.bg}`}
						role="alert"
					>
						<span aria-hidden={true}>{style.icon}</span>
						<span className="flex-1">{toast.message}</span>
						<button
							onClick={() => onDismiss(toast.id)}
							className="ml-1 -mr-1 rounded-full p-1 opacity-75 transition-opacity hover:opacity-100"
							aria-label="Dismiss"
							type="button"
						>
							<X className="size-3.5" />
						</button>
					</div>
				);
			})}
		</section>
	);
}

export function Providers({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	const toastCounter = useRef(0);

	useEffect(() => {
		return () => {
			for (const timer of timers.current.values()) {
				clearTimeout(timer);
			}
			timers.current.clear();
		};
	}, []);

	const hideToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
		const timer = timers.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.current.delete(id);
		}
	}, []);

	const showToast = useCallback(
		(message: string, type: ToastType = "info", options: ToastOptions = {}): string => {
			const id = `toast-${++toastCounter.current}`;
			const duration = options.duration ?? DEFAULT_TOAST_DURATION_MS;
			const autoDismiss = options.autoDismiss ?? true;

			const item: ToastItem = {
				id,
				message,
				type,
				duration,
				autoDismiss,
				createdAt: Date.now(),
			};

			setToasts((prev) => [item, ...prev].slice(0, DEFAULT_MAX_TOASTS));

			if (autoDismiss) {
				const timer = setTimeout(() => {
					setToasts((prev) => prev.filter((t) => t.id !== id));
					timers.current.delete(id);
				}, duration);
				timers.current.set(id, timer);
			}
			return id;
		},
		[],
	);

	const clearToasts = useCallback(() => {
		setToasts([]);
		for (const timer of timers.current.values()) {
			clearTimeout(timer);
		}
		timers.current.clear();
	}, []);

	const value = useMemo<ToastContextValue>(
		() => ({
			toasts,
			showToast,
			hideToast,
			clearToasts,
			showSuccess: (m, o) => showToast(m, "success", o),
			showError: (m, o) => showToast(m, "error", o),
			showInfo: (m, o) => showToast(m, "info", o),
			showWarning: (m, o) => showToast(m, "warning", o),
		}),
		[toasts, showToast, hideToast, clearToasts],
	);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastContainer toasts={toasts} onDismiss={hideToast} />
		</ToastContext.Provider>
	);
}
