import { MotionConfig } from "framer-motion";
import { Suspense, useCallback, useEffect, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
	AppBootScreen,
	AppLayout,
	HomeView,
	RouteFallback,
} from "@/components";
import { usePreloadImages } from "@/hooks";
import { ErrorManager } from "@/lib/utils";
import useAppStore, { useAppStoreInitialization } from "@/store";

function AppShell() {
	const { pathname } = useLocation();

	useLayoutEffect(() => {
		if (!pathname) {
			return;
		}
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
	}, [pathname]);

	return (
		<MotionConfig reducedMotion="user">
			<AppLayout>
				<Routes>
					<Route
						path="/"
						element={
							<Suspense fallback={<RouteFallback text="Loading home..." />}>
								<HomeView />
							</Suspense>
						}
					/>
					<Route
						path="/tournament"
						element={<Navigate to="/" replace={true} />}
					/>
					<Route
						path="/analysis"
						element={<Navigate to="/" replace={true} />}
					/>
					<Route path="/admin" element={<Navigate to="/" replace={true} />} />
					<Route path="*" element={<Navigate to="/" replace={true} />} />
				</Routes>
			</AppLayout>
		</MotionConfig>
	);
}

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
