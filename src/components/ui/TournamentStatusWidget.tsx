import { RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/LayoutBlocks";

interface TournamentStatusWidgetProps {
	namesCount: number;
	onRestart: () => void;
}

export function TournamentStatusWidget({ namesCount, onRestart }: TournamentStatusWidgetProps) {
	return (
		<div className="mx-auto mb-6 flex w-full max-w-4xl flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/80 p-3.5 sm:p-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 group cursor-default">
			<div className="flex items-center gap-3 text-left w-full sm:w-auto">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:scale-110 group-hover:bg-primary/25 transition-transform duration-300">
					<Trophy size={18} />
				</div>
				<div>
					<h4 className="text-sm font-semibold text-foreground">Tournament in Progress</h4>
					<p className="text-xs text-muted-foreground">{namesCount} contenders seeded</p>
				</div>
			</div>
			<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
				<Button
					variant="ghost"
					size="small"
					onClick={onRestart}
					className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5"
				>
					<RotateCcw
						size={13}
						className="group-hover/btn:-rotate-90 transition-transform duration-500"
					/>
					Restart Tournament
				</Button>
			</div>
		</div>
	);
}
