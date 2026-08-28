import { BarChart3, Eye, EyeOff, Lock } from "lucide-react";
import type { AdminStatsGridProps } from "../types";

export function AdminStatsGrid({ stats }: AdminStatsGridProps) {
	const statCards = [
		{
			icon: BarChart3,
			accentColor: "text-primary",
			bgColor: "bg-primary/10",
			borderColor: "border-primary/20",
			label: "Total Pool",
			value: stats.totalNames,
		},
		{
			icon: Eye,
			accentColor: "text-accent",
			bgColor: "bg-accent/10",
			borderColor: "border-accent/20",
			label: "Active In Pool",
			value: stats.activeNames,
		},
		{
			icon: Lock,
			accentColor: "text-amber-400",
			bgColor: "bg-amber-400/10",
			borderColor: "border-amber-400/20",
			label: "Locked In",
			value: stats.lockedInNames,
		},
		{
			icon: EyeOff,
			accentColor: "text-destructive",
			bgColor: "bg-destructive/10",
			borderColor: "border-destructive/20",
			label: "Hidden From Public",
			value: stats.hiddenNames,
		},
	];

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
			{statCards.map(({ icon: Icon, accentColor, bgColor, borderColor, label, value }) => (
				<div
					key={label}
					className={`group relative overflow-hidden rounded-2xl border ${borderColor} bg-card/70 p-4 sm:p-5 shadow-sm backdrop-blur-sm transition-all hover:border-border hover:shadow-md`}
				>
					<div className="flex items-center justify-between gap-2 mb-2">
						<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							{label}
						</span>
						<div
							className={`flex size-8 items-center justify-center rounded-lg ${bgColor} ${accentColor}`}
						>
							<Icon size={16} />
						</div>
					</div>
					<p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
						{value}
					</p>
				</div>
			))}
		</div>
	);
}
