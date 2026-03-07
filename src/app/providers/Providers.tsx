import { noopAdapter } from "./noopAdapter";
import { AuthContext, ToastContext, useAuth, useToast } from "./providerContexts";
import {
	type AuthAdapter,
	type AuthUser,
	DEFAULT_MAX_TOASTS,
	DEFAULT_TOAST_DURATION_MS,
	type LoginCredentials,
	type ProvidersProps,
	type RegisterData,
} from "./providerTypes";
import { ToastContainer } from "./ToastContainer";
import { useAuthProvider } from "./useAuthProvider";
import { useToastProvider } from "./useToastProvider";

export type { AuthAdapter, AuthUser, LoginCredentials, RegisterData };
export { useAuth, useToast };

export function Providers({
	children,
	auth,
	toastMaxToasts = DEFAULT_MAX_TOASTS,
	toastDefaultDuration = DEFAULT_TOAST_DURATION_MS,
	toastPosition = "top-right",
}: ProvidersProps) {
	const adapter = auth?.adapter ?? noopAdapter;
	const authValue = useAuthProvider(adapter);
	const { toastList, dismiss, ...toastValue } = useToastProvider(
		toastMaxToasts,
		toastDefaultDuration,
	);

	return (
		<AuthContext.Provider value={authValue}>
			<ToastContext.Provider value={toastValue}>
				{children}
				<ToastContainer toasts={toastList} onDismiss={dismiss} position={toastPosition} />
			</ToastContext.Provider>
		</AuthContext.Provider>
	);
}
