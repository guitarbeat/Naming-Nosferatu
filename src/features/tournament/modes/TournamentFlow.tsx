import { AnimatePresence, motion } from "framer-motion";
import useAppStore from "@/store/appStore";
import { NameSelector } from "../components/NameSelector";
import { TournamentFlowComplete } from "../components/TournamentFlowComplete";
import { useSaveTournamentRatings, useTournamentHandlers } from "../hooks";

export default function TournamentFlow() {
	const { user, tournament, tournamentActions } = useAppStore();
	const { handleStartNewTournament } = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
	});

	useSaveTournamentRatings({
		isComplete: tournament.isComplete,
		ratings: tournament.ratings,
		userName: user.name,
		voteHistory: tournament.voteHistory,
	});

	return (
		<div className="flex w-full flex-col gap-2">
			<AnimatePresence mode="wait">
				{tournament.isComplete && tournament.names !== null ? (
					<TournamentFlowComplete onStartNewTournament={handleStartNewTournament} />
				) : (
					<motion.div
						key="setup"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="w-full py-0"
					>
						<NameSelector />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
