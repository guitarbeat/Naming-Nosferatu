import { LayoutDashboard, Shield } from "lucide-react";
import { useState } from "react";
import { MagicToggle } from "@/shared/components/ui/MagicToggle";
import type { NameItem, RatingData } from "@/shared/types";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { Dashboard as AnalyticsDashboard } from "./components/analytics/Dashboard";

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
	const [activeView, setActiveView] = useState<"analytics" | "moderation">("analytics");

	return (
		<div className="w-full space-y-6">
			{props.isAdmin && (
				<div className="flex items-center justify-center pb-2">
					<MagicToggle
						options={[
							{ value: "analytics", label: "Analytics", icon: <LayoutDashboard size={16} /> },
							{ value: "moderation", label: "Moderation", icon: <Shield size={16} /> },
						]}
						value={activeView}
						onChange={(v) => setActiveView(v as "analytics" | "moderation")}
						ariaLabel="Select Dashboard View"
					/>
				</div>
			)}

			{activeView === "analytics" || !props.isAdmin ? (
				<AnalyticsDashboard {...props} />
			) : (
				<AdminDashboard />
			)}
		</div>
	);
}
