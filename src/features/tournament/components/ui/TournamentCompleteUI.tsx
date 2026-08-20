import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import useAppStore from "@/store/appStore";

export function TournamentCompleteUI() {
	const { tournamentActions } = useAppStore();

	return (
		<motion.div
			key="complete"
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className="w-full flex justify-center py-6 sm:py-10"
		>
			<div className="w-full max-w-2xl text-center px-4 sm:px-6">
				<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase tracking-tighter">
					A victor emerges from the eternal tournament
				</h2>
				<div className="flex justify-center mb-6 sm:mb-8">
					<div className="p-4 sm:p-6 bg-primary/10 rounded-full border border-primary/20">
						<Trophy className="size-12 sm:size-14 text-primary" />
					</div>
				</div>
				<p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10">
					Your personal rankings have been updated. Head over to the{" "}
					<strong className="text-primary">Analyze</strong> section to
					see the full breakdown and compare results!
				</p>
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
					<button
						type="button"
						onClick={() =>
							document
								.getElementById("analysis")
								?.scrollIntoView({ behavior: "smooth", block: "start" })
						}
						className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg font-semibold transition-all duration-200 active:scale-[0.98]"
					>
						See Results
					</button>
					<button
						type="button"
						onClick={() => tournamentActions.resetTournament()}
						className="w-full sm:w-auto px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-lg font-semibold transition-all duration-200 active:scale-[0.98]"
					>
						Pick Different Names
					</button>
				</div>
			</div>
		</motion.div>
	);
}
