import { MotionConfig } from "framer-motion";
import type React from "react";
import { Suspense, useCallback, useEffect, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
	AppBootScreen,
	ErrorBoundary,
	GlobalErrorDisplay,
	GlobalLoadingOverlay,
	HomeView,
	Iridescence,
	OfflineIndicator,
	PwaInstallPrompt,
	RouteFallback,
	SkipToMainButton,
} from "@/components";
import { usePreloadImages } from "@/hooks";
import { ErrorManager } from "@/lib/utils";
import useAppStore, { useAppStoreInitialization } from "@/store";

const IRIDESCENCE_COLOR: [number, number, number] = [1, 1, 1];

function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<ErrorBoundary context="Main Application Layout">
			<div className="app relative min-h-dvh w-full bg-background text-foreground overflow-x-hidden">
				<Iridescence
					color={IRIDESCENCE_COLOR}
					speed={0.8}
					amplitude={0.08}
					mouseReact={true}
					className="fixed inset-0 z-0 opacity-100 pointer-events-none"
				/>
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
					<Route path="/tournament" element={<Navigate to="/" replace={true} />} />
					<Route path="/analysis" element={<Navigate to="/" replace={true} />} />
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
