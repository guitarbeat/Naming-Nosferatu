import { AnimatePresence, motion } from "framer-motion";

import { useTournamentHandlers } from "./TournamentHooks";
import useAppStore from "../../core/store/useAppStore";
import useUserSession from "../../core/hooks/useUserSession";
import TournamentSetup from "./TournamentSetup";
import Tournament from "./Tournament";
import UnifiedDashboard, { PersonalResults } from "./UnifiedDashboard";

export default function TournamentFlow() {
  const { user, tournament, tournamentActions } = useAppStore();
  const { login } = useUserSession();
  const {
    handleTournamentComplete,
    handleStartNewTournament,
    handleTournamentSetup,
    handleUpdateRatings,
  } = useTournamentHandlers({
    userName: user.name,
    tournamentActions,
    navigateTo: () => {},
  });

  let content, key;
  if (tournament.isComplete && tournament.names !== null) {
    key = "results";
    content = (
      <Card
        background="glass"
        padding="xl"
        shadow="xl"
        enableTilt
        className="text-center max-w-2xl"
      >
        <h2 className="text-4xl font-bold mb-6 gradient-text">
          Tournament Complete!
        </h2>
        <div className="flex justify-center mb-8">
          <div className="text-6xl p-6 bg-purple-500/10 rounded-full border border-purple-500/20">
            🏆
          </div>
        </div>
        <p className="text-lg text-slate-300 mb-10">
          Your personal rankings have been updated. Head over to the{" "}
          <strong className="text-purple-400">Analyze</strong> section to see
          the full breakdown and compare results!
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() =>
              document
                .getElementById("analysis")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            variant="primary"
          >
            Analyze Results
          </Button>
          <Button onClick={handleStartNewTournament} variant="secondary">
            Start New Tournament
          </Button>
        </div>
      </Card>
    );
  } else if (tournament.names !== null) {
    key = "active";
    content = (
      <Tournament
        names={tournament.names}
        existingRatings={tournament.ratings}
        onComplete={handleTournamentComplete}
        userName={user.name}
        onVote={tournamentActions.addVote}
      />
    );
  } else {
    key = "setup";
    content = (
      <TournamentSetup
        onLogin={login}
        onStart={handleTournamentSetup}
        userName={user.name}
        isLoggedIn={user.isLoggedIn}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto min-h-[80vh] flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
