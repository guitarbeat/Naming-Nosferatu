import { useState } from "react";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { Dashboard as AnalyticsDashboard } from "./components/analytics/Dashboard";
import type { RatingData, NameItem } from "@/shared/types";
import { LayoutDashboard, Shield } from "lucide-react";
import Button from "@/shared/components/layout/Button";

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
				<div className="flex items-center gap-4 border-b border-border pb-4">
					<Button
						variant={activeView === "analytics" ? "default" : "ghost"}
						onClick={() => setActiveView("analytics")}
						className="gap-2"
					>
						<LayoutDashboard size={18} />
						Analytics
					</Button>
					<Button
						variant={activeView === "moderation" ? "default" : "ghost"}
						onClick={() => setActiveView("moderation")}
						className="gap-2"
					>
						<Shield size={18} />
						Moderation
					</Button>
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
