// @ts-nocheck
/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use centralized state management and services for better maintainability.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { useCallback, useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
// * Use path aliases for better tree shaking
// * Import CatBackground directly (no lazy loading to prevent chunking issues)
import CatBackground from "@components/CatBackground/CatBackground";
import ViewRouter from "@components/ViewRouter/ViewRouter";
import { Error, Loading, ScrollToTopButton } from "@components";
import { AppNavbar } from "./shared/components/AppNavbar";
import { NameSuggestionModal } from "./shared/components/NameSuggestionModal/NameSuggestionModal";

// * Performance monitoring
import {
  initializePerformanceMonitoring,
  cleanupPerformanceMonitoring,
} from "./shared/utils/performanceMonitor";

// * Core state and routing hooks
import useUserSession from "@hooks/useUserSession";
import { useRouting } from "@hooks/useRouting";
import { useTournamentRoutingSync } from "@hooks/useTournamentRoutingSync";
import useAppStore, {
  useAppStoreInitialization,
} from "@core/store/useAppStore";
import { devError } from "./shared/utils/logger";
import { useKeyboardShortcuts } from "./core/hooks/useKeyboardShortcuts";
import { useTournamentHandlers } from "./core/hooks/useTournamentHandlers";

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
  } = useAppStore();

  // * Explicitly select currentView to ensure re-renders when it changes
  const currentView = useAppStore((state) => state.tournament.currentView);

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

  // Get admin status from server-side validation
  const { isAdmin } = user;

  // * Keyboard shortcuts - consolidated into custom hook
  useKeyboardShortcuts({
    navigateTo,
  });

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

  // * Handle logout
  const handleLogout = useCallback(async () => {
    logout(); // * This already calls userActions.logout() internally
    tournamentActions.resetTournament();
  }, [logout, tournamentActions]);

  // * Handle user login
  const handleLogin = useCallback(
    async (userName) => {
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

  // * Memoize main content to prevent unnecessary re-renders

  // * Handle opening photos view
  const handleOpenPhotos = useCallback(() => {
    if (currentView === "photos") {
      tournamentActions.setView("tournament");
      navigateTo("/");
    } else {
      tournamentActions.setView("photos");
      navigateTo("/");
    }
  }, [currentView, tournamentActions, navigateTo]);

  // * Handle opening suggest name modal
  const handleOpenSuggestName = useCallback(() => {
    setIsSuggestNameModalOpen(true);
  }, []);

  // * Handle closing suggest name modal
  const handleCloseSuggestName = useCallback(() => {
    setIsSuggestNameModalOpen(false);
  }, []);

  // * Memoize navbar props to prevent unnecessary re-renders
  const navbarProps = useMemo(
    () => ({
      view: currentView || "tournament",
      setView: (view) => {
        // * Toggle photos view: if clicking photos and already on photos, go back to tournament
        if (view === "photos" && currentView === "photos") {
          tournamentActions.setView("tournament");
          navigateTo("/");
        } else {
          tournamentActions.setView(view);

          // * Direct navigation for each view
          if (view === "tournament") {
            navigateTo("/");
          } else if (view === "photos") {
            // * Stay on same route, just change view state
            // * ViewRouter will show TournamentSetup which handles photos view
            navigateTo("/");
          }
        }
      },
      isLoggedIn: user.isLoggedIn,
      userName: user.name,
      isAdmin,
      onLogout: handleLogout,
      onStartNewTournament: handleStartNewTournament,
      onOpenSuggestName: handleOpenSuggestName,
      onOpenPhotos: handleOpenPhotos,
      // * Pass breadcrumbs to navbar
      currentView: currentView || "tournament",
      currentRoute,
      onNavigate: navigateTo,
    }),
    [
      currentView,
      tournamentActions,
      user.isLoggedIn,
      user.name,
      isAdmin,
      handleLogout,
      handleStartNewTournament,
      navigateTo,
      handleOpenSuggestName,
      handleOpenPhotos,
      currentRoute,
    ],
  );

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
      navbarProps={navbarProps}
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
      isAdmin={isAdmin}
      isSuggestNameModalOpen={isSuggestNameModalOpen}
      onCloseSuggestName={handleCloseSuggestName}
    />
  );
}

export default App;

function AppLayout({
  navbarProps,
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
}) {
  const { isLoggedIn } = user;

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
      <AppNavbar {...navbarProps} />

      <main id="main-content" className={mainWrapperClassName} tabIndex="-1">
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
          onVote={(vote) => tournamentActions.addVote(vote)}
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

AppLayout.propTypes = {
  navbarProps: PropTypes.shape({}).isRequired,
  user: PropTypes.shape({
    isLoggedIn: PropTypes.bool.isRequired,
    name: PropTypes.string,
  }).isRequired,
  errors: PropTypes.shape({
    current: PropTypes.instanceOf(Error),
  }).isRequired,
  errorActions: PropTypes.shape({
    clearError: PropTypes.func.isRequired,
  }).isRequired,
  tournament: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
  }).isRequired,
  tournamentActions: PropTypes.shape({
    addVote: PropTypes.func.isRequired,
  }).isRequired,
  handleLogin: PropTypes.func.isRequired,
  handleStartNewTournament: PropTypes.func.isRequired,
  handleUpdateRatings: PropTypes.func.isRequired,
  handleTournamentSetup: PropTypes.func.isRequired,
  handleTournamentComplete: PropTypes.func.isRequired,
  ui: PropTypes.shape({}).isRequired,
  uiActions: PropTypes.shape({}).isRequired,
  isAdmin: PropTypes.bool.isRequired,
  isSuggestNameModalOpen: PropTypes.bool.isRequired,
  onCloseSuggestName: PropTypes.func.isRequired,
};

// Test auto-deployment - Wed Oct 22 21:26:25 CDT 2025
// Auto-deployment test 2 - Wed Oct 22 21:27:26 CDT 2025
