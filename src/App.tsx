/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use centralized state management and services for better maintainability.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTournamentHandlers } from "./core/hooks/tournamentHooks";
import {
	useKeyboardShortcuts,
	useRouting,
	useTournamentRoutingSync,
} from "./core/hooks/useRouting";
// * Core state and routing hooks
import useUserSession from "./core/hooks/useUserSession";
import useAppStore, { useAppStoreInitialization } from "./core/store/useAppStore";
import { ScrollToTopButton } from "./shared/components/Button";
import CatBackground from "./shared/components/CatBackground";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { ErrorComponent } from "./shared/components/ErrorComponent";
import { Loading } from "./shared/components/Loading";
import { NameSuggestionModal } from "./shared/components/NameSuggestionModal/NameSuggestionModal";
import { BottomNav } from "./shared/components/Navigation/BottomNav";

import { SwipeNavigation } from "./shared/components/Navigation/SwipeNavigation";
import { OfflineIndicator } from "./shared/components/OfflineIndicator";
// * Use path aliases for better tree shaking
import ViewRouter from "./shared/components/ViewRouter/ViewRouter";
import { ToastProvider } from "./shared/providers/ToastProvider";
import { ErrorManager } from "./shared/services/errorManager";
import {
	cleanupPerformanceMonitoring,
	devError,
	initializePerformanceMonitoring,
} from "./shared/utils";
import type { NameItem } from "./types/components";
import type { AppState } from "./types/store";

/**
 * Root application component that wires together global state, routing, and
 * layout providers for the cat name tournament experience. It manages
 * authentication, toast notifications, tournament lifecycle events, and
 * renders the primary interface shell.
 *
 * @returns {JSX.Element} Fully configured application layout.
 */

function App() {
	const { login, logout, isInitialized } = useUserSession();
	const [isSuggestNameModalOpen, setIsSuggestNameModalOpen] = useState(false);

	// * Initialize performance monitoring and global error handling
	useEffect(() => {
		initializePerformanceMonitoring();
		const cleanup = ErrorManager.setupGlobalErrorHandling();
		return () => {
			cleanupPerformanceMonitoring();
			cleanup();
		};
	}, []);

	// * Initialize store from localStorage
	useAppStoreInitialization();

	// * Centralized store
	const { user, tournament, ui, errors, tournamentActions, uiActions, errorActions } =
		useAppStore();

	// * Explicitly select currentView to ensure re-renders when it changes
	const currentView = useAppStore((state: AppState) => state.tournament.currentView);

	// * Simple URL routing helpers
	const { currentRoute, navigateTo } = useRouting();

	useTournamentRoutingSync({
		currentRoute,
		navigateTo,
		isLoggedIn: user.isLoggedIn,
		currentView, // * Use the explicitly selected value
		onViewChange: tournamentActions.setView,
		isTournamentComplete: tournament.isComplete,
	});

	// * Keyboard shortcuts - consolidated into custom hook
	useKeyboardShortcuts({
		navigateTo,
		onAnalysisToggle: () => {
			// Intentional no-op: analysis toggle handled elsewhere
		},
	});

	// * Theme synchronization
	useEffect(() => {
		if (typeof window !== "undefined") {
			document.documentElement.setAttribute("data-theme", ui.theme);
			if (ui.theme === "dark") {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
		}
	}, [ui.theme]);

	// * Tournament handlers extracted to custom hook
	const {
		handleTournamentComplete,
		handleStartNewTournament,
		handleTournamentSetup,
		handleUpdateRatings,
	} = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
		navigateTo,
	});

	// * Handle user login
	const handleLogin = useCallback(
		async (userName: string) => {
			try {
				const success = await login(userName);
				return success;
			} catch (error) {
				devError("Login error:", error);
				throw error;
			}
		},
		[login],
	);

	// * Handle opening suggest name modal
	const handleOpenSuggestName = useCallback(() => {
		setIsSuggestNameModalOpen(true);
	}, []);

	// * Handle closing suggest name modal
	const handleCloseSuggestName = useCallback(() => {
		setIsSuggestNameModalOpen(false);
	}, []);

	// * Handle logout
	const handleLogout = useCallback(async () => {
		await logout();
		navigateTo("/login");
	}, [logout, navigateTo]);

	// * Handle opening photos view
	const handleOpenPhotos = useCallback(() => {
		const { currentView } = useAppStore.getState().tournament;
		if (currentView === "photos") {
			tournamentActions.setView("tournament");
			navigateTo("/");
		} else {
			tournamentActions.setView("photos");
			navigateTo("/");
		}
	}, [tournamentActions, navigateTo]);

	// * Show loading screen while initializing user session from localStorage
	if (!isInitialized) {
		return (
			<div className="fullScreenCenter">
				<Loading variant="spinner" text="Loading..." />
			</div>
		);
	}

	return (
		<ToastProvider>
			<AppLayout
				user={user}
				errors={errors}
				errorActions={errorActions}
				tournament={tournament}
				tournamentActions={tournamentActions}
				handleLogin={handleLogin}
				handleStartNewTournament={handleStartNewTournament}
				handleUpdateRatings={handleUpdateRatings}
				handleTournamentSetup={handleTournamentSetup}
				handleTournamentComplete={handleTournamentComplete}
				ui={ui}
				uiActions={uiActions}
				isSuggestNameModalOpen={isSuggestNameModalOpen}
				onCloseSuggestName={handleCloseSuggestName}
				onOpenSuggestName={handleOpenSuggestName}
				handleLogout={handleLogout}
				handleOpenPhotos={handleOpenPhotos}
			/>
		</ToastProvider>
	);
}

export default App;

interface AppLayoutProps {
	user: AppState["user"];
	errors: AppState["errors"];
	errorActions: AppState["errorActions"];
	tournament: AppState["tournament"];
	tournamentActions: AppState["tournamentActions"];
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
	handleLogout: () => Promise<void>;
	handleOpenPhotos: () => void;
	ui: AppState["ui"];
	uiActions: AppState["uiActions"];
}

function AppLayout({
	user,
	errors,
	errorActions,
	tournament,
	tournamentActions,
	handleLogin,
	handleStartNewTournament,
	handleUpdateRatings,
	handleTournamentSetup,
	handleTournamentComplete,
	isSuggestNameModalOpen,
	onCloseSuggestName,
	onOpenSuggestName,
}: AppLayoutProps) {
	const { isLoggedIn } = user;
	// const currentView = useAppStore((state: AppState) => state.tournament.currentView);
	// const { currentRoute, navigateTo } = useRouting();

	const appClassName = useMemo(() => (isLoggedIn ? "app" : "app app--login"), [isLoggedIn]);

	const layoutStyle = useMemo(() => ({}), []);

	const mainWrapperClassName = useMemo(
		() =>
			["app-main-wrapper", isLoggedIn ? "" : "app-main-wrapper--login"].filter(Boolean).join(" "),
		[isLoggedIn],
	);

	return (
		<ErrorBoundary context="Main Application Layout">
			<div className={appClassName} style={layoutStyle}>
				<OfflineIndicator />

				{/* * Skip link for keyboard navigation */}
				{/* * Skip link for keyboard navigation */}
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:p-4 focus:bg-white focus:text-black focus:rounded-md focus:shadow-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
				>
					Skip to main content
				</a>

				{/* * Static cat-themed background */}
				<CatBackground />

				{/* * Primary Bottom Navigation */}
				{isLoggedIn && <BottomNav onOpenSuggestName={onOpenSuggestName} />}

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
					<SwipeNavigation>
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
								tournamentActions.addVote(vote as import("./types/components").VoteData)
							}
						/>
					</SwipeNavigation>

					{/* * Global loading overlay */}
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

// Test auto-deployment - Wed Oct 22 21:26:25 CDT 2025
// Auto-deployment test 2 - Wed Oct 22 21:27:26 CDT 2025
