/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use centralized state management and services for better maintainability.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
// * Use path aliases for better tree shaking
// * Import CatBackground directly (no lazy loading to prevent chunking issues)
import CatBackground from "@components/CatBackground/CatBackground";
import ViewRouter from "@components/ViewRouter/ViewRouter";
import { Error, Loading, ScrollToTopButton } from "@components";
import { NavbarProvider, useNavbar } from "./shared/components/ui/navbar";
import { AppNavbar } from "./shared/components/AppNavbar/AppNavbar";
import { NameSuggestionModal } from "./shared/components/NameSuggestionModal/NameSuggestionModal";

// * Core state and routing hooks
import useUserSession from "@hooks/useUserSession";
import { useRouting } from "@hooks/useRouting";
import { useTournamentRoutingSync } from "@hooks/useTournamentRoutingSync";
import { useThemeSync } from "@hooks/useThemeSync";
import useAppStore, {
  useAppStoreInitialization,
} from "@core/store/useAppStore";
import { ErrorManager } from "@services/errorManager";
import { tournamentsAPI } from "@services/supabase/api";
import { NAVBAR } from "@core/constants";
import { devLog, devWarn, devError } from "./shared/utils/logger";
import { ratingsToArray, ratingsToObject } from "./shared/utils/ratingUtils";
import { useKeyboardShortcuts } from "./core/hooks/useKeyboardShortcuts";

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

  // * Handle tournament completion
  const handleTournamentComplete = useCallback(
    async (finalRatings) => {
      try {
        devLog("[App] handleTournamentComplete called with:", finalRatings);

        if (!user.name) {
          throw new Error("No user name available");
        }

        // * Convert ratings using utility functions
        const ratingsArray = ratingsToArray(finalRatings);
        const updatedRatings = ratingsToObject(ratingsArray);

        devLog("[App] Ratings to save:", ratingsArray);

        // * Save ratings to database
        const saveResult = await tournamentsAPI.saveTournamentRatings(
          user.name,
          ratingsArray
        );

        devLog("[App] Save ratings result:", saveResult);

        if (!saveResult.success) {
          devWarn(
            "[App] Failed to save ratings to database:",
            saveResult.error
          );
        }

        // * Update store with new ratings
        tournamentActions.setRatings(updatedRatings);
        tournamentActions.setComplete(true);

        devLog("[App] Tournament marked as complete, navigating to /results");

        // * Navigate to results page
        navigateTo("/results");
      } catch (error) {
        devError("[App] Error in handleTournamentComplete:", error);
        ErrorManager.handleError(error, "Tournament Completion", {
          isRetryable: true,
          affectsUserData: true,
          isCritical: false,
        });
      }
    },
    [user.name, tournamentActions, navigateTo]
  );

  // * Handle start new tournament
  const handleStartNewTournament = useCallback(() => {
    tournamentActions.resetTournament();
  }, [tournamentActions]);

  // * Handle tournament setup
  const handleTournamentSetup = useCallback(
    (names) => {
      // * Reset tournament state and set loading
      tournamentActions.resetTournament();
      tournamentActions.setLoading(true);

      // Direct tournament creation
      const processedNames = names;

      tournamentActions.setNames(processedNames);
      // Ensure we are on the tournament view after starting
      tournamentActions.setView("tournament");

      // * Use setTimeout to ensure the loading state is visible and prevent flashing
      setTimeout(() => {
        tournamentActions.setLoading(false);
      }, 100);
    },
    [tournamentActions]
  );

  // * Handle ratings update
  const handleUpdateRatings = useCallback(
    async (adjustedRatings) => {
      try {
        // Convert to array format for database save
        let ratingsArray;
        if (Array.isArray(adjustedRatings)) {
          ratingsArray = adjustedRatings;
        } else {
          ratingsArray = Object.entries(adjustedRatings).map(
            ([name, data]) => ({
              name,
              rating: data.rating || 1500,
              wins: data.wins || 0,
              losses: data.losses || 0,
            })
          );
        }

        // * Save ratings to database
        if (user.name) {
          const saveResult = await tournamentsAPI.saveTournamentRatings(
            user.name,
            ratingsArray
          );

          devLog("[App] Update ratings result:", saveResult);
        }

        // Convert to object format for store
        const updatedRatings = ratingsArray.reduce((acc, item) => {
          acc[item.name] = {
            rating: item.rating,
            wins: item.wins || 0,
            losses: item.losses || 0,
          };
          return acc;
        }, {});

        tournamentActions.setRatings(updatedRatings);
        return true;
      } catch (error) {
        ErrorManager.handleError(error, "Rating Update", {
          isRetryable: true,
          affectsUserData: true,
          isCritical: false,
        });
        throw error;
      }
    },
    [tournamentActions, user.name]
  );

  // * Handle logout
  const handleLogout = useCallback(async () => {
    logout(); // * This already calls userActions.logout() internally
    tournamentActions.resetTournament();
  }, [logout, tournamentActions]);

  // * Handle theme preference change (light, dark, or system)
  const handleThemePreferenceChange = useCallback(
    (nextPreference) => {
      uiActions.setTheme(nextPreference);
    },
    [uiActions]
  );

  useThemeSync(ui.theme);

  // * Welcome screen removed

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
    [login]
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
      themePreference: ui.themePreference,
      currentTheme: ui.theme,
      onThemePreferenceChange: handleThemePreferenceChange,
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
      ui.themePreference,
      ui.theme,
      handleThemePreferenceChange,
      navigateTo,
      handleOpenSuggestName,
      handleOpenPhotos,
      currentRoute,
    ]
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

// * Provider-wrapped layout to guarantee navbar context
function AppLayout(props) {
  return (
    <NavbarProvider>
      <AppLayoutInner {...props} />
    </NavbarProvider>
  );
}

function AppLayoutInner({
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
  const { collapsed, collapsedWidth, toggleCollapsed } = useNavbar();
  const { isLoggedIn } = user;

  // * Listen for keyboard shortcut to toggle navbar
  useEffect(() => {
    const handleToggleNavbar = () => {
      toggleCollapsed();
    };

    window.addEventListener("toggleNavbar", handleToggleNavbar);
    return () => window.removeEventListener("toggleNavbar", handleToggleNavbar);
  }, [toggleCollapsed]);

  const appClassName = [
    "app",
    collapsed ? "app--navbar-collapsed" : "",
    !isLoggedIn ? "app--login" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const layoutStyle = useMemo(
    () => ({
      "--navbar-expanded-width": NAVBAR.EXPANDED_WIDTH_RESPONSIVE,
      "--navbar-collapsed-width": `${collapsedWidth}px`,
    }),
    [collapsedWidth]
  );

  const mainWrapperClassName = useMemo(
    () =>
      ["app-main-wrapper", !isLoggedIn ? "app-main-wrapper--login" : ""]
        .filter(Boolean)
        .join(" "),
    [isLoggedIn]
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
