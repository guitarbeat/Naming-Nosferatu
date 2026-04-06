import { Button as HeroButton } from "@heroui/react";
import { useToast } from "@/app/providers/Providers";
import { usePersonalResults } from "@/features/analytics/hooks/usePersonalResults";
import { Plus, Trophy, Star, Hash } from "@/shared/lib/icons";
import type { NameItem, RatingData } from "@/shared/types";
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
	emoji,
	label,
	value,
}: {
	emoji: string;
	label: string;
	value: string | number;
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-4 text-center">
			<span className="text-3xl select-none">{emoji}</span>
			<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
			<p className="text-lg font-bold text-foreground truncate max-w-full">{value}</p>
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
		<div className="flex flex-col gap-5 w-full">
			<div className="grid grid-cols-3 gap-3">
				<HighlightCard emoji="🏆" label="Champion" value={rankings[0]?.name || "—"} />
				<HighlightCard emoji="⭐" label="Top Rating" value={String(rankings[0]?.rating || 1500)} />
				<HighlightCard emoji="📝" label="Ranked" value={rankings.length} />
			</div>

			<RankingAdjustment
				rankings={rankings}
				onSave={async (r: NameItem[]) => {
					const ratingsMap = Object.fromEntries(
						r.map((n) => [
							n.id || n.name,
							{
								rating: n.rating as number,
								wins: n.wins ?? 0,
								losses: n.losses ?? 0,
							},
						]),
					);
					await onUpdateRatings(ratingsMap);
					showToast("Updated!", "success");
				}}
				onCancel={onStartNew}
			/>

			<div className="flex justify-end">
				<HeroButton
					onClick={onStartNew}
					variant="flat"
					className="bg-primary/15 hover:bg-primary/25 text-foreground text-sm"
					startContent={<Plus size={16} />}
				>
					New Tournament
				</HeroButton>
			</div>
		</div>
	);
};
