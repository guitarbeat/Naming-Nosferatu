/**
 * @module Dashboard
 * @description Dashboard component for analytics and results
 */

import { Suspense, useEffect, useState } from "react";
import { leaderboardAPI, statsAPI } from "@/features/analytics/analyticsService";
import { coreAPI, hiddenNamesAPI } from "@/services/supabase/client";
import Button from "@/shared/components/layout/Button";
import { Card } from "@/shared/components/layout/Card";
import { Loading } from "@/shared/components/layout/Feedback";
import { BarChart3, Eye, EyeOff, Trophy } from "@/shared/lib/icons";
import type { NameItem, RatingData } from "@/shared/types";
import { RandomGenerator } from "../tournament/components/RandomGenerator";
import { PersonalResults } from "./PersonalResults";

interface DashboardProps {
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
	canHideNames?: boolean;
	onNameHidden?: (nameId: string) => void;
}

export function Dashboard({
	userName = "",
	isAdmin = false,
	onStartNew,
	onUpdateRatings,
	personalRatings,
	currentTournamentNames,
}: DashboardProps) {
	const [leaderboard, setLeaderboard] = useState<
		Array<{
			name: string;
			avg_rating: number;
			wins: number;
			total_ratings: number;
		}>
	>([]);
	const [siteStats, setSiteStats] = useState<{
		totalNames: number;
		activeNames: number;
		hiddenNames: number;
		totalUsers: number;
		avgRating: number;
	} | null>(null);
	const [userStats, setUserStats] = useState<{
		totalRatings: number;
		totalSelections: number;
		totalWins: number;
		winRate: number;
	} | null>(null);
	const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
	const [_isLoadingStats, setIsLoadingStats] = useState(true);
	const [hiddenNames, setHiddenNames] = useState<Array<{ id: string | number; name: string }>>([]);
	const [showHiddenNames, setShowHiddenNames] = useState(false);

	// Fetch leaderboard
	useEffect(() => {
		const fetchLeaderboard = async () => {
			setIsLoadingLeaderboard(true);
			try {
				const data = await leaderboardAPI.getLeaderboard(10);
				setLeaderboard(data);
			} catch (error) {
				console.error("Failed to fetch leaderboard:", error);
			} finally {
				setIsLoadingLeaderboard(false);
			}
		};
		fetchLeaderboard();
	}, []);

	// Fetch stats
	useEffect(() => {
		const fetchStats = async () => {
			setIsLoadingStats(true);
			try {
				const [site, user] = await Promise.all([
					statsAPI.getSiteStats(),
					userName ? statsAPI.getUserStats(userName) : Promise.resolve(null),
				]);
				setSiteStats(site);
				setUserStats(user);
			} catch (error) {
				console.error("Failed to fetch stats:", error);
			} finally {
				setIsLoadingStats(false);
			}
		};
		fetchStats();
	}, [userName]);

	// Fetch hidden names (admin only)
	useEffect(() => {
		if (isAdmin && showHiddenNames) {
			const fetchHidden = async () => {
				try {
					const data = await hiddenNamesAPI.getHiddenNames();
					setHiddenNames(data);
				} catch (error) {
					console.error("Failed to fetch hidden names:", error);
				}
			};
			fetchHidden();
		}
	}, [isAdmin, showHiddenNames]);

	const handleUnhideName = async (nameId: string | number) => {
		if (!userName) {
			return;
		}
		try {
			const result = await hiddenNamesAPI.unhideName(userName, nameId);
			if (!result.success) {
				throw new Error(result.error || "Failed to unhide name");
			}
			setHiddenNames((prev) => prev.filter((n) => n.id !== nameId));
		} catch (error) {
			console.error("Failed to unhide name:", error);
		}
	};

	return (
		<div className="dashboard-container space-y-8">
			{/* Personal Results with Ranking Adjustment */}
			{personalRatings && Object.keys(personalRatings).length > 0 && onUpdateRatings && (
				<PersonalResults
					personalRatings={personalRatings}
					currentTournamentNames={currentTournamentNames}
					onStartNew={
						onStartNew ||
						(() => {
							// Default no-op
						})
					}
					onUpdateRatings={onUpdateRatings}
					userName={userName}
				/>
			)}

			{/* Random Name Generator */}
			<Card className="p-6">
				<Suspense fallback={<div className="p-4">Loading...</div>}>
					<RandomGenerator fetchNames={() => coreAPI.getTrendingNames(false)} />
				</Suspense>
			</Card>

			{/* User Stats */}
			{userName && userStats && (
				<Card className="p-6">
					<div className="flex items-center gap-3 mb-4">
						<BarChart3 className="text-purple-400" size={24} />
						<h3 className="text-xl font-semibold text-white">Your Stats</h3>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="bg-white/5 rounded-lg p-4 border border-white/10">
							<p className="text-sm text-white/60 mb-1">Ratings Given</p>
							<p className="text-2xl font-bold text-white">{userStats.totalRatings}</p>
						</div>
						<div className="bg-white/5 rounded-lg p-4 border border-white/10">
							<p className="text-sm text-white/60 mb-1">Names Selected</p>
							<p className="text-2xl font-bold text-white">{userStats.totalSelections}</p>
						</div>
						<div className="bg-white/5 rounded-lg p-4 border border-white/10">
							<p className="text-sm text-white/60 mb-1">Total Wins</p>
							<p className="text-2xl font-bold text-white">{userStats.totalWins}</p>
						</div>
						<div className="bg-white/5 rounded-lg p-4 border border-white/10">
							<p className="text-sm text-white/60 mb-1">Win Rate</p>
							<p className="text-2xl font-bold text-white">{userStats.winRate}%</p>
						</div>
					</div>
				</Card>
			)}

			{/* Global Leaderboard */}
			<Card className="p-6">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						<Trophy className="text-yellow-400" size={24} />
						<h3 className="text-xl font-semibold text-white">Top Names</h3>
					</div>
					{onStartNew && (
						<Button variant="ghost" size="small" onClick={onStartNew}>
							Start New Tournament
						</Button>
					)}
				</div>

				{isLoadingLeaderboard ? (
					<Loading variant="skeleton" height={300} />
				) : leaderboard.length > 0 ? (
					<div className="space-y-2">
						{leaderboard.map((entry, index) => (
							<div
								key={entry.name}
								className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
							>
								<div
									className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
										index === 0
											? "bg-yellow-500 text-black"
											: index === 1
												? "bg-gray-300 text-black"
												: index === 2
													? "bg-amber-600 text-white"
													: "bg-white/10 text-white/60"
									}`}
								>
									{index + 1}
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-white truncate">{entry.name}</p>
									<p className="text-xs text-white/60">
										{entry.total_ratings} rating{entry.total_ratings !== 1 ? "s" : ""} •{" "}
										{entry.wins} win{entry.wins !== 1 ? "s" : ""}
									</p>
								</div>
								<div className="text-right">
									<p className="text-lg font-bold text-purple-400">
										{Math.round(entry.avg_rating)}
									</p>
									<p className="text-xs text-white/60">rating</p>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="text-center text-white/60 py-8">No ratings yet. Start a tournament!</p>
				)}
			</Card>

			{/* Site Statistics */}
			{siteStats && (
				<Card className="p-6">
					<h3 className="text-xl font-semibold text-white mb-4">Site Statistics</h3>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						<div className="bg-white/5 rounded-lg p-4 border border-white/10">
							<p className="text-sm text-white/60 mb-1">Total Names</p>
							<p className="text-2xl font-bold text-white">{siteStats.totalNames}</p>
						</div>
						<div className="bg-white/5 rounded-lg p-4 border border-white/10">
							<p className="text-sm text-white/60 mb-1">Active Names</p>
							<p className="text-2xl font-bold text-white">{siteStats.activeNames}</p>
						</div>
						<div className="bg-white/5 rounded-lg p-4 border border-white/10">
							<p className="text-sm text-white/60 mb-1">Total Users</p>
							<p className="text-2xl font-bold text-white">{siteStats.totalUsers}</p>
						</div>
						<div className="bg-white/5 rounded-lg p-4 border border-white/10">
							<p className="text-sm text-white/60 mb-1">Avg Rating</p>
							<p className="text-2xl font-bold text-white">{Math.round(siteStats.avgRating)}</p>
						</div>
						{isAdmin && (
							<div className="bg-amber-900/20 rounded-lg p-4 border border-amber-500/30">
								<p className="text-sm text-amber-400/80 mb-1">Hidden Names</p>
								<p className="text-2xl font-bold text-amber-400">{siteStats.hiddenNames}</p>
							</div>
						)}
					</div>
				</Card>
			)}

			{/* Admin: Hidden Names Management */}
			{isAdmin && (
				<Card className="p-6 border-amber-500/30 bg-amber-900/10">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<EyeOff className="text-amber-400" size={24} />
							<h3 className="text-xl font-semibold text-amber-400">Admin: Hidden Names</h3>
						</div>
						<Button
							variant="ghost"
							size="small"
							onClick={() => setShowHiddenNames(!showHiddenNames)}
						>
							{showHiddenNames ? "Hide List" : "Show List"}
						</Button>
					</div>

					{showHiddenNames && (
						<div className="space-y-2">
							{hiddenNames.length > 0 ? (
								hiddenNames.map((name) => (
									<div
										key={name.id}
										className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-amber-500/20"
									>
										<span className="text-white font-medium">{name.name}</span>
										<Button
											variant="ghost"
											size="small"
											onClick={() => handleUnhideName(name.id)}
											className="text-green-400 hover:text-green-300"
										>
											<Eye size={16} className="mr-1" />
											Unhide
										</Button>
									</div>
								))
							) : (
								<p className="text-center text-white/60 py-4">No hidden names</p>
							)}
						</div>
					)}
				</Card>
			)}
		</div>
	);
}
// Alias for compatibility
