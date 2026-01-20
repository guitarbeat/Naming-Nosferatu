import { AnimatePresence, motion } from "framer-motion";
import useUserSession from "../../core/hooks/useUserSession";
import useAppStore from "../../core/store/useAppStore";
import Button from "../../shared/components/Button";
import Card from "../../shared/components/Card";
import { PhotoGallery } from "../../shared/components/Gallery";
import { NameSuggestion } from "../../shared/components/NameSuggestion/NameSuggestion";
import Tournament from "./Tournament";
import { useTournamentHandlers, useTournamentManager } from "./TournamentHooks";
import TournamentSetup from "./TournamentSetup";

export default function TournamentFlow() {
	const { user, tournament, tournamentActions, ui } = useAppStore();
	const { login } = useUserSession();
	const { handleTournamentComplete, handleStartNewTournament, handleTournamentSetup } =
		useTournamentHandlers({
			userName: user.name,
			tournamentActions,
		});

	const {
		galleryImages,
		isAdmin,
		handleImageOpen,
		handleImagesUploaded,
		showAllPhotos,
		setShowAllPhotos,
	} = useTournamentManager({
		userName: user.name || "",
	});

	return (
		<div className="w-full max-w-6xl mx-auto flex flex-col gap-8 min-h-[80vh] py-8">
			{/* Gallery Section - Toggled via Nav */}
			<AnimatePresence>
				{ui.showGallery && (
					<motion.section
						id="gallery"
						className="w-full scroll-mt-24"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						<div className="w-full p-4 bg-[var(--surface-color)] rounded-xl border border-[var(--border-color)] shadow-sm">
							<h2 className="text-3xl font-bold mb-6 text-center gradient-text">Photo Gallery</h2>
							<PhotoGallery
								galleryImages={galleryImages}
								isAdmin={isAdmin}
								userName={user.name || ""}
								onImagesUploaded={handleImagesUploaded}
								onImageOpen={handleImageOpen}
								showAllPhotos={showAllPhotos}
								onShowAllPhotosToggle={() => setShowAllPhotos(!showAllPhotos)}
							/>
						</div>
					</motion.section>
				)}
			</AnimatePresence>

			{/* Main Tournament Flow Area - Swaps between Setup and Play */}
			<section
				id="tournament-area"
				className="flex flex-col items-center justify-center p-4 min-h-[500px]"
			>
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
								background="glass"
								padding="xl"
								shadow="xl"
								enableTilt={true}
								className="text-center max-w-2xl"
							>
								<h2 className="text-4xl font-bold mb-6 gradient-text">Tournament Complete!</h2>
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
								onLogin={login}
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
			</section>

			{/* Suggest Name Section */}
			<section
				id="suggest"
				className="flex flex-col items-center justify-center p-4 mt-8 border-t border-slate-800/20 pt-12"
			>
				<div className="w-full max-w-4xl">
					<h2 className="text-2xl font-bold mb-8 text-center text-slate-400">Suggest a Name</h2>
					<NameSuggestion />
				</div>
			</section>
		</div>
	);
}
