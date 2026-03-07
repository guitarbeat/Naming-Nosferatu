import type { ToastItem, ToastPosition, ToastType } from "./providerTypes";

const POSITION_CLASSES: Record<ToastPosition, string> = {
	"top-left": "top-4 left-4 items-start",
	"top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
	"top-right": "top-4 right-4 items-end",
	"bottom-left": "bottom-4 left-4 items-start",
	"bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
	"bottom-right": "bottom-4 right-4 items-end",
};

const TYPE_STYLES: Record<ToastType, { bg: string; icon: string }> = {
	success: { bg: "bg-chart-2", icon: "✓" },
	error: { bg: "bg-destructive", icon: "✕" },
	warning: { bg: "bg-chart-4 text-foreground", icon: "⚠" },
	info: { bg: "bg-primary", icon: "ℹ" },
};

export function ToastContainer({
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
							✕
						</button>
					</div>
				);
			})}
		</div>
	);
}
