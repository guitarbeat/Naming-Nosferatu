import React from "react";
import PropTypes from "prop-types";
import Error from "../Error/Error";
import Login from "@features/auth/Login";
import { useRouting } from "@hooks/useRouting";
// * Import components directly (no lazy loading to prevent chunking issues)
import Tournament from "@features/tournament/Tournament";
import TournamentSetup from "@features/tournament/TournamentSetup";
import Results from "@features/tournament/Results";
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
  const { isRoute } = useRouting();

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

  // * Only show results if tournament is complete AND we have names (completed tournament)
  // * This prevents showing results when tournament is reset but route is still /results
  const shouldShowResults =
    tournament.isComplete && tournament.names !== null && isRoute("/results");

  if (shouldShowResults) {
    return (
      <Results
        ratings={tournament.ratings}
        onStartNew={onStartNewTournament}
        userName={userName}
        onUpdateRatings={onUpdateRatings}
        currentTournamentNames={tournament.names}
        voteHistory={tournament.voteHistory}
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
