import {
	Button,
	Chip,
	cn,
	Progress,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@heroui/react";
import { devError, formatDate, getMetricLabel, getRankDisplay } from "@utils";
import React, { useCallback, useMemo } from "react";
import { PerformanceBadges } from "@/features/ui/StatusIndicators";
import type { ConsolidatedName, SummaryStats } from "../analyticsService";

export const AnalysisTable: React.FC<{
	names: ConsolidatedName[];
	isAdmin: boolean;
	canHideNames: boolean;
	sortField: string;
	sortDirection: string;
	onSort: (field: string) => void;
	onHideName: (id: string | number, name: string) => Promise<void>;
	summaryStats: SummaryStats | null;
}> = ({
	names,
	isAdmin,
	canHideNames,
	sortField,
	sortDirection,
	onSort,
	onHideName,
	summaryStats,
}) => {
	const columns = useMemo(() => {
		const cols = [
			{ key: "rank", label: "Rank" },
			{ key: "name", label: "Name" },
			{ key: "rating", label: isAdmin ? getMetricLabel("rating") : "Rating", sortable: true },
			{ key: "wins", label: isAdmin ? getMetricLabel("total_wins") : "Wins", sortable: true },
			{
				key: "selected",
				label: isAdmin ? getMetricLabel("times_selected") : "Selected",
				sortable: true,
			},
		];

		if (isAdmin) {
			cols.push({ key: "insights", label: "Insights" });
		}

		cols.push({
			key: "dateSubmitted",
			label: isAdmin ? getMetricLabel("created_at") : "Date",
			sortable: true,
		});

		if (canHideNames) {
			cols.push({ key: "actions", label: "Actions" });
		}
		return cols;
	}, [isAdmin, canHideNames]);

	const renderCell = useCallback(
		(item: ConsolidatedName, columnKey: React.Key) => {
			const rank = names.findIndex((n) => n.id === item.id) + 1;
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

			switch (columnKey) {
				case "rank":
					return (
						<Chip
							size="sm"
							variant="flat"
							className={cn(
								"border-none",
								rank <= 3 ? "bg-yellow-500/20 text-yellow-300" : "bg-white/10 text-white/60",
							)}
						>
							{isAdmin ? getRankDisplay(rank) : rank}
						</Chip>
					);
				case "name":
					return <span className="font-bold text-white">{item.name}</span>;
				case "rating":
					return (
						<div className="flex flex-col gap-1 min-w-[100px]">
							<div className="flex justify-between text-xs">
								<span>{Math.round(item.rating)}</span>
								{isAdmin && <span className="text-white/40">{item.ratingPercentile}%ile</span>}
							</div>
							{!isAdmin && (
								<Progress value={ratingPercent} color="warning" size="sm" aria-label="Rating" />
							)}
						</div>
					);
				case "wins":
					return (
						<div className="flex flex-col gap-1 min-w-[80px]">
							<span className="text-xs">{item.wins}</span>
							{!isAdmin && (
								<Progress value={winsPercent} color="success" size="sm" aria-label="Wins" />
							)}
						</div>
					);
				case "selected":
					return (
						<div className="flex flex-col gap-1 min-w-[80px]">
							<span className="text-xs">{item.selected}</span>
							{isAdmin && <span className="text-white/40">{item.selectedPercentile}%ile</span>}
							{!isAdmin && (
								<Progress
									value={selectedPercent}
									color="secondary"
									size="sm"
									aria-label="Selected"
								/>
							)}
						</div>
					);
				case "insights":
					return isAdmin ? (
						<PerformanceBadges
							types={Array.isArray(item.insights) ? (item.insights as string[]) : []}
						/>
					) : null;
				case "dateSubmitted":
					return (
						<span className="text-xs text-white/50">
							{item.dateSubmitted
								? formatDate(item.dateSubmitted, {
										month: "short",
										day: "numeric",
										year: "numeric",
									})
								: "—"}
						</span>
					);
				case "actions":
					return canHideNames ? (
						<Button
							size="sm"
							color="danger"
							variant="light"
							onPress={async () => {
								try {
									await onHideName(item.id, item.name);
								} catch (error) {
									devError("[AnalysisDashboard] Failed to hide name:", error);
								}
							}}
						>
							Hide
						</Button>
					) : null;
				default:
					return null;
			}
		},
		[names, summaryStats, isAdmin, canHideNames, onHideName],
	);

	return (
		<div className="w-full overflow-x-auto">
			<Table
				aria-label="Analytics Table"
				sortDescriptor={{
					column: sortField,
					direction: sortDirection === "asc" ? "ascending" : "descending",
				}}
				onSortChange={(descriptor) => onSort(descriptor.column as string)}
				classNames={{
					wrapper: "bg-white/5 border border-white/5",
					th: "bg-white/10 text-white/60",
					td: "text-white/80 py-3",
				}}
				removeWrapper={true}
			>
				<TableHeader columns={columns}>
					{(column) => (
						<TableColumn key={column.key} allowsSorting={!!column.sortable}>
							{column.label}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody items={names}>
					{(item) => (
						<TableRow key={item.id}>
							{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
};
