import { Suspense, useCallback, useEffect } from "react";

import { useAuth } from "@/app/providers/Providers";
import { ErrorManager } from "@/shared/services/errorManager";
import useAppStore, { useAppStoreInitialization } from "@/store/appStore";

import AppShell from "./AppShell";
import { AppBootScreen } from "./components/AppComponents";

const BOOT_TIMEOUT_FALLBACK_MS = 2500;

function App() {
	const { user: authUser, isLoading } = useAuth();
	const isStoreLoggedIn = useAppStore((state) => state.user.isLoggedIn);
	const isBootLoading = useAppStore((state) => state.ui.isBootLoading);

	const userActions = useAppStore((state) => state.userActions);
	const setBootLoading = useAppStore((state) => state.uiActions.setBootLoading);

	useEffect(() => {
		if (isLoading) {
			return;
		}

		if (authUser) {
			userActions.setUser({
				id: authUser.id,
				name: authUser.name,
				isLoggedIn: true,
				isAdmin: Boolean(authUser.isAdmin),
			});
		} else if (isStoreLoggedIn) {
			userActions.logout();
		}

		setBootLoading(false);
	}, [authUser, isLoading, isStoreLoggedIn, setBootLoading, userActions]);

	// Fallback safety timeout: ensure the boot screen never hangs indefinitely even if an init step stalls
	useEffect(() => {
		const fallbackTimer = setTimeout(() => {
			setBootLoading(false);
		}, BOOT_TIMEOUT_FALLBACK_MS);

		return () => {
			clearTimeout(fallbackTimer);
		};
	}, [setBootLoading]);

	useEffect(() => {
		const cleanup = ErrorManager.setupGlobalErrorHandling();
		return () => {
			cleanup();
		};
	}, []);

	const handleUserContext = useCallback((_name: string) => {
		// No-op for now since supabase is removed
	}, []);
	useAppStoreInitialization(handleUserContext);

	if (isBootLoading) {
		return <AppBootScreen visible={true} />;
	}

	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
					Loading...
				</div>
			}
		>
			<AppShell />
		</Suspense>
	);
}

export default App;
