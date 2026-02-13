/**
 * @module Dashboard
 * @description Dashboard component for analytics and results
 */

import { Suspense } from "react";
import { Card } from "@/layout/Card";
import type { NameItem } from "@/types/appTypes";
import { RandomGenerator } from "../tournament/components/RandomGenerator";

interface DashboardProps {
	personalRatings?: Record<string, unknown>;
	currentTournamentNames?: NameItem[];
	onUpdateRatings?: (ratings: Record<string, unknown>) => void;
	onStartNew?: () => void;
	userName?: string;
	isAdmin?: boolean;
	canHideNames?: boolean;
	onNameHidden?: (nameId: string) => void;
}

export function Dashboard({ userName = "" }: DashboardProps) {
	return (
		<div className="dashboard-container space-y-8">
			{/* Random Name Generator */}
			<Card className="p-6">
				<Suspense fallback={<div className="p-4">Loading...</div>}>
					<RandomGenerator userName={userName} />
				</Suspense>
			</Card>

			{/* Placeholder for future analytics */}
			<Card className="p-6">
				<h3 className="text-xl font-semibold mb-4">Analytics Dashboard</h3>
				<p className="text-gray-400">
					Full analytics dashboard with rankings, charts, and insights coming soon.
				</p>
				<p className="text-sm text-gray-500 mt-2">
					Components like AnalysisComponents, PersonalResults, Charts, etc. need to be restored from
					git history (commit 495b412d or earlier).
				</p>
			</Card>
		</div>
	);
}
