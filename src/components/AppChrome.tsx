import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import React, {
	createContext,
	memo,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Iridescence } from "@/components/GlassEffects";
import { ErrorBoundary, ErrorInline, Loading } from "@/components/UiPrimitives";
import { scaleFadeMotionPreset } from "@/lib/utils";
import useAppStore from "@/store";

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

/* ==========================================================================
   APP SHELL OVERLAYS & INDICATORS
   ========================================================================== */

export function OfflineIndicator() {
	const [isOnline, setIsOnline] = useState(
		typeof navigator === "undefined" ? true : navigator.onLine,
	);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	if (isOnline) {
		return null;
	}

	return (
		<div className="indicator" role="status" aria-live="polite">
			<div className="indicator-content">
				<span className="indicator-dot" />
				<span className="indicator-message">Offline mode active</span>
			</div>
		</div>
	);
}

export function AppBootScreen({
	message = "Preparing the tournament...",
	visible = true,
}: {
	message?: string;
	visible?: boolean;
}) {
	if (!visible) {
		return null;
	}

	return (
		<div
			data-testid="boot-screen"
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground"
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			<motion.div
				{...scaleFadeMotionPreset}
				className="flex flex-col items-center space-y-5 px-4 text-center max-w-md"
			>
				<div className="relative flex h-14 w-14 items-center justify-center" aria-hidden="true">
					<div className="absolute h-14 w-14 rounded-full border-4 border-primary/20" />
					<div className="absolute h-14 w-14 rounded-full border-4 border-t-primary animate-spin" />
				</div>
				<div className="space-y-1.5">
					<h2 className="text-xl font-bold tracking-tight text-foreground">{message}</h2>
					<p className="text-sm text-muted-foreground">Loading contender roster...</p>
				</div>
			</motion.div>
		</div>
	);
}

export const GlobalErrorDisplay = memo(function GlobalErrorDisplay() {
	const currentError = useAppStore((s) => s.errors.current);
	const errorActions = useAppStore((s) => s.errorActions);

	if (!currentError) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 w-full max-w-4xl px-4 pt-4">
			<ErrorInline error={String(currentError)} onDismiss={() => errorActions.clearError()} />
		</div>
	);
});

export const GlobalLoadingOverlay = memo(function GlobalLoadingOverlay() {
	const isLoading = useAppStore((s) => s.tournament.isLoading);
	if (!isLoading) {
		return null;
	}
	return (
		<div className="global-loading-overlay" role="status" aria-live="polite" aria-busy="true">
			<Loading variant="spinner" text="Initializing Tournament..." />
		</div>
	);
});

export const SkipToMainButton = memo(function SkipToMainButton() {
	return (
		<button
			type="button"
			className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2.5 focus:bg-card focus:text-foreground focus:rounded-xl focus:shadow-lg focus:font-bold"
			onClick={() => {
				const main = document.getElementById("main-content");
				main?.focus();
				main?.scrollIntoView({ behavior: "smooth" });
			}}
		>
			Skip to main content
		</button>
	);
});

export function PwaInstallPrompt() {
	const installRef = useRef<PWAInstallElement | null>(null);

	useEffect(() => {
		const element = installRef.current;
		if (!element) {
			return;
		}
		element.manifestUrl = "/manifest.json";
		element.useLocalStorage = true;
		element.installDescription =
			"Add Name Nosferatu to your home screen for quick access to cat name tournaments and your rankings.";
		element.styles = { "--tint-color": "hsl(152, 26%, 42%)" };
		if (window.__deferredPwaPrompt) {
			element.externalPromptEvent = window.__deferredPwaPrompt;
		}
	}, []);

	return <pwa-install ref={installRef} />;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<ErrorBoundary context="Main Application Layout">
			<div className="app relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
				<Iridescence mouseReact={true} className="fixed inset-0 z-0 pointer-events-none" />
				<PwaInstallPrompt />
				<OfflineIndicator />
				<SkipToMainButton />
				<main
					id="main-content"
					className="app-main relative z-10 flex w-full flex-col pt-0"
					tabIndex={-1}
				>
					<GlobalErrorDisplay />
					<div className="app-main__content flex w-full flex-1 flex-col items-stretch">
						{children}
					</div>
					<GlobalLoadingOverlay />
				</main>
			</div>
		</ErrorBoundary>
	);
}
