import { BarChart3, Settings } from "lucide-react";
import { useState } from "react";
import { MagicToggle } from "@/components/ui/MagicToggle";
import { AdminDashboard } from "./components/AdminDashboard";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import type { DashboardProps } from "./types";

export type DashboardView = "analytics" | "admin";

const DASHBOARD_VIEW_OPTIONS = [
	{
		value: "analytics" as const,
		label: "Analytics",
		icon: <BarChart3 className="h-4 w-4" />,
	},
	{
		value: "admin" as const,
		label: "Admin",
		icon: <Settings className="h-4 w-4" />,
	},
];

export interface UnifiedDashboardProps extends DashboardProps {
	isAdmin?: boolean;
}

export function Dashboard(props: UnifiedDashboardProps) {
	const [activeView, setActiveView] = useState<DashboardView>("analytics");

	if (!props.isAdmin) {
		return (
			<div className="w-full space-y-6">
				<AnalyticsDashboard {...props} />
			</div>
		);
	}

	return (
		<div className="w-full space-y-6">
			<div className="flex items-center gap-4 border-b border-border pb-4">
				<MagicToggle<DashboardView>
					options={DASHBOARD_VIEW_OPTIONS}
					value={activeView}
					onChange={(val: DashboardView) => setActiveView(val)}
					ariaLabel="Dashboard view options"
				/>
			</div>

			{activeView === "analytics" ? <AnalyticsDashboard {...props} /> : <AdminDashboard />}
		</div>
	);
}
