/**
 * @module Dashboard
 * @description Unified dashboard that shows both personal tournament results and global analytics.
 * Replaces separate Results and Analysis views with a single, comprehensive interface.
 */

import React, { useMemo } from "react";
import { TabContainer } from "../../shared/components/TabContainer";
import { Toast } from "../../shared/components/Toast";
import { useToast } from "../../shared/hooks/useAppHooks";
import type { NameItem } from "../../types/components";
import { AnalysisDashboard } from "../analytics/components/AnalysisDashboard";
import PersonalResults from "./components/PersonalResults";

interface DashboardProps {
	personalRatings?: Record<string, unknown>;
	currentTournamentNames?: NameItem[];
	voteHistory?: unknown[];
	onStartNew: () => void;
	onUpdateRatings?: (ratings: unknown) => void;
	userName: string;
	mode?: "personal" | "global" | "both";
}

function Dashboard({
	personalRatings,
	currentTournamentNames,
	voteHistory,
	onStartNew,
	onUpdateRatings,
	userName,
	mode = "both",
}: DashboardProps) {
	const { toasts, removeToast } = useToast({
		maxToasts: 1,
		defaultDuration: 3000,
	});

	// Check if user has personal tournament data
	const hasPersonalData = personalRatings && Object.keys(personalRatings).length > 0;

	const tabs = useMemo(() => {
		const availableTabs = [];

		// Add personal results tab if in both mode and has data, or if forced to personal mode
		if ((mode === "both" && hasPersonalData) || mode === "personal") {
			availableTabs.push({
				key: "personal",
				label: "My Results",
				icon: <>🏆</>,
				content: (
					<PersonalResults
						personalRatings={(personalRatings as any) || {}}
						currentTournamentNames={currentTournamentNames || []}
						voteHistory={(voteHistory as any) || []}
						onStartNew={onStartNew}
						onUpdateRatings={onUpdateRatings as any}
						userName={userName}
					/>
				),
				disabled: mode === "personal" ? false : !hasPersonalData,
			});
		}

		// Add global leaderboard tab if in both mode, or if forced to global mode
		if (mode === "both" || mode === "global") {
			availableTabs.push({
				key: "global",
				label: "Global Leaderboard",
				icon: <>🌍</>,
				content: (
					<AnalysisDashboard
						userName={userName}
						showGlobalLeaderboard={true}
						defaultCollapsed={false}
					/>
				),
			});
		}

		return availableTabs;
	}, [mode, hasPersonalData, personalRatings, currentTournamentNames, voteHistory, onStartNew, onUpdateRatings, userName]);

	// Determine default tab based on mode and data availability
	const defaultActiveTab = useMemo(() => {
		if (mode === "personal") return "personal";
		if (mode === "global") return "global";
		// For "both" mode, default to personal if data exists
		return hasPersonalData ? "personal" : "global";
	}, [mode, hasPersonalData]);

	return (
		<>
			<TabContainer
				tabs={tabs}
				defaultActiveTab={defaultActiveTab}
				title={(activeTab) => {
					if (mode !== "both") {
						return activeTab === "personal" ? "My Tournament Results" : "Global Leaderboard";
					}
					return activeTab === "personal" ? "My Tournament Results" : "Global Leaderboard";
				}}
				subtitle={
					<>
						Welcome back, <span style={{ fontWeight: "600" }}>{userName}</span>!
					</>
				}
			/>

			<Toast
				variant="container"
				toasts={toasts}
				removeToast={removeToast}
				position="bottom-right"
				maxToasts={1}
				message=""
				onDismiss={() => {
					// Intentional no-op: dismiss handled by component
				}}
			/>
		</>
	);
}

Dashboard.displayName = "Dashboard";


export default React.memo(Dashboard);
