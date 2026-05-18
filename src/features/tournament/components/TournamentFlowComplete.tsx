import { motion } from "framer-motion";
import { Trophy } from "@/shared/lib/icons";

interface TournamentFlowCompleteProps {
	onStartNewTournament: () => void;
}

export function TournamentFlowComplete({ onStartNewTournament }: TournamentFlowCompleteProps) {
	return (
		<motion.div
			key="complete"
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className="flex w-full justify-center py-6 sm:py-10"
		>
			<div className="w-full max-w-2xl px-4 text-center sm:px-6">
				<h2 className="mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-bold uppercase tracking-tighter text-transparent sm:mb-6 sm:text-3xl md:text-4xl">
					A victor emerges from the eternal tournament
				</h2>
				<div className="mb-6 flex justify-center sm:mb-8">
					<div className="rounded-full border border-primary/20 bg-primary/10 p-4 sm:p-6">
						<Trophy className="size-12 text-primary sm:size-14" />
					</div>
				</div>
				<p className="mb-8 text-base text-muted-foreground sm:mb-10 sm:text-lg">
					Your personal rankings have been updated. Head over to the{" "}
					<strong className="text-primary">Analyze</strong> section to see the full breakdown and
					compare results!
				</p>
				<div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
					<button
						type="button"
						onClick={() =>
							document
								.getElementById("analysis")
								?.scrollIntoView({ behavior: "smooth", block: "start" })
						}
						className="w-full rounded-lg bg-primary px-6 py-3 font-semibold transition-colors hover:bg-primary/90 sm:w-auto"
					>
						Analyze Results
					</button>
					<button
						type="button"
						onClick={onStartNewTournament}
						className="w-full rounded-lg bg-secondary px-6 py-3 font-semibold transition-colors hover:bg-secondary/80 sm:w-auto"
					>
						Start New Tournament
					</button>
				</div>
			</div>
		</motion.div>
	);
}
