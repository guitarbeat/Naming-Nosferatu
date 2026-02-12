/**
 * @module AppLayout
 * @description Main application layout component.
 * Accepts children from React Router instead of managing routing internally.
 */

import { useMemo } from "react";
import {
	CatBackground,
	ErrorBoundary,
	ErrorComponent,
	FluidNav,
	Loading,
	OfflineIndicator,
	ScrollToTopButton,
} from "@/layout";
import useAppStore from "@/store/appStore";

interface AppLayoutProps {
	handleTournamentComplete: (
		finalRatings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => Promise<void>;
	children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
	// Get state from store (no prop drilling!)
	const { user, tournament, errors, errorActions } = useAppStore();
	const { isLoggedIn } = user;

	const appClassName = useMemo(() => (isLoggedIn ? "app" : "app app--login"), [isLoggedIn]);

	const mainWrapperClassName = useMemo(
		() =>
			["app-main-wrapper", isLoggedIn ? "" : "app-main-wrapper--login"].filter(Boolean).join(" "),
		[isLoggedIn],
	);

	return (
		<ErrorBoundary context="Main Application Layout">
			<div className={appClassName}>
				<OfflineIndicator />

				{/* Skip link for keyboard navigation */}
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:p-4 focus:bg-white focus:text-black focus:rounded-md focus:shadow-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
				>
					Skip to main content
				</a>

				{/* Static cat-themed background */}
				<CatBackground />

				{/* Fluid Navigation */}
				<FluidNav />

				<main id="main-content" className={mainWrapperClassName} tabIndex={-1}>
					{errors.current && (
						<div className="p-4">
							<ErrorComponent
								error={errors.current}
								onRetry={() => errorActions.clearError()}
								onDismiss={() => errorActions.clearError()}
							/>
						</div>
					)}
					{children}

					{/* Global loading overlay */}
					{tournament.isLoading && (
						<div
							className="global-loading-overlay"
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
