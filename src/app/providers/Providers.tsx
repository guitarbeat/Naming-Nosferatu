import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/app/providers/authContext";
import type { AuthAdapter, ToastPosition } from "@/app/providers/providerTypes";
import { ToastProvider, useToast } from "@/app/providers/toastContext";

const DEFAULT_TOAST_DURATION_MS = 5000;
const DEFAULT_MAX_TOASTS = 5;

export type { AuthAdapter, AuthUser, LoginCredentials, RegisterData } from "./providerTypes";

interface ProvidersProps {
	children: ReactNode;
	auth?: {
		adapter: AuthAdapter;
	};
	toastMaxToasts?: number;
	toastDefaultDuration?: number;
	toastPosition?: ToastPosition;
}

export { useAuth, useToast };

export function Providers({
	children,
	auth,
	toastMaxToasts = DEFAULT_MAX_TOASTS,
	toastDefaultDuration = DEFAULT_TOAST_DURATION_MS,
	toastPosition = "top-right",
}: ProvidersProps) {
	return (
		<AuthProvider adapter={auth?.adapter}>
			<ToastProvider
				maxToasts={toastMaxToasts}
				defaultDuration={toastDefaultDuration}
				position={toastPosition}
			>
				{children}
			</ToastProvider>
		</AuthProvider>
	);
}
