import { BarChart3, Eye, EyeOff, Lock } from "@/shared/lib/icons";

interface AdminStatsGridProps {
	stats: {
		totalNames: number;
		activeNames: number;
		hiddenNames: number;
		lockedInNames: number;
	};
}

export function AdminStatsGrid({ stats }: AdminStatsGridProps) {
	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
			<div className="p-3 sm:p-6">
				<div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
					<BarChart3 className="text-primary" size={18} />
					<h3 className="text-sm sm:text-lg font-semibold text-primary">Total</h3>
				</div>
				<p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalNames}</p>
			</div>

			<div className="p-3 sm:p-6">
				<div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
					<Eye className="text-chart-2" size={18} />
					<h3 className="text-sm sm:text-lg font-semibold text-chart-2">Active</h3>
				</div>
				<p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.activeNames}</p>
			</div>

			<div className="p-3 sm:p-6">
				<div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
					<Lock className="text-chart-4" size={18} />
					<h3 className="text-sm sm:text-lg font-semibold text-chart-4">Locked</h3>
				</div>
				<p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.lockedInNames}</p>
			</div>

			<div className="p-3 sm:p-6">
				<div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
					<EyeOff className="text-destructive" size={18} />
					<h3 className="text-sm sm:text-lg font-semibold text-destructive">Hidden</h3>
				</div>
				<p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.hiddenNames}</p>
			</div>
		</div>
	);
}
