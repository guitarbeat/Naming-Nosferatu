import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ToastContextValue, ToastItem, ToastOptions, ToastType } from "./providerTypes";

let toastCounter = 0;

export function useToastProvider(
	maxToasts: number,
	defaultDuration: number,
): ToastContextValue & {
	toastList: ToastItem[];
	dismiss: (id: string) => void;
} {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	const scheduleAutoDismiss = useCallback((id: string, duration: number) => {
		const timer = setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
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
			const id = `toast-${++toastCounter}`;
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

			setToasts((prev) => [item, ...prev].slice(0, maxToasts));

			if (autoDismiss) {
				scheduleAutoDismiss(id, duration);
			}

			return id;
		},
		[defaultDuration, maxToasts, scheduleAutoDismiss],
	);

	const hideToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
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
		(msg: string, opts?: ToastOptions) => showToast(msg, "success", opts),
		[showToast],
	);
	const showError = useCallback(
		(msg: string, opts?: ToastOptions) => showToast(msg, "error", opts),
		[showToast],
	);
	const showInfo = useCallback(
		(msg: string, opts?: ToastOptions) => showToast(msg, "info", opts),
		[showToast],
	);
	const showWarning = useCallback(
		(msg: string, opts?: ToastOptions) => showToast(msg, "warning", opts),
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
