import type { ElementType } from "react";
import { useToast } from "@/app/providers/Providers";
import Button from "@/shared/components/layout/Button";
import { BarChart3, Plus, Trophy } from "@/shared/lib/icons";
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

function HighlightCard({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: string | number;
	icon: ElementType;
}) {
	return (
		<div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
						{label}
					</p>
					<p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
				</div>
				<div className="rounded-2xl border border-primary/20 bg-primary/12 p-2.5 text-primary">
					<Icon size={16} />
				</div>
			</div>
		</div>
	);
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
			<div className="grid gap-3 sm:grid-cols-3">
				<HighlightCard label="Champion" value={rankings[0]?.name || "—"} icon={Trophy} />
				<HighlightCard label="Top rating" value={String(rankings[0]?.rating || 1500)} icon={BarChart3} />
				<HighlightCard label="Ranked names" value={rankings.length} icon={Trophy} />
			</div>

			<div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-4 sm:p-5">
				<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div className="space-y-2">
						<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/65">
							Adjustment table
						</p>
						<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/75">
							Reorder your results if you want a final manual pass before saving the bracket back to your profile.
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
