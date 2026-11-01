import { motion } from "framer-motion";
import React, { memo, useEffect, useRef, useState } from "react";
import { Iridescence } from "@/components/GlassEffects";
import { ErrorBoundary, ErrorInline, Loading } from "@/components/UiPrimitives";
import { scaleFadeMotionPreset } from "@/lib/utils";
import useAppStore from "@/store";

export function OfflineIndicator() {
	const [isOnline, setIsOnline] = useState(
		typeof navigator === "undefined" ? true : navigator.onLine,
	);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	if (isOnline) {
		return null;
	}

	return (
		<div className="indicator" role="status" aria-live="polite">
			<div className="indicator-content">
				<span className="indicator-dot" />
				<span className="indicator-message">Offline mode active</span>
			</div>
		</div>
	);
}

export function AppBootScreen({
	message = "Preparing the tournament...",
	visible = true,
}: {
	message?: string;
	visible?: boolean;
}) {
	if (!visible) {
		return null;
	}

	return (
		<div
			data-testid="boot-screen"
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground"
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			<motion.div
				{...scaleFadeMotionPreset}
				className="flex flex-col items-center space-y-5 px-4 text-center max-w-md"
			>
				<div className="relative flex h-14 w-14 items-center justify-center" aria-hidden="true">
					<div className="absolute h-14 w-14 rounded-full border-4 border-primary/20" />
					<div className="absolute h-14 w-14 rounded-full border-4 border-t-primary animate-spin" />
				</div>
				<div className="space-y-1.5">
					<h2 className="text-xl font-bold tracking-tight text-foreground">{message}</h2>
					<p className="text-sm text-muted-foreground">Loading contender roster...</p>
				</div>
			</motion.div>
		</div>
	);
}

export const GlobalErrorDisplay = memo(function GlobalErrorDisplay() {
	const currentError = useAppStore((s) => s.errors.current);
	const errorActions = useAppStore((s) => s.errorActions);

	if (!currentError) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 w-full max-w-4xl px-4 pt-4">
			<ErrorInline error={String(currentError)} onDismiss={() => errorActions.clearError()} />
		</div>
	);
});

export const GlobalLoadingOverlay = memo(function GlobalLoadingOverlay() {
	const isLoading = useAppStore((s) => s.tournament.isLoading);
	if (!isLoading) {
		return null;
	}
	return (
		<div className="global-loading-overlay" role="status" aria-live="polite" aria-busy="true">
			<Loading variant="spinner" text="Initializing Tournament..." />
		</div>
	);
});

export const SkipToMainButton = memo(function SkipToMainButton() {
	return (
		<button
			type="button"
			className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2.5 focus:bg-card focus:text-foreground focus:rounded-xl focus:shadow-lg focus:font-bold"
			onClick={() => {
				const main = document.getElementById("main-content");
				main?.focus();
				main?.scrollIntoView({ behavior: "smooth" });
			}}
		>
			Skip to main content
		</button>
	);
});

export function PwaInstallPrompt() {
	const installRef = useRef<PWAInstallElement | null>(null);

	useEffect(() => {
		const element = installRef.current;
		if (!element) {
			return;
		}
		element.manifestUrl = "/manifest.json";
		element.useLocalStorage = true;
		element.installDescription =
			"Add Name Nosferatu to your home screen for quick access to cat name tournaments and your rankings.";
		element.styles = { "--tint-color": "hsl(152, 26%, 42%)" };
		if (window.__deferredPwaPrompt) {
			element.externalPromptEvent = window.__deferredPwaPrompt;
		}
	}, []);

	return <pwa-install ref={installRef} />;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<ErrorBoundary context="Main Application Layout">
			<div className="app relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
				<Iridescence mouseReact={true} className="fixed inset-0 z-0 pointer-events-none" />
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
