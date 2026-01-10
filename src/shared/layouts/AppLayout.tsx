/**
 * @module AppLayout
 * @description Main application layout component.
 * Extracted from App.tsx to improve maintainability.
 */

import { useMemo } from "react";
import useAppStore from "../../core/store/useAppStore";
import type { NameItem } from "../../types/components";
import { ScrollToTopButton } from "../components/Button";
import CatBackground from "../components/CatBackground";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ErrorComponent } from "../components/ErrorComponent";
import { Loading } from "../components/Loading";
import { NameSuggestionModal } from "../components/NameSuggestionModal/NameSuggestionModal";
import { AdaptiveNav } from "../components/Navigation/AdaptiveNav";
import { SwipeWrapper } from "../components/SwipeWrapper";
import { OfflineIndicator } from "../components/OfflineIndicator";
import ViewRouter from "../components/ViewRouter/ViewRouter";

interface AppLayoutProps {
	handleLogin: (userName: string) => Promise<boolean>;
	handleStartNewTournament: () => void;
	handleUpdateRatings: (
		ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => Promise<boolean> | undefined;
	handleTournamentSetup: (names?: NameItem[]) => void;
	handleTournamentComplete: (
		finalRatings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => Promise<void>;
	isSuggestNameModalOpen: boolean;
	onCloseSuggestName: () => void;
	onOpenSuggestName: () => void;
}

export function AppLayout({
	handleLogin,
	handleStartNewTournament,
	handleUpdateRatings,
	handleTournamentSetup,
	handleTournamentComplete,
	isSuggestNameModalOpen,
	onCloseSuggestName,
	onOpenSuggestName,
}: AppLayoutProps) {
	// Get state from store (no prop drilling!)
	const { user, tournament, errors, tournamentActions, errorActions, userActions } = useAppStore();
	const { isLoggedIn } = user;

	// Detect mobile vs desktop for conditional rendering
	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

		setIsMobile(mediaQuery.matches);
		mediaQuery.addEventListener("change", handleChange);

		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

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

				{/* Unified Adaptive Navigation */}
				{isLoggedIn && (
					<AdaptiveNav
						onLogout={() => userActions.logout()}
						onOpenSuggestName={onOpenSuggestName}
					/>
				)}

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
					<SwipeWrapper>
						<ViewRouter
							isLoggedIn={isLoggedIn}
							onLogin={handleLogin}
							tournament={tournament}
							userName={user.name}
							onStartNewTournament={handleStartNewTournament}
							onUpdateRatings={handleUpdateRatings}
							onTournamentSetup={handleTournamentSetup}
							onTournamentComplete={handleTournamentComplete}
							onVote={(vote: unknown) =>
								tournamentActions.addVote(vote as import("../../types/components").VoteData)
							}
							onOpenSuggestName={onOpenSuggestName}
						/>
					</SwipeWrapper>

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
					<NameSuggestionModal isOpen={isSuggestNameModalOpen} onClose={onCloseSuggestName} />
				</main>
			</div>
		</ErrorBoundary>
	);
}
