import { LayoutDashboard, Shield } from "lucide-react";
import { type ReactNode, useState } from "react";
import { MagicToggle } from "@/shared/components/ui/MagicToggle";
import type { NameItem, RatingData } from "@/shared/types";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { Dashboard as AnalyticsDashboard } from "./components/analytics/Dashboard";

type DashboardView = "analytics" | "moderation";

const DASHBOARD_VIEW_OPTIONS = [
	{ value: "analytics", label: "Analytics", icon: <LayoutDashboard size={18} /> },
	{ value: "moderation", label: "Moderation", icon: <Shield size={18} /> },
] as const satisfies readonly { value: DashboardView; label: string; icon: ReactNode }[];

interface UnifiedDashboardProps {
	personalRatings?: Record<string, RatingData>;
	currentTournamentNames?: NameItem[];
	onStartNew?: () => void;
	onUpdateRatings?: (
		ratings:
			| Record<string, RatingData>
			| ((prev: Record<string, RatingData>) => Record<string, RatingData>),
	) => void;
	userName?: string;
	isAdmin?: boolean;
	isLoggedIn?: boolean;
	avatarUrl?: string;
	canHideNames?: boolean;
	onNameHidden?: (nameId: string) => void;
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
				<MagicToggle
					options={DASHBOARD_VIEW_OPTIONS}
					value={activeView}
					onChange={setActiveView}
					ariaLabel="Dashboard view"
				/>
			</div>

			{activeView === "analytics" ? (
				<AnalyticsDashboard {...props} />
			) : (
				<AdminDashboard />
			)}
		</div>
	);
}
