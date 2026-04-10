import { lazy, Suspense, useCallback, useEffect } from "react";
import { useAuth } from "@/app/providers/Providers";
import { AppBootScreen } from "@/app/components/AppBootScreen";
import {
	cleanupPerformanceMonitoring,
	initializePerformanceMonitoring,
} from "@/shared/lib/performance";
import { ErrorManager } from "@/shared/services/errorManager";
import { updateSupabaseUserContext } from "@/shared/services/supabase/runtime";
import useAppStore, { useAppStoreInitialization } from "@/store/appStore";

const AppShell = lazy(() => import("@/app/AppShell"));

function App() {
	const { user: authUser, isLoading } = useAuth();
	const userActions = useAppStore((state) => state.userActions);
	const isBootLoading = useAppStore((state) => state.ui.isBootLoading);
	const setBootLoading = useAppStore((state) => state.uiActions.setBootLoading);

	useEffect(() => {
		setBootLoading(isLoading);
	}, [isLoading, setBootLoading]);

	useEffect(() => {
		if (authUser) {
			userActions.setAdminStatus(Boolean(authUser.isAdmin));
		}
		updateSupabaseUserContext(authUser?.name ?? null, authUser?.id ?? null);
	}, [authUser, userActions]);

	useEffect(() => {
		initializePerformanceMonitoring();
		const cleanup = ErrorManager.setupGlobalErrorHandling();
		return () => {
			cleanupPerformanceMonitoring();
			cleanup();
		};
	}, []);

	const handleUserContext = useCallback((name: string) => {
		updateSupabaseUserContext(name, null);
	}, []);

	useAppStoreInitialization(handleUserContext);

	if (isBootLoading) {
		return <AppBootScreen />;
	}

	return (
		<Suspense fallback={<AppBootScreen visible={true} message="Opening the app..." />}>
			<AppShell />
		</Suspense>
	);
}

export default App;
