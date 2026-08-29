import { BarChart3, Settings } from "lucide-react";
import { useState } from "react";
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
				<div className="flex gap-2">
					{DASHBOARD_VIEW_OPTIONS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => setActiveView(opt.value)}
							className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
								activeView === opt.value
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:bg-muted/80"
							}`}
						>
							{opt.icon}
							{opt.label}
						</button>
					))}
				</div>
			</div>

			{activeView === "analytics" ? <AnalyticsDashboard {...props} /> : <AdminDashboard />}
		</div>
	);
}
