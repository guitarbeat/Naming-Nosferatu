import type React from "react";
import type { NameWithInsight, SummaryStats } from "../types";

interface AnalysisInsightsProps {
	namesWithInsights: NameWithInsight[];
	summaryStats: SummaryStats | null;
	generalInsights: Array<{ type: string; message: string; icon: string }>;
	isAdmin: boolean;
	canHideNames: boolean;
	onHideName: (id: string, name: string) => Promise<void>;
}

export const AnalysisInsights: React.FC<AnalysisInsightsProps> = ({
	namesWithInsights,
	summaryStats,
	generalInsights,
	isAdmin,
	canHideNames,
	onHideName,
}) => {
	const renderStatsSummary = () => {
		if (!summaryStats) return null;

		if (isAdmin) {
			return (
				<div className="analysis-stats-summary analysis-stats-summary--admin">
					<div className="analysis-stat-card">
						<div className="analysis-stat-label">Total Names</div>
						<div className="analysis-stat-value">
							{summaryStats.totalNames || 0}
						</div>
						<div className="analysis-stat-subtext">
							{summaryStats.activeNames || 0} active
						</div>
					</div>
					<div className="analysis-stat-card">
						<div className="analysis-stat-label">Avg Rating</div>
						<div className="analysis-stat-value">{summaryStats.avgRating}</div>
						<div className="analysis-stat-subtext">Global Average</div>
					</div>
					<div className="analysis-stat-card">
						<div className="analysis-stat-label">Total Votes</div>
						<div className="analysis-stat-value">
							{summaryStats.totalRatings || 0}
						</div>
						<div className="analysis-stat-subtext">
							{summaryStats.totalSelections || 0} selections
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className="analysis-stats-summary">
				<div className="analysis-stat-card">
					<div className="analysis-stat-label">Top Rating</div>
					<div className="analysis-stat-value">
						{summaryStats.maxRating ?? 0}
					</div>
					<div className="analysis-stat-name">{summaryStats.topName?.name}</div>
				</div>
				<div className="analysis-stat-card">
					<div className="analysis-stat-label">Avg Rating</div>
					<div className="analysis-stat-value">{summaryStats.avgRating}</div>
					<div className="analysis-stat-subtext">
						Across {namesWithInsights.length} names
					</div>
				</div>
				<div className="analysis-stat-card">
					<div className="analysis-stat-label">Total Selected</div>
					<div className="analysis-stat-value">
						{summaryStats.totalSelected ?? 0}
					</div>
					<div className="analysis-stat-subtext">
						{(summaryStats.maxSelected ?? 0) > 0
							? `Most: ${summaryStats.maxSelected}x`
							: "No selections yet"}
					</div>
				</div>
			</div>
		);
	};

	const renderGeneralInsights = () => {
		if (generalInsights.length === 0 || isAdmin) return null;
		return (
			<div className="analysis-insights">
				{generalInsights.map((insight, idx) => (
					<div
						key={idx}
						className={`analysis-insight analysis-insight--${insight.type}`}
					>
						<span className="analysis-insight-icon" aria-hidden="true">
							{insight.icon}
						</span>
						<span className="analysis-insight-text">{insight.message}</span>
					</div>
				))}
			</div>
		);
	};

	const renderActionableInsights = () => {
		const highPriorityTags = [
			"worst_rated",
			"never_selected",
			"inactive",
			"poor_performer",
		];
		const lowPerformers = namesWithInsights.filter((n) =>
			n.insights.some((i: string) => highPriorityTags.includes(i)),
		);

		if (lowPerformers.length === 0) return null;

		return (
			<div className="analysis-insights-section">
				<h3 className="analysis-insights-section-title">
					⚠️ Names to Consider Hiding
				</h3>
				<div className="analysis-insight-cards">
					{lowPerformers
						.sort((a, b) => {
							const priority: Record<string, number> = {
								inactive: 0,
								never_selected: 1,
								worst_rated: 2,
								poor_performer: 3,
							};
							const aPriority = Math.min(
								...a.insights
									.filter((i: string) => highPriorityTags.includes(i))
									.map((i: string) => priority[i] ?? 99),
							);
							const bPriority = Math.min(
								...b.insights
									.filter((i: string) => highPriorityTags.includes(i))
									.map((i: string) => priority[i] ?? 99),
							);
							if (aPriority !== bPriority) return aPriority - bPriority;
							return a.rating - b.rating;
						})
						.slice(0, 12)
						.map((n) => (
							<div
								key={n.id}
								className="analysis-insight-card analysis-insight-card--warning"
							>
								<div className="analysis-insight-card-header">
									<div className="analysis-insight-card-name">{n.name}</div>
									{canHideNames && (
										<button
											type="button"
											className="analysis-insight-card-hide"
											onClick={async (e) => {
												e.preventDefault();
												e.stopPropagation();
												try {
													await onHideName(n.id, n.name);
												} catch (error) {
													devError(
														"[AnalysisDashboard] Failed to hide name:",
														error,
													);
												}
											}}
											aria-label={`Hide ${n.name}`}
											title="Hide this name"
										>
											Hide
										</button>
									)}
								</div>
								<div className="analysis-insight-card-metrics">
									<span>Rating {Math.round(n.rating)}</span>
									<span>{n.selected} selected</span>
									{n.wins > 0 && <span>{n.wins} wins</span>}
								</div>
								<div className="analysis-insight-card-tags">
									{n.insights
										.filter((i: string) => highPriorityTags.includes(i))
										.map((tag: string) => (
											<span
												key={tag}
												className="analysis-insight-tag analysis-insight-tag--warning"
											>
												{tag.replace("_", " ")}
											</span>
										))}
								</div>
							</div>
						))}
				</div>
			</div>
		);
	};

	const renderPositiveInsights = () => {
		const positiveTags = [
			"top_rated",
			"most_selected",
			"underrated",
			"undefeated",
		];
		const topPerformers = namesWithInsights.filter((n) =>
			n.insights.some((i: string) => positiveTags.includes(i)),
		);

		if (topPerformers.length === 0) return null;

		return (
			<div className="analysis-insights-section">
				<h3 className="analysis-insights-section-title">
					✨ Top Performers (Keep)
				</h3>
				<div className="analysis-insight-cards">
					{topPerformers.slice(0, 6).map((n) => (
						<div key={n.id} className="analysis-insight-card">
							<div className="analysis-insight-card-name">{n.name}</div>
							<div className="analysis-insight-card-metrics">
								<span>Rating {Math.round(n.rating)}</span>
								<span>{n.selected} selected</span>
							</div>
							<div className="analysis-insight-card-tags">
								{n.insights
									.filter((i: string) => positiveTags.includes(i))
									.map((tag: string) => (
										<span key={tag} className="analysis-insight-tag">
											{tag.replace("_", " ")}
										</span>
									))}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="analysis-insights-panel">
			{renderStatsSummary()}
			{renderGeneralInsights()}
			{renderActionableInsights()}
			{renderPositiveInsights()}
		</div>
	);
};
