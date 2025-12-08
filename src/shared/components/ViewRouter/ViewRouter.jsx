import React, { lazy, Suspense } from "react";
import PropTypes from "prop-types";
import Loading from "../Loading/Loading";
import Error from "../Error/Error";
import Login from "@features/auth/Login";
import { useRouting } from "@hooks/useRouting";

/**
 * * Safely wraps a dynamic import to prevent React's lazy initializer from
 * encountering non-stringifiable error objects or missing default exports
 * @param {Function} importFn - Function that returns a dynamic import promise
 * @param {Function} fallbackComponent - Function that returns a fallback component
 * @returns {Promise} Promise that resolves to a module or fallback component
 */
function safeLazyImport(importFn, fallbackComponent) {
  return importFn()
    .then((module) => {
      // * Check if module has a default export
      if (!module || typeof module.default === "undefined") {
        const errorMessage =
          module && Object.keys(module).length > 0
            ? "Module loaded but missing default export"
            : "Module loaded but is empty";

        if (process.env.NODE_ENV === "development") {
          console.error("Lazy import error:", errorMessage, {
            moduleKeys: module ? Object.keys(module) : [],
            module,
          });
        }

        // * Return fallback component module
        return {
          default: fallbackComponent,
        };
      }

      // * Module has valid default export
      return module;
    })
    .catch((error) => {
      // * Ensure error is stringifiable before React tries to log it
      // * This prevents "Cannot convert object to primitive value" errors
      try {
        // * Try to stringify the error to ensure it's safe
        String(error);
        JSON.stringify(error);
      } catch {
        // * If error can't be stringified, create a safe replacement
        const safeError = new Error(
          error?.message || String(error) || "Module load failed",
        );
        safeError.name = error?.name || "LoadError";
        safeError.stack = error?.stack || "";
        // * Log the original error safely if possible
        if (process.env.NODE_ENV === "development") {
          try {
            console.warn("Lazy import failed:", safeError.message);
          } catch {
            // Ignore logging errors
          }
        }
      }
      // * Return fallback component module
      return {
        default: fallbackComponent,
      };
    });
}

// * Dynamic imports with better error handling and loading states
const Tournament = lazy(() =>
  safeLazyImport(
    () => import("@features/tournament/Tournament"),
    () => (
      <Error
        variant="list"
        error={{
          message: "Failed to load Tournament",
          details:
            "The tournament comparison page could not be loaded. This might be due to a network issue or corrupted data.",
          suggestion:
            "Try refreshing the page or returning to the setup screen to start a new tournament.",
        }}
      />
    ),
  ),
);
const TournamentSetup = lazy(() =>
  safeLazyImport(
    () => import("@features/tournament/TournamentSetup"),
    () => (
      <Error
        variant="list"
        error={{
          message: "Failed to load Tournament Setup",
          details:
            "There was an error loading the cat name selection page. This could be due to a network issue or a problem with the application code.",
          suggestion:
            "Please try refreshing the page. If the problem persists, check your internet connection or contact support.",
        }}
      />
    ),
  ),
);
const Results = lazy(() =>
  safeLazyImport(
    () => import("@features/tournament/Results"),
    () => (
      <Error
        variant="list"
        error={{
          message: "Failed to load Results",
          details:
            "The tournament results page could not be loaded. Your tournament data may still be saved.",
          suggestion:
            "Try refreshing the page. If you just completed a tournament, check your profile to see your saved results.",
        }}
      />
    ),
  ),
);
const BongoPage = lazy(() =>
  safeLazyImport(
    () => import("@features/bongo/BongoPage"),
    () => (
      <Error variant="list" error={{ message: "Failed to load Bongo Page" }} />
    ),
  ),
);

export default function ViewRouter({
  isLoggedIn,
  onLogin,
  tournament,
  userName,
  onStartNewTournament,
  onUpdateRatings,
  onTournamentSetup,
  onTournamentComplete,
  onVote,
}) {
  const { isRoute } = useRouting();

  // Handle special routes first
  // NOTE: The /bongo route is intentionally hidden and only accessible via direct URL
  // There is no navigation link to this page - users must manually type /bongo in the URL
  if (isRoute("/bongo")) {
    return (
      <Suspense
        fallback={<Loading variant="spinner" text="Loading Bongo Cat..." />}
      >
        <BongoPage isLoggedIn={isLoggedIn} userName={userName} />
      </Suspense>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={onLogin} />;
  }

  if (tournament.names === null) {
    return (
      <Suspense
        fallback={
          <Loading variant="spinner" text="Loading Tournament Setup..." />
        }
      >
        <TournamentSetup
          onStart={onTournamentSetup}
          userName={userName}
          existingRatings={tournament.ratings}
        />
      </Suspense>
    );
  }

  // * Only show results if tournament is complete AND we have names (completed tournament)
  // * This prevents showing results when tournament is reset but route is still /results
  const shouldShowResults =
    tournament.isComplete && tournament.names !== null && isRoute("/results");

  if (shouldShowResults) {
    return (
      <Suspense
        fallback={<Loading variant="spinner" text="Loading Results..." />}
      >
        <Results
          ratings={tournament.ratings}
          onStartNew={onStartNewTournament}
          userName={userName}
          onUpdateRatings={onUpdateRatings}
          currentTournamentNames={tournament.names}
          voteHistory={tournament.voteHistory}
        />
      </Suspense>
    );
  }

  return (
    <Error variant="boundary">
      <Suspense
        fallback={<Loading variant="spinner" text="Loading Tournament..." />}
      >
        <Tournament
          names={tournament.names}
          existingRatings={tournament.ratings}
          onComplete={onTournamentComplete}
          userName={userName}
          onVote={onVote}
        />
      </Suspense>
    </Error>
  );
}

ViewRouter.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired,
  onLogin: PropTypes.func.isRequired,
  tournament: PropTypes.shape({
    names: PropTypes.arrayOf(PropTypes.object),
    ratings: PropTypes.object.isRequired,
    isComplete: PropTypes.bool.isRequired,
    voteHistory: PropTypes.array.isRequired,
    currentView: PropTypes.string.isRequired,
  }).isRequired,
  userName: PropTypes.string,
  onStartNewTournament: PropTypes.func.isRequired,
  onUpdateRatings: PropTypes.func.isRequired,
  onTournamentSetup: PropTypes.func.isRequired,
  onTournamentComplete: PropTypes.func.isRequired,
  onVote: PropTypes.func.isRequired,
};
