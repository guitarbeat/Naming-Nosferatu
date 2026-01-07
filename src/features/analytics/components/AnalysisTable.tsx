import type React from "react";
import { PerformanceBadges } from "../../../shared/components/PerformanceBadge/PerformanceBadge";
import { devError, formatDate, getMetricLabel, getRankDisplay } from "../../../shared/utils/core";
import type { ConsolidatedName, SummaryStats } from "../types";
import styles from "./AnalysisTable.module.css";
import { ColumnHeader } from "./ColumnHeader";
import columnHeaderStyles from "./ColumnHeader.module.css";

interface AnalysisTableProps {
	names: ConsolidatedName[];
	isAdmin: boolean;
	canHideNames: boolean;
	sortField: string;
	sortDirection: string;
	onSort: (field: string) => void;
	onHideName: (id: string | number, name: string) => Promise<void>;
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
		if (sortField !== field) {
			return null;
		}
		return <span className={styles.sortIndicator}>{sortDirection === "desc" ? "↓" : "↑"}</span>;
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
							className={`${styles.sortable} ${styles.sortableHeader}`}
							onClick={() => onSort("rating")}
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
							className={`${styles.sortable} ${styles.sortableHeader}`}
							onClick={() => onSort("wins")}
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
							className={`${styles.sortable} ${styles.sortableHeader}`}
							onClick={() => onSort("selected")}
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
								<span className={columnHeaderStyles.columnHeaderLabel}>Insights</span>
							</th>
						)}
						<th
							scope="col"
							className={`${styles.sortable} ${styles.sortableHeader}`}
							onClick={() => onSort("dateSubmitted")}
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
								? Math.min((item.rating / (summaryStats.maxRating ?? 1)) * 100, 100)
								: 0;
						const winsPercent =
							summaryStats && (summaryStats.maxWins ?? 0) > 0
								? Math.min((item.wins / (summaryStats.maxWins ?? 1)) * 100, 100)
								: 0;
						const selectedPercent =
							summaryStats && (summaryStats.maxSelected ?? 0) > 0
								? Math.min((item.selected / (summaryStats.maxSelected ?? 1)) * 100, 100)
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
											<span className={styles.metricValue} aria-label={`Rating: ${item.rating}`}>
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
										<span className={styles.metricValue} aria-label={`Wins: ${item.wins}`}>
											{item.wins}
										</span>
									) : (
										<div className={styles.metricWithBar}>
											<span className={styles.metricValue} aria-label={`Wins: ${item.wins}`}>
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
											types={Array.isArray(item.insights) ? (item.insights as string[]) : []}
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
										<span className={styles.dateUnknown} aria-label="Date unknown">
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
													devError("[AnalysisDashboard] Failed to hide name:", error);
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
