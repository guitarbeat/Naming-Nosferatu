import type React from "react";
import {
	devError,
	formatDate,
	getMetricLabel,
	getRankDisplay,
} from "../../../utils/coreUtils";
import { ColumnHeader } from "../../Header/ColumnHeader";
import { PerformanceBadges } from "../../PerformanceBadge/PerformanceBadge";
import type { SummaryStats } from "../types";
import type { ConsolidatedName } from "../useAnalysisDisplayData";

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
			<span className="sort-indicator">
				{sortDirection === "desc" ? "↓" : "↑"}
			</span>
		);
	};

	return (
		<div className="top-names-list">
			<table
				className="top-names-table"
				role="table"
				aria-label="Top performing cat names ranked by rating, wins, and selection count"
			>
				<thead>
					<tr>
						<th scope="col">Rank</th>
						<th scope="col">Name</th>
						<th
							scope="col"
							className="sortable"
							onClick={() => onSort("rating")}
							style={{ cursor: "pointer" }}
						>
							{isAdmin ? (
								<ColumnHeader
									label={getMetricLabel("rating")}
									metricName="rating"
									sortable={true}
									sorted={sortField === "rating"}
									sortDirection={sortDirection}
									onSort={onSort}
								/>
							) : (
								<>Rating {renderSortIndicator("rating")}</>
							)}
						</th>
						<th
							scope="col"
							className="sortable"
							onClick={() => onSort("wins")}
							style={{ cursor: "pointer" }}
						>
							{isAdmin ? (
								<ColumnHeader
									label={getMetricLabel("total_wins")}
									metricName="total_wins"
									sortable={true}
									sorted={sortField === "wins"}
									sortDirection={sortDirection}
									onSort={onSort}
								/>
							) : (
								<>Wins {renderSortIndicator("wins")}</>
							)}
						</th>
						<th
							scope="col"
							className="sortable"
							onClick={() => onSort("selected")}
							style={{ cursor: "pointer" }}
						>
							{isAdmin ? (
								<ColumnHeader
									label={getMetricLabel("times_selected")}
									metricName="times_selected"
									sortable={true}
									sorted={sortField === "selected"}
									sortDirection={sortDirection}
									onSort={onSort}
								/>
							) : (
								<>Selected {renderSortIndicator("selected")}</>
							)}
						</th>
						{isAdmin && (
							<th scope="col">
								<span className="column-header-label">Insights</span>
							</th>
						)}
						<th
							scope="col"
							className="sortable"
							onClick={() => onSort("dateSubmitted")}
							style={{ cursor: "pointer" }}
						>
							{isAdmin ? (
								<ColumnHeader
									label={getMetricLabel("created_at")}
									metricName="created_at"
									sortable={true}
									sorted={sortField === "dateSubmitted"}
									sortDirection={sortDirection}
									onSort={onSort}
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
							<tr key={item.id || index} className="top-names-row">
								<td className="top-names-rank" scope="row">
									<span className="rank-badge rank-badge--top">
										{isAdmin ? getRankDisplay(rank) : rank}
									</span>
								</td>
								<td className="top-names-name">{item.name}</td>
								<td className="top-names-rating-cell">
									{isAdmin ? (
										<div className="metric-with-insight">
											<span
												className="top-names-rating"
												aria-label={`Rating: ${item.rating} (${item.ratingPercentile}th percentile)`}
											>
												{item.rating}
											</span>
											<span className="metric-percentile">
												{item.ratingPercentile}%ile
											</span>
										</div>
									) : (
										<div className="metric-with-bar">
											<span
												className="top-names-rating"
												aria-label={`Rating: ${item.rating}`}
											>
												{item.rating}
											</span>
											<div className="metric-bar">
												<div
													className="metric-bar-fill metric-bar-fill--rating"
													style={{ width: `${ratingPercent}%` }}
													aria-hidden="true"
												/>
											</div>
										</div>
									)}
								</td>
								<td className="top-names-wins-cell">
									{isAdmin ? (
										<span
											className="top-names-wins"
											aria-label={`Wins: ${item.wins}`}
										>
											{item.wins}
										</span>
									) : (
										<div className="metric-with-bar">
											<span
												className="top-names-wins"
												aria-label={`Wins: ${item.wins}`}
											>
												{item.wins}
											</span>
											<div className="metric-bar">
												<div
													className="metric-bar-fill metric-bar-fill--wins"
													style={{ width: `${winsPercent}%` }}
													aria-hidden="true"
												/>
											</div>
										</div>
									)}
								</td>
								<td className="top-names-selected-cell">
									{isAdmin ? (
										<div className="metric-with-insight">
											<span
												className="top-names-selected"
												aria-label={`Selected ${item.selected} times (${item.selectedPercentile}th percentile)`}
											>
												{item.selected}
											</span>
											<span className="metric-percentile">
												{item.selectedPercentile}%ile
											</span>
										</div>
									) : (
										<div className="metric-with-bar">
											<span
												className="top-names-selected"
												aria-label={`Selected ${item.selected} times`}
											>
												{item.selected}
											</span>
											<div className="metric-bar">
												<div
													className="metric-bar-fill metric-bar-fill--selected"
													style={{ width: `${selectedPercent}%` }}
													aria-hidden="true"
												/>
											</div>
										</div>
									)}
								</td>
								{isAdmin && (
									<td className="top-names-insights-cell">
										<PerformanceBadges
											types={
												Array.isArray(item.insights)
													? (item.insights as string[])
													: []
											}
										/>
									</td>
								)}
								<td className="top-names-date-cell">
									{item.dateSubmitted ? (
										<span
											className="top-names-date"
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
											className="top-names-date top-names-date--unknown"
											aria-label="Date unknown"
										>
											—
										</span>
									)}
								</td>
								{canHideNames && (
									<td className="top-names-actions">
										<button
											type="button"
											className="top-names-hide-button"
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
