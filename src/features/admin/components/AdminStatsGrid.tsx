import { BarChart3, Eye, EyeOff, Lock } from "lucide-react";
import type { AdminStatsGridProps, StatCell } from "../types";

function AdminStatCell({ icon: Icon, colorClass, label, value }: StatCell) {
	return (
		<div className="p-3 sm:p-6">
			<div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
				<Icon className={colorClass} size={18} />
				<h3 className={`text-sm sm:text-lg font-semibold ${colorClass}`}>{label}</h3>
			</div>
			<p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
		</div>
	);
}

export function AdminStatsGrid({ stats }: AdminStatsGridProps) {
	const cells: StatCell[] = [
		{
			icon: BarChart3,
			colorClass: "text-primary",
			label: "Total",
			value: stats.totalNames,
		},
		{
			icon: Eye,
			colorClass: "text-chart-2",
			label: "Active",
			value: stats.activeNames,
		},
		{
			icon: Lock,
			colorClass: "text-chart-4",
			label: "Locked",
			value: stats.lockedInNames,
		},
		{
			icon: EyeOff,
			colorClass: "text-destructive",
			label: "Hidden",
			value: stats.hiddenNames,
		},
	];

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
			{cells.map((cell) => (
				<AdminStatCell key={cell.label} {...cell} />
			))}
		</div>
	);
}
