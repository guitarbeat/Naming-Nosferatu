import type React from "react";
import { devError } from "../../../shared/utils";
import type { NameWithInsight, SummaryStats } from "../types";
import styles from "../analytics.module.css";

interface AnalysisInsightsProps {
	namesWithInsights: NameWithInsight[];
	summaryStats: SummaryStats | null;
	generalInsights: Array<{ type: string; message: string; icon: string }>;
	isAdmin: boolean;
	canHideNames: boolean;
	onHideName: (id: string | number, name: string) => Promise<void>;
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
		if (!summaryStats) {
			return null;
		}

		if (isAdmin) {
			return (
				<div className={styles.statsSummary}>
					<div className={styles.statCard}>
						<div className={styles.statLabel}>Total Names</div>
						<div className={styles.statValue}>{summaryStats.totalNames || 0}</div>
						<div className={styles.statSubtext}>{summaryStats.activeNames || 0} active</div>
					</div>
					<div className={styles.statCard}>
						<div className={styles.statLabel}>Avg Rating</div>
						<div className={styles.statValue}>{summaryStats.avgRating}</div>
						<div className={styles.statSubtext}>Global Average</div>
					</div>
					<div className={styles.statCard}>
						<div className={styles.statLabel}>Total Votes</div>
						<div className={styles.statValue}>{summaryStats.totalRatings || 0}</div>
						<div className={styles.statSubtext}>
							{summaryStats.totalSelections || 0} selections
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className={styles.statsSummary}>
				<div className={styles.statCard}>
					<div className={styles.statLabel}>Top Rating</div>
					<div className={styles.statValue}>{summaryStats.maxRating ?? 0}</div>
					<div className={styles.statName}>{summaryStats.topName?.name}</div>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statLabel}>Avg Rating</div>
					<div className={styles.statValue}>{summaryStats.avgRating}</div>
					<div className={styles.statSubtext}>Across {namesWithInsights.length} names</div>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statLabel}>Total Selected</div>
					<div className={styles.statValue}>{summaryStats.totalSelected ?? 0}</div>
					<div className={styles.statSubtext}>
						{(summaryStats.maxSelected ?? 0) > 0
							? `Most: ${summaryStats.maxSelected}x`
							: "No selections yet"}
					</div>
				</div>
			</div>
		);
	};

	const renderGeneralInsights = () => {
		if (generalInsights.length === 0 || isAdmin) {
			return null;
		}
		return (
			<div className={styles.insights}>
				{generalInsights.map((insight, idx) => (
					<div key={idx} className={`${styles.insight} ${styles[insight.type] || styles.info}`}>
						<span className={styles.insightIcon} aria-hidden="true">
							{insight.icon}
						</span>
						<span className={styles.insightText}>{insight.message}</span>
					</div>
				))}
			</div>
		);
	};

	const renderActionableInsights = () => {
		const highPriorityTags = ["worst_rated", "never_selected", "inactive", "poor_performer"];
		const lowPerformers = namesWithInsights.filter((n) =>
			n.insights.some((i: string) => highPriorityTags.includes(i)),
		);

		if (lowPerformers.length === 0) {
			return null;
		}

		return (
			<div className={styles.insightsSection}>
				<h3 className={styles.sectionTitle}>⚠️ Names to Consider Hiding</h3>
				<div className={styles.insightCards}>
					{lowPerformers
						.sort((a, b) => {
							const priority: Record<string, number> = {
								inactive: 0,
								never_selected: 1,
								worst_rated: 2,
								poor_performer: 3,
							};
							const getP = (item: NameWithInsight) =>
								Math.min(
									...item.insights
										.filter((i: string) => highPriorityTags.includes(i))
										.map((i: string) => priority[i] ?? 99),
								);
							const pA = getP(a);
							const pB = getP(b);
							if (pA !== pB) {
								return pA - pB;
							}
							return a.rating - b.rating;
						})
						.slice(0, 12)
						.map((n) => (
							<div key={n.id} className={`${styles.insightCard} ${styles.warning}`}>
								<div className={styles.cardHeader}>
									<div className={styles.cardName}>{n.name}</div>
									{canHideNames && (
										<button
											type="button"
											className={styles.cardHideBtn}
											onClick={async (e) => {
												e.preventDefault();
												e.stopPropagation();
												try {
													await onHideName(n.id, n.name);
												} catch (error) {
													devError("[AnalysisDashboard] Failed to hide name:", error);
												}
											}}
											aria-label={`Hide ${n.name}`}
											title="Hide this name"
										>
											Hide
										</button>
									)}
								</div>
								<div className={styles.cardMetrics}>
									<span>Rating {Math.round(n.rating)}</span>
									<span>{n.selected} selected</span>
									{n.wins > 0 && <span>{n.wins} wins</span>}
								</div>
								<div className={styles.cardTags}>
									{n.insights
										.filter((i: string) => highPriorityTags.includes(i))
										.map((tag: string) => (
											<span key={tag} className={`${styles.tag} ${styles.warning}`}>
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
		const positiveTags = ["top_rated", "most_selected", "underrated", "undefeated"];
		const topPerformers = namesWithInsights.filter((n) =>
			n.insights.some((i: string) => positiveTags.includes(i)),
		);

		if (topPerformers.length === 0) {
			return null;
		}

		return (
			<div className={styles.insightsSection}>
				<h3 className={styles.sectionTitle}>✨ Top Performers (Keep)</h3>
				<div className={styles.insightCards}>
					{topPerformers.slice(0, 6).map((n) => (
						<div key={n.id} className={styles.insightCard}>
							<div className={styles.cardName}>{n.name}</div>
							<div className={styles.cardMetrics}>
								<span>Rating {Math.round(n.rating)}</span>
								<span>{n.selected} selected</span>
							</div>
							<div className={styles.cardTags}>
								{n.insights
									.filter((i: string) => positiveTags.includes(i))
									.map((tag: string) => (
										<span key={tag} className={styles.tag}>
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
		<div className={styles.insightsPanel}>
			{renderStatsSummary()}
			{renderGeneralInsights()}
			{renderActionableInsights()}
			{renderPositiveInsights()}
		</div>
	);
};
