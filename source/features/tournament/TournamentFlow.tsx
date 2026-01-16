import { AnimatePresence, motion } from "framer-motion";

import { useTournamentHandlers } from "./TournamentHooks";
import useAppStore from "../../core/store/useAppStore";
import useUserSession from "../../core/hooks/useUserSession";
import TournamentSetup from "./TournamentSetup";
import Tournament from "./Tournament";
import TournamentDashboard from "./TournamentDashboard";


export function TournamentFlow() {
    const { user, tournament, tournamentActions } = useAppStore();
    const { login } = useUserSession();
    const { handleTournamentComplete, handleStartNewTournament, handleTournamentSetup, handleUpdateRatings } = useTournamentHandlers({ userName: user.name, tournamentActions, navigateTo: () => { } });

    let content, key;
    if (tournament.isComplete && tournament.names !== null) {
        key = "results";
        content = (
            <TournamentDashboard
                personalRatings={tournament.ratings}
                currentTournamentNames={tournament.names}
                voteHistory={tournament.voteHistory}
                onStartNew={handleStartNewTournament}
                onUpdateRatings={handleUpdateRatings as any}
                userName={user.name || ""}
                mode="personal"
            />
        );
    } else if (tournament.names !== null) {
        key = "active";
        content = <Tournament names={tournament.names} existingRatings={tournament.ratings as any} onComplete={handleTournamentComplete} userName={user.name} onVote={tournamentActions.addVote} />;
    } else {
        key = "setup";
        content = <TournamentSetup onLogin={login} onStart={handleTournamentSetup} userName={user.name} isLoggedIn={user.isLoggedIn} />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto min-h-[80vh] flex flex-col items-center justify-center p-4">
            <AnimatePresence mode="wait">
                <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="w-full">
                    {content}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
