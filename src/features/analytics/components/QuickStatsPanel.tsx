import type { ElementType } from "react";
import { BarChart3 } from "lucide-react";
import { Panel, SectionHeader, StatTile } from "./DashboardPrimitives";

export interface QuickStat {
	accent?: boolean;
	icon: ElementType;
	label: string;
	value: string | number;
}

interface QuickStatsPanelProps {
	quickStats: QuickStat[];
	isUserSnapshot: boolean;
}

export function QuickStatsPanel({ quickStats, isUserSnapshot }: QuickStatsPanelProps) {
	if (quickStats.length === 0) {
		return null;
	}

	return (
		<Panel>
			<SectionHeader
				icon={BarChart3}
				title={isUserSnapshot ? "Your Snapshot" : "Community Snapshot"}
				subtitle={isUserSnapshot ? "Your totals." : "Pool totals."}
			/>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{quickStats.map((item) => (
					<StatTile
						key={item.label}
						label={item.label}
						value={item.value}
						icon={item.icon}
						accent={Boolean(item.accent)}
					/>
				))}
			</div>
		</Panel>
	);
}
