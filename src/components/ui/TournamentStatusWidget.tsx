import { RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/UiPrimitives";

export interface TournamentStatusWidgetProps {
	namesCount: number;
	onRestart: () => void;
}

export function TournamentStatusWidget({ namesCount, onRestart }: TournamentStatusWidgetProps) {
	return (
		<div className="mx-auto mb-6 flex w-full max-w-4xl flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/85 p-3.5 sm:p-4 shadow-sm backdrop-blur-md">
			<div className="flex items-center gap-3 text-left w-full sm:w-auto">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
					<Trophy size={18} />
				</div>
				<div>
					<h4 className="text-sm font-semibold text-foreground">Tournament in Progress</h4>
					<p className="text-xs text-muted-foreground font-mono tabular-nums">
						{namesCount} contenders seeded
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
				<Button
					variant="ghost"
					size="small"
					onClick={onRestart}
					aria-label="Restart Tournament"
					className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5"
				>
					<RotateCcw size={13} />
					Restart Tournament
				</Button>
			</div>
		</div>
	);
}
