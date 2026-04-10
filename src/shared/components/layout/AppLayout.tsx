import { Analytics } from "@vercel/analytics/react";
import { lazy, type ReactNode, Suspense } from "react";
import { shouldEnableAnalytics } from "@/app/analytics";
import { ScrollToTopButton } from "@/shared/components/layout/Button";
import {
	ErrorBoundary,
	ErrorComponent,
	Loading,
	OfflineIndicator,
} from "@/shared/components/layout/Feedback";
import { FloatingNavbar } from "@/shared/components/layout/FloatingNavbar";
import useAppStore from "@/store/appStore";

interface AppLayoutProps {
	children: ReactNode;
}

const LiquidGradientBackground = lazy(() =>
	import("@/shared/components/layout/LiquidGradientBackground").then((module) => ({
		default: module.LiquidGradientBackground,
	})),
);

export function AppLayout({ children }: AppLayoutProps) {
	const { user, tournament, errors, errorActions } = useAppStore();
	const { isLoggedIn } = user;

	const analyticsEnabled = shouldEnableAnalytics({
		hostname: window.location.hostname,
		isProd: import.meta.env.PROD,
	});

	return (
		<ErrorBoundary context="Main Application Layout">
			<div className="app relative min-h-dvh w-full text-foreground">
				<OfflineIndicator />
				{analyticsEnabled && <Analytics />}

				<button
					type="button"
					className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:p-4 focus:bg-white focus:text-black focus:rounded-md focus:shadow-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
					onClick={() => {
						const main = document.getElementById("main-content");
						if (main) {
							main.focus();
							main.scrollIntoView({ behavior: "smooth" });
						}
					}}
				>
					Skip to main content
				</button>

				<Suspense fallback={null}>
					<LiquidGradientBackground />
				</Suspense>

				<FloatingNavbar />

				{/* Main content area with proper spacing */}
				<main
					id="main-content"
					className="relative flex w-full flex-col pb-40 pt-0 sm:pb-40"
					style={{ minHeight: "100dvh" }}
					tabIndex={-1}
				>
					{/* Error banner */}
					{Boolean(errors.current) && (
						<div className="mx-auto mb-4 w-full max-w-4xl px-3 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
							<ErrorComponent
								error={String(errors.current)}
								onRetry={() => errorActions.clearError()}
								onDismiss={() => errorActions.clearError()}
							/>
						</div>
					)}

					{/* Page content */}
					<div className="flex w-full flex-1 flex-col items-stretch gap-8 sm:gap-10 md:gap-14">
						{children}
					</div>

					{/* Loading overlay */}
					{tournament.isLoading && (
						<div
							className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
							role="status"
							aria-live="polite"
							aria-busy="true"
						>
							<Loading variant="spinner" text="Initializing Tournament..." />
						</div>
					)}

					<ScrollToTopButton isLoggedIn={isLoggedIn} />
				</main>
			</div>
		</ErrorBoundary>
	);
}
