/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use centralized state management and services for better maintainability.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
	useKeyboardShortcuts,
	useRouting,
	useTournamentRoutingSync,
} from "./core/hooks/useRouting";
import { useTournamentHandlers } from "./core/hooks/tournamentHooks";
// * Core state and routing hooks
import useUserSession from "./core/hooks/useUserSession";
import useAppStore, {
	useAppStoreInitialization,
} from "./core/store/useAppStore";
import { AppNavbar } from "./shared/components/AppNavbar/AppNavbar";
import { ScrollToTopButton } from "./shared/components/Button/Button";
import CatBackground from "./shared/components/CatBackground/CatBackground";
import { Error, Loading } from "./shared/components/CommonUI";
import { NameSuggestionModal } from "./shared/components/NameSuggestionModal/NameSuggestionModal";
// * Use path aliases for better tree shaking
import ViewRouter from "./shared/components/ViewRouter/ViewRouter";
import type { NameItem } from "./shared/propTypes";
import {
	cleanupPerformanceMonitoring,
	devError,
	initializePerformanceMonitoring,
} from "./shared/utils/core";
import type { TournamentName } from "./types/store";

/**
 * Root application component that wires together global state, routing, and
 * layout providers for the cat name tournament experience. It manages
 * authentication, toast notifications, tournament lifecycle events, and
 * renders the primary interface shell.
 *
 * @returns {JSX.Element} Fully configured application layout.
 */
interface UserState {
	name: string;
	isLoggedIn: boolean;
	isAdmin: boolean;
	preferences: Record<string, unknown>;
}

interface TournamentState {
	names: TournamentName[] | null;
	ratings: Record<string, { rating: number }>;
	isComplete: boolean;
	isLoading: boolean;
	voteHistory: unknown[];
	currentView: string;
}

interface StoreSlice {
	user: UserState;
	tournament: TournamentState;
	ui: {
		theme: string;
		themePreference: string;
		showGlobalAnalytics: boolean;
		showUserComparison: boolean;
		matrixMode: boolean;
	};
	errors: {
		current: Error | null;
		history: unknown[];
	};
	tournamentActions: {
		setNames: (names: TournamentName[] | null) => void;
		setRatings: (ratings: Record<string, { rating: number }>) => void;
		setComplete: (isComplete: boolean) => void;
		setLoading: (isLoading: boolean) => void;
		addVote: (vote: unknown) => void;
		resetTournament: () => void;
		setView: (view: string) => void;
	};
	uiActions: {
		setMatrixMode: (enabled: boolean) => void;
		setGlobalAnalytics: (show: boolean) => void;
		setUserComparison: (show: boolean) => void;
		setTheme: (theme: string) => void;
		initializeTheme: () => void;
	};
	errorActions: {
		setError: (error: Error | null) => void;
		clearError: () => void;
		logError: (
			error: Error,
			context: string,
			metadata?: Record<string, unknown>,
		) => void;
	};
}

function App() {
	const { login, logout, isInitialized } = useUserSession();
	const [isSuggestNameModalOpen, setIsSuggestNameModalOpen] = useState(false);

	// * Initialize performance monitoring
	useEffect(() => {
		initializePerformanceMonitoring();
		return () => cleanupPerformanceMonitoring();
	}, []);

	// * Initialize store from localStorage
	useAppStoreInitialization();

	// * Centralized store
	const {
		user,
		tournament,
		ui,
		errors,
		tournamentActions,
		uiActions,
		errorActions,
	} = useAppStore() as StoreSlice;

	// * Explicitly select currentView to ensure re-renders when it changes
	const currentView = useAppStore(
		(state: StoreSlice) => state.tournament.currentView,
	);

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
		onAnalysisToggle: () => {},
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
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100vh",
					width: "100vw",
				}}
			>
				<Loading variant="spinner" text="Loading..." />
			</div>
		);
	}

	return (
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
	);
}

export default App;

interface AppLayoutProps {
	user: UserState;
	errors: { current: Error | null; history: unknown[] };
	errorActions: { clearError: () => void };
	tournament: TournamentState;
	tournamentActions: {
		setView: (view: string) => void;
		addVote: (vote: unknown) => void;
	};
	handleLogin: (userName: string) => Promise<boolean>;
	handleStartNewTournament: () => void;
	handleUpdateRatings: (
		ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => Promise<boolean> | undefined;
	handleTournamentSetup: (names?: NameItem[]) => void;
	handleTournamentComplete: (
		finalRatings: Record<
			string,
			{ rating: number; wins?: number; losses?: number }
		>,
	) => Promise<void>;
	isSuggestNameModalOpen: boolean;
	onCloseSuggestName: () => void;
	onOpenSuggestName: () => void;
	handleLogout: () => Promise<void>;
	handleOpenPhotos: () => void;
	ui: unknown;
	uiActions: unknown;
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
	handleLogout,
	handleOpenPhotos,
}: AppLayoutProps) {
	const { isLoggedIn } = user;
	const currentView = useAppStore(
		(state: StoreSlice) => state.tournament.currentView,
	);
	const { currentRoute, navigateTo } = useRouting();

	const appClassName = useMemo(
		() => (!isLoggedIn ? "app app--login" : "app"),
		[isLoggedIn],
	);

	const layoutStyle = useMemo(() => ({}), []);

	const mainWrapperClassName = useMemo(
		() =>
			["app-main-wrapper", !isLoggedIn ? "app-main-wrapper--login" : ""]
				.filter(Boolean)
				.join(" "),
		[isLoggedIn],
	);

	return (
		<div className={appClassName} style={layoutStyle}>
			{/* * Skip link for keyboard navigation */}
			<a href="#main-content" className="skip-link">
				Skip to main content
			</a>

			{/* * Static cat-themed background */}
			<CatBackground />

			{/* * Primary navigation lives in the navbar */}
			{isLoggedIn && (
				<AppNavbar
					view={currentView || "tournament"}
					setView={(view: string) => {
						const nextView = view;
						// * Toggle photos view: if clicking photos and already on photos, go back to tournament
						if (nextView === "photos" && currentView === "photos") {
							tournamentActions.setView("tournament");
							navigateTo("/");
						} else {
							tournamentActions.setView(nextView);

							// * Direct navigation for each view
							if (nextView === "tournament") {
								navigateTo("/");
							} else if (nextView === "photos") {
								navigateTo("/");
							}
						}
					}}
					isLoggedIn={isLoggedIn}
					userName={user.name}
					isAdmin={user.isAdmin}
					onLogout={handleLogout}
					onStartNewTournament={handleStartNewTournament}
					onOpenSuggestName={onOpenSuggestName}
					onOpenPhotos={handleOpenPhotos}
					currentRoute={currentRoute}
					onNavigate={navigateTo}
				/>
			)}

			<main id="main-content" className={mainWrapperClassName} tabIndex={-1}>
				{errors.current && isLoggedIn && (
					<Error
						variant="list"
						error={errors.current}
						onDismiss={() => errorActions.clearError()}
						onRetry={() => window.location.reload()}
					/>
				)}

				<ViewRouter
					isLoggedIn={isLoggedIn}
					onLogin={handleLogin}
					tournament={tournament}
					userName={user.name}
					onStartNewTournament={handleStartNewTournament}
					onUpdateRatings={handleUpdateRatings}
					onTournamentSetup={handleTournamentSetup}
					onTournamentComplete={handleTournamentComplete}
					onVote={(vote: unknown) => tournamentActions.addVote(vote)}
					onOpenSuggestName={onOpenSuggestName}
				/>

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
				<NameSuggestionModal
					isOpen={isSuggestNameModalOpen}
					onClose={onCloseSuggestName}
				/>
			</main>
		</div>
	);
}

// Test auto-deployment - Wed Oct 22 21:26:25 CDT 2025
// Auto-deployment test 2 - Wed Oct 22 21:27:26 CDT 2025
