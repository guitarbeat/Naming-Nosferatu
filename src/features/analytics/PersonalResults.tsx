import { Plus } from "lucide-react";
import { useToast } from "@/app/providers/Providers";
import Button from "@/shared/components/layout/Button";
import type { NameItem, RatingData } from "@/shared/types";
import { usePersonalResults } from "./hooks/usePersonalResults";
import { RankingAdjustment } from "./RankingAdjustment";

interface PersonalResultsProps {
	personalRatings: Record<string, RatingData> | undefined;
	currentTournamentNames?: NameItem[];
	onStartNew: () => void;
	onUpdateRatings: (
		ratings:
			| Record<string, RatingData>
			| ((prev: Record<string, RatingData>) => Record<string, RatingData>),
	) => void;
	userName?: string;
}

export const PersonalResults = ({
	personalRatings,
	currentTournamentNames,
	onStartNew,
	onUpdateRatings,
}: PersonalResultsProps) => {
	const { rankings } = usePersonalResults({
		personalRatings,
		currentTournamentNames,
	});
	const { showToast } = useToast();

	return (
		<div className="space-y-6">
			<div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-4 sm:p-5">
				<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div className="space-y-2">
						<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/65">
							Adjustment table
						</p>
						<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/75">
							Reorder your results if you want a final manual pass before saving the bracket back to
							your profile.
						</p>
						<p className="max-w-2xl text-xs leading-relaxed text-muted-foreground/60">
							This panel is your personal ordering layer. It helps you tune your saved bracket
							without reframing the broader community averages by itself.
						</p>
					</div>
					<Button variant="outline" size="small" onClick={onStartNew}>
						<Plus size={14} />
						New Tournament
					</Button>
				</div>

				<RankingAdjustment
					rankings={rankings}
					onSave={async (updatedRankings: NameItem[]) => {
						const ratingsMap = Object.fromEntries(
							updatedRankings.map((name) => [
								name.id || name.name,
								{
									rating: name.rating as number,
									wins: name.wins ?? 0,
									losses: name.losses ?? 0,
								},
							]),
						);
						await onUpdateRatings(ratingsMap);
						showToast("Updated!", "success");
					}}
					onCancel={onStartNew}
				/>
			</div>
		</div>
	);
};
