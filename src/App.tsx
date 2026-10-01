import { Suspense, useCallback, useEffect } from "react";
import { AppBootScreen, AppShell } from "@/components";
import { usePreloadImages } from "@/hooks";
import { ErrorManager } from "@/lib/utils";
import useAppStore, { useAppStoreInitialization } from "@/store";

export function App() {
	usePreloadImages();

	const isBootLoading = useAppStore((state) => state.ui.isBootLoading);
	const setBootLoading = useAppStore((state) => state.uiActions.setBootLoading);

	useEffect(() => {
		setBootLoading(false);
	}, [setBootLoading]);

	useEffect(() => {
		const cleanup = ErrorManager.setupGlobalErrorHandling();
		return () => {
			cleanup();
		};
	}, []);

	const handleUserContext = useCallback((_name: string) => {
		// No-op user context initialization hook
	}, []);
	useAppStoreInitialization(handleUserContext);

	if (isBootLoading) {
		return <AppBootScreen visible={true} />;
	}

	return (
		<Suspense
			fallback={
				<div className="flex min-h-[100dvh] items-center justify-center bg-background text-foreground">
					Loading...
				</div>
			}
		>
			<AppShell />
		</Suspense>
	);
}
