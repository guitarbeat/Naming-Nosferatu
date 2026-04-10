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
	ToastContextValue,
	ToastItem,
	ToastOptions,
	ToastPosition,
	ToastType,
} from "@/app/providers/providerTypes";

const POSITION_CLASSES: Record<ToastPosition, string> = {
	"top-left": "top-4 left-4 items-start",
	"top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
	"top-right": "top-4 right-4 items-end",
	"bottom-left": "bottom-4 left-4 items-start",
	"bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
	"bottom-right": "bottom-4 right-4 items-end",
};

const TYPE_STYLES: Record<ToastType, { bg: string; icon: string }> = {
	success: { bg: "bg-chart-2", icon: "OK" },
	error: { bg: "bg-destructive", icon: "X" },
	warning: { bg: "bg-chart-4 text-foreground", icon: "!" },
	info: { bg: "bg-primary", icon: "i" },
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error(
			"useToast must be used within <Providers>. Wrap your component tree with <Providers> in main.tsx.",
		);
	}

	return context;
}

function ToastContainer({
	toasts,
	onDismiss,
	position,
}: {
	toasts: ToastItem[];
	onDismiss: (id: string) => void;
	position: ToastPosition;
}) {
	if (toasts.length === 0) {
		return null;
	}

	return (
		<div
			className={`fixed z-[9999] flex flex-col gap-2 ${POSITION_CLASSES[position]}`}
			aria-live="polite"
			aria-label="Notifications"
		>
			{toasts.map((toast) => {
				const style = TYPE_STYLES[toast.type];
				return (
					<div
						key={toast.id}
						className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${style.bg}`}
						role="alert"
					>
						<span className="text-base leading-none" aria-hidden={true}>
							{style.icon}
						</span>
						<span className="flex-1">{toast.message}</span>
						<button
							onClick={() => onDismiss(toast.id)}
							className="ml-2 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
							aria-label="Dismiss"
							type="button"
						>
							X
						</button>
					</div>
				);
			})}
		</div>
	);
}

function useToastProvider(
	maxToasts: number,
	defaultDuration: number,
): ToastContextValue & {
	toastList: ToastItem[];
	dismiss: (id: string) => void;
} {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	const toastCounter = useRef(0);

	const scheduleAutoDismiss = useCallback((id: string, duration: number) => {
		const timer = setTimeout(() => {
			setToasts((previous) => previous.filter((toast) => toast.id !== id));
			timers.current.delete(id);
		}, duration);

		timers.current.set(id, timer);
	}, []);

	useEffect(() => {
		return () => {
			for (const timer of timers.current.values()) {
				clearTimeout(timer);
			}
			timers.current.clear();
		};
	}, []);

	const showToast = useCallback(
		(message: string, type: ToastType = "info", options: ToastOptions = {}): string => {
			const id = `toast-${++toastCounter.current}`;
			const duration = options.duration ?? defaultDuration;
			const autoDismiss = options.autoDismiss ?? true;

			const item: ToastItem = {
				id,
				message,
				type,
				duration,
				autoDismiss,
				createdAt: Date.now(),
			};

			setToasts((previous) => [item, ...previous].slice(0, maxToasts));

			if (autoDismiss) {
				scheduleAutoDismiss(id, duration);
			}

			return id;
		},
		[defaultDuration, maxToasts, scheduleAutoDismiss],
	);

	const hideToast = useCallback((id: string) => {
		setToasts((previous) => previous.filter((toast) => toast.id !== id));
		const timer = timers.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.current.delete(id);
		}
	}, []);

	const clearToasts = useCallback(() => {
		setToasts([]);
		for (const timer of timers.current.values()) {
			clearTimeout(timer);
		}
		timers.current.clear();
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

	return useMemo(
		() => ({
			toasts,
			showToast,
			hideToast,
			clearToasts,
			showSuccess,
			showError,
			showInfo,
			showWarning,
			toastList: toasts,
			dismiss: hideToast,
		}),
		[toasts, showToast, hideToast, clearToasts, showSuccess, showError, showInfo, showWarning],
	);
}

interface ToastProviderProps {
	children: ReactNode;
	defaultDuration: number;
	maxToasts: number;
	position: ToastPosition;
}

export function ToastProvider({
	children,
	defaultDuration,
	maxToasts,
	position,
}: ToastProviderProps) {
	const { toastList, dismiss, ...value } = useToastProvider(maxToasts, defaultDuration);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastContainer toasts={toastList} onDismiss={dismiss} position={position} />
		</ToastContext.Provider>
	);
}
