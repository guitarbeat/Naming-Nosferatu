import { Button, CardBody, Chip } from "@heroui/react";
import { devError } from "@utils";
import React from "react";
import { Card } from "@/features/ui/Card";
import type { NameWithInsight, SummaryStats } from "../analyticsService";

export const AnalysisInsights: React.FC<{
	namesWithInsights: NameWithInsight[];
	summaryStats: SummaryStats | null;
	generalInsights: Array<{ type: string; message: string; icon: string }>;
	isAdmin: boolean;
	canHideNames: boolean;
	onHideName: (id: string | number, name: string) => Promise<void>;
}> = ({ namesWithInsights, summaryStats, generalInsights, isAdmin, canHideNames, onHideName }) => {
	const renderStatsSummary = () => {
		if (!summaryStats) {
			return null;
		}

		if (isAdmin) {
			return (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<Card variant="default">
						<CardBody className="gap-1">
							<div className="text-white/60 text-sm">Total Names</div>
							<div className="text-2xl font-bold text-white">{summaryStats.totalNames || 0}</div>
							<div className="text-xs text-white/40">{summaryStats.activeNames || 0} active</div>
						</CardBody>
					</Card>
					<Card variant="default">
						<CardBody className="gap-1">
							<div className="text-white/60 text-sm">Avg Rating</div>
							<div className="text-2xl font-bold text-white">{summaryStats.avgRating}</div>
							<div className="text-xs text-white/40">Global Average</div>
						</CardBody>
					</Card>
					<Card variant="default">
						<CardBody className="gap-1">
							<div className="text-white/60 text-sm">Total Votes</div>
							<div className="text-2xl font-bold text-white">{summaryStats.totalRatings || 0}</div>
							<div className="text-xs text-white/40">
								{summaryStats.totalSelections || 0} selections
							</div>
						</CardBody>
					</Card>
				</div>
			);
		}

		return (
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<Card variant="warning">
					<CardBody className="gap-1">
						<div className="text-yellow-500/80 text-sm">Top Rating</div>
						<div className="text-2xl font-bold text-yellow-500">{summaryStats.maxRating ?? 0}</div>
						<div className="text-xs text-yellow-500/60 truncate">{summaryStats.topName?.name}</div>
					</CardBody>
				</Card>
				<Card variant="default">
					<CardBody className="gap-1">
						<div className="text-white/60 text-sm">Avg Rating</div>
						<div className="text-2xl font-bold text-white">{summaryStats.avgRating}</div>
						<div className="text-xs text-white/40">Across {namesWithInsights.length} names</div>
					</CardBody>
				</Card>
				<Card variant="default">
					<CardBody className="gap-1">
						<div className="text-white/60 text-sm">Total Selected</div>
						<div className="text-2xl font-bold text-white">{summaryStats.totalSelected ?? 0}</div>
						<div className="text-xs text-white/40">
							{(summaryStats.maxSelected ?? 0) > 0
								? `Most: ${summaryStats.maxSelected}x`
								: "No selections yet"}
						</div>
					</CardBody>
				</Card>
			</div>
		);
	};

	const renderGeneralInsights = () => {
		if (generalInsights.length === 0 || isAdmin) {
			return null;
		}
		return (
			<div className="flex flex-col gap-3 mb-6">
				{generalInsights.map((insight, idx) => (
					<Card key={idx} variant={insight.type === "warning" ? "warning" : "info"}>
						<CardBody className="flex flex-row items-center gap-3 p-3">
							<span className="text-lg">{insight.icon}</span>
							<span className="text-white/80 text-sm">{insight.message}</span>
						</CardBody>
					</Card>
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
			<div className="mb-6">
				<h3 className="text-lg font-bold text-white mb-3">⚠️ Names to Consider Hiding</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
							<Card key={n.id} variant="danger">
								<CardBody className="p-3 gap-2">
									<div className="flex justify-between items-start">
										<div className="font-bold text-white truncate pr-2">{n.name}</div>
										{canHideNames && (
											<Button
												size="sm"
												color="danger"
												variant="flat"
												className="min-w-0 h-6 px-2 text-xs"
												onPress={async () => {
													try {
														await onHideName(n.id, n.name);
													} catch (error) {
														devError("[AnalysisDashboard] Failed to hide name:", error);
													}
												}}
											>
												Hide
											</Button>
										)}
									</div>
									<div className="flex gap-3 text-xs text-white/60">
										<span>Rating {Math.round(n.rating)}</span>
										<span>{n.selected} sel</span>
										{n.wins > 0 && <span>{n.wins} wins</span>}
									</div>
									<div className="flex flex-wrap gap-1 mt-1">
										{n.insights
											.filter((i: string) => highPriorityTags.includes(i))
											.map((tag: string) => (
												<Chip
													key={tag}
													size="sm"
													color="warning"
													variant="flat"
													className="h-5 text-[10px]"
												>
													{tag.replace("_", " ")}
												</Chip>
											))}
									</div>
								</CardBody>
							</Card>
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
			<div className="mb-6">
				<h3 className="text-lg font-bold text-white mb-3">✨ Top Performers (Keep)</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{topPerformers.slice(0, 6).map((n) => (
						<Card key={n.id} variant="primary">
							<CardBody className="p-3 gap-2">
								<div className="font-bold text-white">{n.name}</div>
								<div className="flex gap-3 text-xs text-white/60">
									<span>Rating {Math.round(n.rating)}</span>
									<span>{n.selected} sel</span>
								</div>
								<div className="flex flex-wrap gap-1 mt-1">
									{n.insights
										.filter((i: string) => positiveTags.includes(i))
										.map((tag: string) => (
											<Chip
												key={tag}
												size="sm"
												color="secondary"
												variant="flat"
												className="h-5 text-[10px]"
											>
												{tag.replace("_", " ")}
											</Chip>
										))}
								</div>
							</CardBody>
						</Card>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col gap-6">
			{renderStatsSummary()}
			{renderGeneralInsights()}
			{renderActionableInsights()}
			{renderPositiveInsights()}
		</div>
	);
};
