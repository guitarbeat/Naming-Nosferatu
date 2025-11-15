/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use centralized state management and services for better maintainability.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
// * Use path aliases for better tree shaking
import CatBackground from '@components/CatBackground/CatBackground';
import ViewRouter from '@components/ViewRouter/ViewRouter';
import { Error, Loading } from '@components';
import PerformanceDashboard from '@components/PerformanceDashboard';
import { SidebarProvider, useSidebar } from './shared/components/AppSidebar/BaseSidebar';
import { AppSidebar } from './shared/components/AppSidebar/AppSidebar';
import ScrollToTopButton from '@components/ScrollToTopButton/ScrollToTopButton';

// * Lazy load heavy components for better code splitting
import useUserSession from '@hooks/useUserSession';
import { useRouting } from '@hooks/useRouting';
import { useTournamentRoutingSync } from '@hooks/useTournamentRoutingSync';
import { useThemeSync } from '@hooks/useThemeSync';
import useAppStore, {
  useAppStoreInitialization
} from '@core/store/useAppStore';
import { ErrorManager } from '@services/errorManager';

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
    errorActions
  } = useAppStore();

  // * Simple URL routing helpers
  const { currentRoute, navigateTo } = useRouting();

  useTournamentRoutingSync({
    currentRoute,
    navigateTo,
    isLoggedIn: user.isLoggedIn,
    currentView: tournament.currentView,
    onViewChange: tournamentActions.setView,
    isTournamentComplete: tournament.isComplete
  });

  // Get admin status from server-side validation
  const { isAdmin } = user;

  // * Keyboard shortcut for performance dashboard (Ctrl+Shift+P)
  useEffect(() => {
    if (!isAdmin) return;
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        uiActions.togglePerformanceDashboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiActions, isAdmin]);

  // * Handle tournament completion
  const handleTournamentComplete = useCallback(
    async (finalRatings) => {
      try {
        if (!user.name) {
          throw new Error('No user name available');
        }

        // Direct tournament completion processing
        const updatedRatings = finalRatings;

        // * Update store with new ratings
        tournamentActions.setRatings(updatedRatings);
        tournamentActions.setComplete(true);
      } catch (error) {
        ErrorManager.handleError(error, 'Tournament Completion', {
          isRetryable: true,
          affectsUserData: true,
          isCritical: false
        });
      }
    },
    [user.name, tournamentActions]
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
      tournamentActions.setView('tournament');

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
        // Direct rating update
        const updatedRatings = adjustedRatings;
        tournamentActions.setRatings(updatedRatings);
        return true;
      } catch (error) {
        ErrorManager.handleError(error, 'Rating Update', {
          isRetryable: true,
          affectsUserData: true,
          isCritical: false
        });
        throw error;
      }
    },
    [tournamentActions]
  );

  // * Handle logout
  const handleLogout = useCallback(async () => {
    logout(); // * This already calls userActions.logout() internally
    tournamentActions.resetTournament();
  }, [logout, tournamentActions]);

  // * Handle theme change
  const handleThemeChange = useCallback(() => {
    uiActions.toggleTheme();
  }, [uiActions]);

  useThemeSync(ui.theme);

  // * Welcome screen removed

  // * Handle user login
  const handleLogin = useCallback(
    async (userName) => {
      try {
        const success = await login(userName);
        return success;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    [login]
  );

  // * Memoize main content to prevent unnecessary re-renders

  // * Memoize sidebar props to prevent unnecessary re-renders
  const sidebarProps = useMemo(
    () => ({
      view: tournament.currentView || 'tournament',
      setView: (view) => {
        tournamentActions.setView(view);
        if (view === 'profile') {
          tournamentActions.resetTournament();
        }
      },
      isLoggedIn: user.isLoggedIn,
      userName: user.name,
      isAdmin,
      onLogout: handleLogout,
      onStartNewTournament: handleStartNewTournament,
      isLightTheme: ui.theme === 'light',
      onThemeChange: handleThemeChange,
      onTogglePerformanceDashboard: () =>
        uiActions.togglePerformanceDashboard(),
      // * Pass breadcrumbs to navbar
      currentView: tournament.currentView || 'tournament'
    }),
    [
      tournament.currentView,
      tournamentActions,
      user.isLoggedIn,
      user.name,
      isAdmin,
      handleLogout,
      handleStartNewTournament,
      ui.theme,
      handleThemeChange,
      uiActions
    ]
  );

  // * Show loading screen while initializing user session from localStorage
  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
        <Loading variant="spinner" text="Loading..." />
      </div>
    );
  }

  return (
    <SidebarProvider collapsedWidth={160} defaultCollapsed={false}>
      <AppLayout
        sidebarProps={sidebarProps}
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
      />
    </SidebarProvider>
  );
}

export default App;

function AppLayout({
  sidebarProps,
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
  ui,
  uiActions,
  isAdmin
}) {
  const { collapsed, collapsedWidth } = useSidebar();
  const {isLoggedIn} = user;
  const { view: currentView, setView, onStartNewTournament } = sidebarProps;

  const appClassName = [
    'app',
    collapsed ? 'app--sidebar-collapsed' : '',
    !isLoggedIn ? 'app--login' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const layoutStyle = useMemo(
    () => ({
      '--sidebar-expanded-width': 'clamp(208px, 24vw, 224px)',
      '--sidebar-collapsed-width': `${collapsedWidth}px`
    }),
    [collapsedWidth]
  );

  const mainWrapperClassName = useMemo(
    () =>
      [
        'app-main-wrapper',
        !isLoggedIn ? 'app-main-wrapper--login' : ''
      ]
        .filter(Boolean)
        .join(' '),
    [isLoggedIn]
  );


  const handleBreadcrumbHome = useCallback(() => {
    setView('tournament');
    if (typeof onStartNewTournament === 'function') {
      onStartNewTournament();
    }
  }, [onStartNewTournament, setView]);

  const breadcrumbItems = useMemo(() => {
    if (!isLoggedIn) {
      return [];
    }

    const items = [
      { id: 'home', label: 'Home', onClick: handleBreadcrumbHome }
    ];

    if (currentView === 'profile') {
      items.push({ id: 'profile', label: 'Profile' });
    }

    if (currentView === 'tournament') {
      items.push({ id: 'tournament', label: 'Tournament' });
    }

    return items;
  }, [currentView, handleBreadcrumbHome, isLoggedIn]);

  return (
    <div className={appClassName} style={layoutStyle}>
      {/* * Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* * Static cat-themed background */}
      <CatBackground />

      {/* * Primary navigation lives in the sidebar */}
      <AppSidebar {...sidebarProps} breadcrumbItems={breadcrumbItems} />

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


        {/* * Performance Dashboard - Admin (Aaron) only */}
        <PerformanceDashboard
          userName={user.name}
          isVisible={isAdmin && ui.showPerformanceDashboard}
          onClose={() => uiActions.setPerformanceDashboardVisible(false)}
        />

        <ScrollToTopButton isLoggedIn={isLoggedIn} />
      </main>
    </div>
  );
}

AppLayout.propTypes = {
  sidebarProps: PropTypes.shape({}).isRequired,
  user: PropTypes.shape({
    isLoggedIn: PropTypes.bool.isRequired,
    name: PropTypes.string
  }).isRequired,
  errors: PropTypes.shape({
    current: PropTypes.any
  }).isRequired,
  errorActions: PropTypes.shape({
    clearError: PropTypes.func.isRequired
  }).isRequired,
  tournament: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired
  }).isRequired,
  tournamentActions: PropTypes.shape({
    addVote: PropTypes.func.isRequired
  }).isRequired,
  handleLogin: PropTypes.func.isRequired,
  handleStartNewTournament: PropTypes.func.isRequired,
  handleUpdateRatings: PropTypes.func.isRequired,
  handleTournamentSetup: PropTypes.func.isRequired,
  handleTournamentComplete: PropTypes.func.isRequired,
  ui: PropTypes.shape({
    showPerformanceDashboard: PropTypes.bool.isRequired
  }).isRequired,
  uiActions: PropTypes.shape({
    setPerformanceDashboardVisible: PropTypes.func.isRequired
  }).isRequired,
  isAdmin: PropTypes.bool.isRequired
};

// Test auto-deployment - Wed Oct 22 21:26:25 CDT 2025
// Auto-deployment test 2 - Wed Oct 22 21:27:26 CDT 2025
