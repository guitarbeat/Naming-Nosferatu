import { motion } from "framer-motion";
import { Check, Copy, Crown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/shared/components";
import { cn } from "@/shared/lib/utils";
import { ErrorManager } from "@/shared/services/errorManager";
import type { NameItem, RatingData } from "@/shared/types";
import { RankingAdjustment } from "./RankingAdjustment";

interface PersonalResultsProps {
	personalRatings: Record<string, RatingData>;
	currentTournamentNames?: NameItem[];
	onStartNew: () => void;
	onUpdateRatings: (
		ratings:
			| Record<string, RatingData>
			| ((prev: Record<string, RatingData>) => Record<string, RatingData>),
	) => void;
	userName: string;
}

export const PersonalResults = ({
	personalRatings,
	currentTournamentNames,
	onStartNew,
	onUpdateRatings,
}: PersonalResultsProps) => {
	const [hasCopied, setHasCopied] = useState(false);
	const [showReorder, setShowReorder] = useState(false);

	const rankings = useMemo(() => {
		if (!currentTournamentNames) {
			return [];
		}

		return currentTournamentNames
			.filter((name) => personalRatings[name.name] !== undefined)
			.map((name) => {
				const pr = personalRatings[name.name];
				if (!pr) {
					return name;
				}

				return {
					...name,
					rating: pr.rating,
					wins: pr.wins,
					losses: pr.losses,
					total_ratings: pr.wins + pr.losses,
				};
			})
			.sort((a, b) => (b.rating as number) - (a.rating as number));
	}, [personalRatings, currentTournamentNames]);

	const topThree = rankings.slice(0, 3);
	const totalContenders = rankings.length;
	const champion = topThree[0];

	const handleCopyResults = async () => {
		if (!rankings.length) {
			return;
		}
		const lines = [
			"🐾 Name Nosferatu Tournament Results 🐾",
			"=====================================",
			...rankings.map((cat, idx) => {
				const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
				return `${medal} ${cat.name} — Rating: ${Math.round(cat.rating as number)}`;
			}),
			"=====================================",
			"Play and vote: Name Nosferatu Cat Tournaments",
		];
		try {
			await navigator.clipboard.writeText(lines.join("\n"));
			setHasCopied(true);
			setTimeout(() => setHasCopied(false), 2500);
		} catch (err) {
			ErrorManager.handleError(err, "PersonalResults.handleCopyResults");
		}
	};

	const handleSave = async (updatedRankings: NameItem[]) => {
		const numRankings = updatedRankings.length;
		if (numRankings === 0) {
			return;
		}

		const newRatings: Record<string, RatingData> = { ...personalRatings };

		let maxRating = -Infinity;
		let minRating = Infinity;
		for (let i = 0; i < numRankings; i++) {
			const item = updatedRankings[i];
			const rating = item?.rating;
			if (typeof rating === "number") {
				if (rating > maxRating) {
					maxRating = rating;
				}
				if (rating < minRating) {
					minRating = rating;
				}
			}
		}

		if (maxRating === -Infinity || minRating === Infinity || maxRating === minRating) {
			maxRating = 2000;
			minRating = 1000;
		}

		const ratingRange = maxRating - minRating;

		for (let i = 0; i < numRankings; i++) {
			const item = updatedRankings[i];
			if (!item) {
				continue;
			}

			const normalizedPosition = 1 - i / (numRankings - 1 || 1);
			const newRating = minRating + ratingRange * normalizedPosition;

			if (newRatings[item.name]) {
				const existing = newRatings[item.name];
				newRatings[item.name] = { ...existing, rating: Math.round(newRating) };
			} else {
				newRatings[item.name] = {
					rating: Math.round(newRating),
					wins: 0,
					losses: 0,
				};
			}
		}

		onUpdateRatings(newRatings);
	};

	if (!rankings.length) {
		return (
			<div className="flex h-32 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
				No personal ratings yet.
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Podium Banner Showcase */}
			{champion && (
				<div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 via-card/70 to-card/90 p-5 sm:p-6 backdrop-blur-xl shadow-lg">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
						<div>
							<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-chart-4/15 text-chart-4 text-xs font-bold uppercase tracking-wider mb-1.5">
								<Crown size={14} />
								<span>Tournament Champion</span>
							</div>
							<h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
								{champion.name}
							</h3>
						</div>

						<div className="flex items-center gap-2 w-full sm:w-auto">
							<Button
								variant="outline"
								size="small"
								onClick={handleCopyResults}
								className="flex-1 sm:flex-none gap-1.5 text-xs font-semibold"
							>
								{hasCopied ? (
									<>
										<Check size={14} className="text-chart-2" />
										<span className="text-chart-2">Copied!</span>
									</>
								) : (
									<>
										<Copy size={14} />
										<span>Share Results</span>
									</>
								)}
							</Button>
							<Button
								variant="primary"
								size="small"
								onClick={() => setShowReorder((prev) => !prev)}
								className="flex-1 sm:flex-none text-xs font-semibold"
							>
								{showReorder ? "Close Reorder" : "Fine-Tune Ranks"}
							</Button>
						</div>
					</div>

					{/* Top 3 Podium Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
						{topThree.map((cat, idx) => {
							const medal =
								idx === 0 ? "🥇 1st Place" : idx === 1 ? "🥈 2nd Place" : "🥉 3rd Place";
							const borderTone =
								idx === 0
									? "border-yellow-500/50 bg-yellow-500/10"
									: idx === 1
										? "border-slate-400/40 bg-slate-400/10"
										: "border-amber-700/40 bg-amber-700/10";

							return (
								<div
									key={cat.id || cat.name}
									className={cn(
										"flex flex-col justify-between p-4 rounded-xl border transition-all",
										borderTone,
									)}
								>
									<div className="flex items-center justify-between gap-2 mb-2">
										<span className="text-xs font-bold uppercase tracking-wider text-foreground">
											{medal}
										</span>
										<span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-extrabold tabular-nums">
											{Math.round(cat.rating as number)}
										</span>
									</div>
									<p className="text-base font-extrabold text-foreground truncate">{cat.name}</p>
									{cat.wins !== undefined && cat.losses !== undefined && (
										<p className="text-xs text-muted-foreground mt-1">
											Record: <span className="text-accent font-semibold">{cat.wins}W</span> -{" "}
											<span className="text-destructive/80 font-semibold">{cat.losses}L</span>
										</p>
									)}
								</div>
							);
						})}
					</div>

					{/* Quick stats footer */}
					<div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
						<span className="font-medium">Total Bracket Contenders: {totalContenders}</span>
						<span className="font-medium text-primary">Rankings Synced</span>
					</div>
				</div>
			)}

			{/* Drag and drop or accessible rank adjustment */}
			{showReorder && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
				>
					<RankingAdjustment rankings={rankings} onSave={handleSave} onCancel={onStartNew} />
				</motion.div>
			)}
		</div>
	);
};
