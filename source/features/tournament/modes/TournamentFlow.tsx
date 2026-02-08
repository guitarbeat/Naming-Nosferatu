import { AnimatePresence, motion } from "framer-motion";
import Tournament from "@/features/tournament/Tournament";
import Button from "@/layout/Button";
import Card, { type GlassConfig } from "@/layout/Card";
import { getGlassPreset } from "@/layout/GlassPresets";
import { Section } from "@/layout/Section";
import useAppStore from "@/store/appStore";
import { NameSuggestion } from "../components/NameSuggestion";
import { useTournamentHandlers } from "../hooks/useTournamentHandlers";
import TournamentSetup from "./TournamentSetup";

export default function TournamentFlow() {
	const { user, tournament, tournamentActions } = useAppStore();

	const { handleTournamentComplete, handleStartNewTournament, handleTournamentSetup } =
		useTournamentHandlers({
			userName: user.name,
			tournamentActions,
		});

	return (
		<div className="w-full flex flex-col gap-8">
			{/* Main Tournament Flow Area - Swaps between Setup and Play */}
			<Section id="tournament-area" variant="minimal" padding="compact" maxWidth="full" scrollMargin={false}>
				<AnimatePresence mode="wait">
					{tournament.isComplete && tournament.names !== null ? (
						<motion.div
							key="complete"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="w-full flex justify-center py-10"
						>
							<Card
								liquidGlass={{...getGlassPreset("card")} as GlassConfig}
								padding="xl"
								shadow="xl"
								enableTilt={true}
								className="text-center max-w-2xl"
							>
								<h2 className="text-4xl font-bold mb-6 gradient-text uppercase tracking-tighter">
									A victor emerges from the eternal tournament
								</h2>
								<div className="flex justify-center mb-8">
									<div className="text-6xl p-6 bg-purple-500/10 rounded-full border border-purple-500/20">
										🏆
									</div>
								</div>
								<p className="text-lg text-slate-300 mb-10">
									Your personal rankings have been updated. Head over to the{" "}
									<strong className="text-purple-400">Analyze</strong> section to see the full
									breakdown and compare results!
								</p>
								<div className="flex gap-4 justify-center">
									<Button
										onClick={() =>
											document.getElementById("analysis")?.scrollIntoView({ behavior: "smooth" })
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
						</motion.div>
					) : tournament.names !== null ? (
						/* PLAY MODE */
						<motion.div
							key="tournament"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="w-full"
						>
							<Tournament
								names={tournament.names}
								existingRatings={tournament.ratings}
								onComplete={handleTournamentComplete}
								userName={user.name}
								onVote={tournamentActions.addVote}
							/>
						</motion.div>
					) : (
						/* SETUP MODE */
						<motion.div
							key="setup"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							className="w-full"
						>
							<TournamentSetup
								onStart={(setupData) => {
									handleTournamentSetup(setupData);
									// Seamless transition - no scroll needed
								}}
								userName={user.name}
								isLoggedIn={user.isLoggedIn}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</Section>

			{/* Suggest Name Section - Hidden during active tournament play */}
			{(tournament.names === null || tournament.isComplete) && (
				<Section id="suggest" variant="minimal" padding="comfortable" maxWidth="xl" separator scrollMargin={false} compact>
					<h2 className="text-2xl font-bold mb-8 text-center text-slate-400">Suggest a Name</h2>
					<NameSuggestion />
				</Section>
			)}
		</div>
	);
}
