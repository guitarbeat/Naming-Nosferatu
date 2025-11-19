import React, { lazy, Suspense } from "react";
import PropTypes from "prop-types";
import Loading from "../Loading/Loading";
import Error from "../Error/Error";
import Login from "@features/auth/Login";
import { useRouting } from "@hooks/useRouting";

// * Dynamic imports with better error handling and loading states
const Tournament = lazy(() =>
  import("@features/tournament/Tournament").catch(() => ({
    default: () => (
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
  })),
);
const TournamentSetup = lazy(() =>
  import("@features/tournament/TournamentSetup").catch(() => ({
    default: () => (
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
  })),
);
const Results = lazy(() =>
  import("@features/tournament/Results").catch(() => ({
    default: () => (
      <Error
        variant="list"
        error={{
          message: "Failed to load Results",
          details:
            "The tournament results page could not be loaded. Your tournament data may still be saved.",
          suggestion:
            "Try refreshing the page. If you just completed a tournament, you can check your profile to see your saved results.",
        }}
      />
    ),
  })),
);
const Profile = lazy(() =>
  import("@features/profile/Profile").catch(() => ({
    default: () => (
      <Error
        variant="list"
        error={{
          message: "Failed to load Profile",
          details:
            "Your profile page could not be loaded. This might be due to a network issue or a problem accessing your data.",
          suggestion:
            "Please try refreshing the page. If the problem continues, log out and log back in.",
        }}
      />
    ),
  })),
);
const BongoPage = lazy(() =>
  import("@features/bongo/BongoPage").catch(() => ({
    default: () => (
      <Error variant="list" error={{ message: "Failed to load Bongo Page" }} />
    ),
  })),
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

  const shouldShowProfile =
    isRoute("/profile") || tournament.currentView === "profile";

  if (shouldShowProfile) {
    return (
      <Suspense
        fallback={<Loading variant="spinner" text="Loading Profile..." />}
      >
        <Profile
          userName={userName}
          onStartNewTournament={onStartNewTournament}
          ratings={tournament.ratings}
          onUpdateRatings={onUpdateRatings}
        />
      </Suspense>
    );
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

  const shouldShowResults = tournament.isComplete || isRoute("/results");

  if (shouldShowResults) {
    if (!tournament.isComplete) {
      return (
        <Error
          variant="list"
          error={{
            message:
              "Results are only available after completing a tournament.",
          }}
        />
      );
    }

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
    names: PropTypes.any,
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
