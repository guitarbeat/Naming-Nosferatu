import React from "react";
import PropTypes from "prop-types";
import Error from "../Error/Error";
import Login from "@features/auth/Login";
import { useRouting } from "@hooks/useRouting";
// * Import components directly (no lazy loading to prevent chunking issues)
import Tournament from "@features/tournament/Tournament";
import TournamentSetup from "@features/tournament/TournamentSetup";
import Dashboard from "@features/tournament/Dashboard";
import BongoPage from "@features/bongo/BongoPage";

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
  const { isRoute, currentRoute } = useRouting();

  // Handle special routes first
  // NOTE: The /bongo route is intentionally hidden and only accessible via direct URL
  // There is no navigation link to this page - users must manually type /bongo in the URL
  if (isRoute("/bongo")) {
    return <BongoPage isLoggedIn={isLoggedIn} userName={userName} />;
  }

  if (!isLoggedIn) {
    return <Login onLogin={onLogin} />;
  }

  if (tournament.names === null) {
    return (
      <TournamentSetup
        onStart={onTournamentSetup}
        userName={userName}
        existingRatings={tournament.ratings}
      />
    );
  }

  // * Show Dashboard (Results + Analysis) if on /results or /analysis routes
  // * Check route path (without query params) to determine if we should show dashboard
  const currentPath =
    typeof window !== "undefined"
      ? window.location.pathname
      : currentRoute.split("?")[0].split("#")[0];
  const shouldShowDashboard =
    currentPath === "/results" || currentPath === "/analysis";

  if (shouldShowDashboard) {
    const hasPersonalData = tournament.isComplete && tournament.names !== null;

    // * Check URL for analysis parameter to determine initial view mode
    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    const isAnalysisMode = urlParams.get("analysis") === "true";

    // * Determine mode: if analysis=true, show global only; if /results, show personal (or both if has data)
    const dashboardMode = isAnalysisMode
      ? "global"
      : hasPersonalData
        ? "personal"
        : "global";

    return (
      <Dashboard
        personalRatings={hasPersonalData ? tournament.ratings : null}
        currentTournamentNames={hasPersonalData ? tournament.names : null}
        voteHistory={hasPersonalData ? tournament.voteHistory : null}
        onStartNew={onStartNewTournament}
        onUpdateRatings={onUpdateRatings}
        userName={userName}
        mode={dashboardMode}
      />
    );
  }

  return (
    <Error variant="boundary">
      <Tournament
        names={tournament.names}
        existingRatings={tournament.ratings}
        onComplete={onTournamentComplete}
        userName={userName}
        onVote={onVote}
      />
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
