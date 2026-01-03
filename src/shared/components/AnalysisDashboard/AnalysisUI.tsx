/**
 * @module AnalysisUI
 * @description Consolidated UI components for the Analysis Dashboard.
 * Includes AnalysisPanel, AnalysisInsights, AnalysisTable, and ColumnHeader.
 */

import type React from "react";
import {
	devError,
	formatDate,
	getMetricLabel,
	getRankDisplay,
} from "../../../utils/core";
import { CollapsibleHeader } from "../Header/CollapsibleHeader";
import { PerformanceBadges } from "../PerformanceBadge/PerformanceBadge";
import type { ConsolidatedName } from "./AnalysisDashboard";
import styles from "./AnalysisUI.module.css";
// Import types
import type { NameWithInsight, SummaryStats } from "./types";

/* ========================================= */
/*             COLUMN HEADER                 */
/* ========================================= */

interface ColumnHeaderProps {
	label: string;
	metricName?: string;
	sortable?: boolean;
	sorted?: boolean;
	sortDirection?: "asc" | "desc";
	onSort?: (field: string, direction: "asc" | "desc") => void;
	className?: string;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
	label,
	metricName,
	sortable = true,
	sorted = false,
	sortDirection = "desc",
	onSort,
	className = "",
}) => {
	const handleSort = () => {
		if (!sortable || !onSort || !metricName) return;
		const newDirection = sorted && sortDirection === "desc" ? "asc" : "desc";
		onSort(metricName, newDirection);
	};

	const headerClass = [
		styles.columnHeaderButton,
		sorted ? styles.sorted : "",
		className,
	]
		.filter(Boolean)
		.join(" ");

	const content = (
		<div className={styles.columnHeaderLabel}>
			<span className={styles.columnHeaderText}>{label}</span>
			{sortable && sorted && (
				<span className={styles.columnHeaderSortIndicator} aria-hidden="true">
					{sortDirection === "desc" ? "▼" : "▲"}
				</span>
			)}
			{metricName && (
				// Simple info icon - popover logic omitted for brevity in consolidation,
				// avoiding complex state logic here. Can re-add MetricExplainer if crucial.
				<span
					title={`Metric: ${metricName}`}
					style={{
						marginLeft: "4px",
						opacity: 0.7,
						fontSize: "0.8em",
						cursor: "help",
					}}
				>
					ⓘ
				</span>
			)}
		</div>
	);

	if (!sortable) {
		return (
			<div className={`${styles.columnHeader} ${className}`}>
				<div className={styles.columnHeaderLabel}>
					<span className={styles.columnHeaderText}>{label}</span>
				</div>
			</div>
		);
	}

	return (
		<button
			className={headerClass}
			onClick={handleSort}
			aria-sort={
				sorted ? (sortDirection === "asc" ? "ascending" : "descending") : "none"
			}
			type="button"
		>
			{content}
		</button>
	);
};

/* ========================================= */
/*             ANALYSIS PANEL                */
/* ========================================= */

interface AnalysisPanelProps {
	children: React.ReactNode;
	title?: string;
	actions?: React.ReactNode;
	showHeader?: boolean;
	toolbar?: React.ReactNode;
	className?: string;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
	children,
	title,
	actions,
	showHeader = true,
	toolbar,
	className = "",
}) => {
	return (
		<div className={`${styles.insightsPanel} ${className}`}>
			{showHeader && (
				<CollapsibleHeader
					title={title || ""}
					actions={actions}
					variant="compact"
				/>
			)}
			{toolbar && <div className={styles.viewToggle}>{toolbar}</div>}
			{children}
		</div>
	);
};

/* ========================================= */
/*           ANALYSIS INSIGHTS               */
/* ========================================= */

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
				<div className={styles.statsSummary}>
					<div className={styles.statCard}>
						<div className={styles.statLabel}>Total Names</div>
						<div className={styles.statValue}>
							{summaryStats.totalNames || 0}
						</div>
						<div className={styles.statSubtext}>
							{summaryStats.activeNames || 0} active
						</div>
					</div>
					<div className={styles.statCard}>
						<div className={styles.statLabel}>Avg Rating</div>
						<div className={styles.statValue}>{summaryStats.avgRating}</div>
						<div className={styles.statSubtext}>Global Average</div>
					</div>
					<div className={styles.statCard}>
						<div className={styles.statLabel}>Total Votes</div>
						<div className={styles.statValue}>
							{summaryStats.totalRatings || 0}
						</div>
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
					<div className={styles.statSubtext}>
						Across {namesWithInsights.length} names
					</div>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statLabel}>Total Selected</div>
					<div className={styles.statValue}>
						{summaryStats.totalSelected ?? 0}
					</div>
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
		if (generalInsights.length === 0 || isAdmin) return null;
		return (
			<div className={styles.insights}>
				{generalInsights.map((insight, idx) => (
					<div
						key={idx}
						className={`${styles.insight} ${styles[insight.type] || styles.info}`}
					>
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
							if (pA !== pB) return pA - pB;
							return a.rating - b.rating;
						})
						.slice(0, 12)
						.map((n) => (
							<div
								key={n.id}
								className={`${styles.insightCard} ${styles.warning}`}
							>
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
								<div className={styles.cardMetrics}>
									<span>Rating {Math.round(n.rating)}</span>
									<span>{n.selected} selected</span>
									{n.wins > 0 && <span>{n.wins} wins</span>}
								</div>
								<div className={styles.cardTags}>
									{n.insights
										.filter((i: string) => highPriorityTags.includes(i))
										.map((tag: string) => (
											<span
												key={tag}
												className={`${styles.tag} ${styles.warning}`}
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

/* ========================================= */
/*             ANALYSIS TABLE                */
/* ========================================= */

interface AnalysisTableProps {
	names: ConsolidatedName[];
	isAdmin: boolean;
	canHideNames: boolean;
	sortField: string;
	sortDirection: string;
	onSort: (field: string) => void;
	onHideName: (id: string, name: string) => Promise<void>;
	summaryStats: SummaryStats | null;
}

export const AnalysisTable: React.FC<AnalysisTableProps> = ({
	names,
	isAdmin,
	canHideNames,
	sortField,
	sortDirection,
	onSort,
	onHideName,
	summaryStats,
}) => {
	const renderSortIndicator = (field: string) => {
		if (sortField !== field) return null;
		return (
			<span className={styles.sortIndicator}>
				{sortDirection === "desc" ? "↓" : "↑"}
			</span>
		);
	};

	const handleSort = (field: string, _direction: "asc" | "desc") => {
		// onSort expects just field, direction is managed by parent usually or we pass it
		// But in original code, onSort(field) toggles logic.
		// AnalysisTable props says onSort: (field: string) => void.
		// ColumnHeader passes (field, direction).
		// We should adapt.
		onSort(field);
	};

	return (
		<div className={styles.tableWrapper}>
			<table
				className={styles.table}
				role="table"
				aria-label="Top performing cat names ranked by rating, wins, and selection count"
			>
				<thead>
					<tr>
						<th scope="col">Rank</th>
						<th scope="col">Name</th>
						<th
							scope="col"
							className={styles.sortable}
							onClick={() => onSort("rating")}
							style={{ cursor: "pointer" }}
						>
							{isAdmin ? (
								<ColumnHeader
									label={getMetricLabel("rating")}
									metricName="rating"
									sortable={true}
									sorted={sortField === "rating"}
									sortDirection={sortDirection as "asc" | "desc"}
									onSort={handleSort}
								/>
							) : (
								<>Rating {renderSortIndicator("rating")}</>
							)}
						</th>
						<th
							scope="col"
							className={styles.sortable}
							onClick={() => onSort("wins")}
							style={{ cursor: "pointer" }}
						>
							{isAdmin ? (
								<ColumnHeader
									label={getMetricLabel("total_wins")}
									metricName="total_wins"
									sortable={true}
									sorted={sortField === "wins"}
									sortDirection={sortDirection as "asc" | "desc"}
									onSort={handleSort}
								/>
							) : (
								<>Wins {renderSortIndicator("wins")}</>
							)}
						</th>
						<th
							scope="col"
							className={styles.sortable}
							onClick={() => onSort("selected")}
							style={{ cursor: "pointer" }}
						>
							{isAdmin ? (
								<ColumnHeader
									label={getMetricLabel("times_selected")}
									metricName="times_selected"
									sortable={true}
									sorted={sortField === "selected"}
									sortDirection={sortDirection as "asc" | "desc"}
									onSort={handleSort}
								/>
							) : (
								<>Selected {renderSortIndicator("selected")}</>
							)}
						</th>
						{isAdmin && (
							<th scope="col">
								<span className={styles.columnHeaderLabel}>Insights</span>
							</th>
						)}
						<th
							scope="col"
							className={styles.sortable}
							onClick={() => onSort("dateSubmitted")}
							style={{ cursor: "pointer" }}
						>
							{isAdmin ? (
								<ColumnHeader
									label={getMetricLabel("created_at")}
									metricName="created_at"
									sortable={true}
									sorted={sortField === "dateSubmitted"}
									sortDirection={sortDirection as "asc" | "desc"}
									onSort={handleSort}
								/>
							) : (
								<>Date {renderSortIndicator("dateSubmitted")}</>
							)}
						</th>
						{canHideNames && <th scope="col">Actions</th>}
					</tr>
				</thead>
				<tbody>
					{names.map((item, index) => {
						const rank = index + 1;
						const ratingPercent =
							summaryStats && (summaryStats.maxRating ?? 0) > 0
								? Math.min(
										(item.rating / (summaryStats.maxRating ?? 1)) * 100,
										100,
									)
								: 0;
						const winsPercent =
							summaryStats && (summaryStats.maxWins ?? 0) > 0
								? Math.min((item.wins / (summaryStats.maxWins ?? 1)) * 100, 100)
								: 0;
						const selectedPercent =
							summaryStats && (summaryStats.maxSelected ?? 0) > 0
								? Math.min(
										(item.selected / (summaryStats.maxSelected ?? 1)) * 100,
										100,
									)
								: 0;

						return (
							<tr key={item.id || index} className={styles.tableRow}>
								<td className={styles.colRank} scope="row">
									<span className={`${styles.rankBadge} ${styles.top}`}>
										{isAdmin ? getRankDisplay(rank) : rank}
									</span>
								</td>
								<td className={styles.colName}>{item.name}</td>
								<td className={styles.colRating}>
									{isAdmin ? (
										<div>
											<span
												aria-label={`Rating: ${item.rating} (${item.ratingPercentile}th percentile)`}
											>
												{item.rating}
											</span>
											<span
												style={{
													fontSize: "0.7em",
													marginLeft: "4px",
													opacity: 0.7,
												}}
											>
												{item.ratingPercentile}%ile
											</span>
										</div>
									) : (
										<div className={styles.metricWithBar}>
											<span
												className={styles.metricValue}
												aria-label={`Rating: ${item.rating}`}
											>
												{item.rating}
											</span>
											<div className={styles.metricBar}>
												<div
													className={`${styles.metricBarFill} ${styles.rating}`}
													style={{ width: `${ratingPercent}%` }}
													aria-hidden="true"
												/>
											</div>
										</div>
									)}
								</td>
								<td className={styles.colWins}>
									{isAdmin ? (
										<span
											className={styles.metricValue}
											aria-label={`Wins: ${item.wins}`}
										>
											{item.wins}
										</span>
									) : (
										<div className={styles.metricWithBar}>
											<span
												className={styles.metricValue}
												aria-label={`Wins: ${item.wins}`}
											>
												{item.wins}
											</span>
											<div className={styles.metricBar}>
												<div
													className={`${styles.metricBarFill} ${styles.wins}`}
													style={{ width: `${winsPercent}%` }}
													aria-hidden="true"
												/>
											</div>
										</div>
									)}
								</td>
								<td className={styles.colSelected}>
									{isAdmin ? (
										<div>
											<span
												className={styles.metricValue}
												aria-label={`Selected ${item.selected} times (${item.selectedPercentile}th percentile)`}
											>
												{item.selected}
											</span>
											<span
												style={{
													fontSize: "0.7em",
													marginLeft: "4px",
													opacity: 0.7,
												}}
											>
												{item.selectedPercentile}%ile
											</span>
										</div>
									) : (
										<div className={styles.metricWithBar}>
											<span
												className={styles.metricValue}
												aria-label={`Selected ${item.selected} times`}
											>
												{item.selected}
											</span>
											<div className={styles.metricBar}>
												<div
													className={`${styles.metricBarFill} ${styles.selected}`}
													style={{ width: `${selectedPercent}%` }}
													aria-hidden="true"
												/>
											</div>
										</div>
									)}
								</td>
								{isAdmin && (
									<td>
										<PerformanceBadges
											types={
												Array.isArray(item.insights)
													? (item.insights as string[])
													: []
											}
										/>
									</td>
								)}
								<td className={styles.colDate}>
									{item.dateSubmitted ? (
										<span
											className={styles.metricValue}
											aria-label={`Submitted: ${formatDate(item.dateSubmitted)}`}
											title={formatDate(item.dateSubmitted, {
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										>
											{formatDate(item.dateSubmitted, {
												month: "short",
												day: "numeric",
												year: "numeric",
											})}
										</span>
									) : (
										<span
											className={styles.dateUnknown}
											aria-label="Date unknown"
										>
											—
										</span>
									)}
								</td>
								{canHideNames && (
									<td className={styles.colActions}>
										<button
											type="button"
											className={styles.hideButton}
											onClick={async (e) => {
												e.preventDefault();
												e.stopPropagation();
												try {
													await onHideName(item.id, item.name);
												} catch (error) {
													devError(
														"[AnalysisDashboard] Failed to hide name:",
														error,
													);
												}
											}}
											aria-label={`Hide ${item.name}`}
											title="Hide this name from tournaments"
										>
											<span aria-hidden="true">Hide</span>
										</button>
									</td>
								)}
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};
