/**
 * @module PersonalResults
 * @description Component that displays the user's personal tournament results.
 */

import PropTypes from "prop-types";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Bracket from "../../../shared/components/Bracket/Bracket";
import Button from "../../../shared/components/Button/Button";
import TournamentButton from "../TournamentButton";
import Card from "../../../shared/components/Card/Card";
import {
	CollapsibleContent,
	CollapsibleHeader,
} from "../../../shared/components/Header/CollapsibleHeader";
import { useToast } from "../../../shared/hooks/useAppHooks";
import { calculateBracketRound, devError } from "../../../shared/utils/core";

interface RankingItem {
	id: string | number;
	name: string;
	rating: number;
	wins?: number;
	losses?: number;
}

import RankingAdjustment from "../RankingAdjustment";
import styles from "./PersonalResults.module.css";

/**
 * Vote history item interface
 */
interface VoteHistoryItem {
	match: {
		left: {
			name: string;
			outcome?: "win" | "loss";
		};
		right: {
			name: string;
			outcome?: "win" | "loss";
		};
	};
	result?: number;
}

/**
 * CalendarButton component - exports tournament results to Google Calendar
 */
interface Ranking {
	id: string | number | undefined;
	name: string;
	rating: number;
	wins: number;
	losses: number;
	change: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	is_hidden: boolean;
}

interface CalendarButtonProps {
	rankings: Ranking[];
	userName: string;
	className?: string;
	variant?: "primary" | "secondary" | "danger" | "text" | "icon";
	size?: "small" | "medium" | "large";
	disabled?: boolean;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	[key: string]: unknown;
}

/**
 * CalendarButton component - exports tournament results to Google Calendar
 */
function CalendarButton({
	rankings,
	userName,
	className = "",
	variant = "secondary",
	size = "medium",
	disabled = false,
	...rest
}: CalendarButtonProps) {
	const { onClick: externalOnClick, ...buttonProps } = rest;

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (typeof externalOnClick === "function") {
			externalOnClick(event);
		}

		if (event?.defaultPrevented) {
			return;
		}

		// Filter out hidden names and sort by rating
		const activeNames = rankings
			.filter((name) => !name.is_hidden)
			.sort((a, b) => (b.rating || 1500) - (a.rating || 1500));

		const winnerName = activeNames[0]?.name || "No winner yet";

		const today = new Date();
		const startDateISO = today.toISOString().split("T")[0];
		const startDate = startDateISO?.replace(/-/g, "") || "";
		const endDate = new Date(today);
		endDate.setDate(endDate.getDate() + 1);
		const endDateISO = endDate.toISOString().split("T")[0];
		const endDateStr = endDateISO?.replace(/-/g, "") || "";

		const text = `🐈‍⬛ ${winnerName}`;
		const details = `Cat name rankings for ${userName}:\n\n${activeNames
			.map(
				(name, index) => `${index + 1}. ${name.name} (Rating: ${Math.round(name.rating || 1500)})`,
			)
			.join("\n")}`;

		const baseUrl = "https://calendar.google.com/calendar/render";
		const params = new URLSearchParams({
			action: "TEMPLATE",
			text,
			details,
			dates: `${startDate}/${endDateStr}`,
			ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
		});

		window.open(`${baseUrl}?${params.toString()}`, "_blank");
	};

	const buttonVariant = (() => {
		switch (variant) {
			case "primary":
				return "primary";
			case "secondary":
				return "secondary";
			case "danger":
				return "danger";
			default:
				return "ghost";
		}
	})();

	return (
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		<Button
			variant={buttonVariant}
			size={size}
			onClick={handleClick}
			className={className}
			disabled={disabled}
			startIcon={<span>📅</span>}
			aria-label="Add to Google Calendar"
			title="Add to Google Calendar"
			{...buttonProps}
		>
			Add to Calendar
		</Button>
	);
}

CalendarButton.propTypes = {
	rankings: PropTypes.array.isRequired,
	userName: PropTypes.string.isRequired,
	className: PropTypes.string,
	variant: PropTypes.string,
	size: PropTypes.string,
	disabled: PropTypes.bool,
	onClick: PropTypes.func,
};

interface PersonalResultsProps {
	personalRatings: Record<
		string,
		| {
				rating?: number;
				wins?: number;
				losses?: number /* biome-ignore lint/style/useNamingConvention: Database column names must match exactly */;
				is_hidden?: boolean;
		  }
		| number
	>;
	currentTournamentNames: { id: string | number; name: string }[];
	voteHistory: VoteHistoryItem[];
	onStartNew: () => void;
	onUpdateRatings: (ratings: unknown) => void;
	userName: string;
}

/**
 * PersonalResults Component
 */
function PersonalResults({
	personalRatings,
	currentTournamentNames,
	voteHistory,
	onStartNew,
	onUpdateRatings,
	userName,
}: PersonalResultsProps) {
	const [personalRankings, setPersonalRankings] = useState<Ranking[]>([]);
	const rankingsForAdjustment: RankingItem[] = personalRankings.map((r) => ({
		id: r.id || r.name,
		name: r.name,
		rating: r.rating,
		wins: r.wins,
		losses: r.losses,
	}));
	const [isBracketCollapsed, setIsBracketCollapsed] = useState(false);

	const { showToast } = useToast();

	const hasPersonalData = personalRatings && Object.keys(personalRatings).length > 0;
	const hasTournamentNames = currentTournamentNames && currentTournamentNames.length > 0;

	// * Process personal tournament rankings
	const tournamentNameSet = useMemo(
		() => new Set(currentTournamentNames?.map((n) => n.name) || []),
		[currentTournamentNames],
	);

	const nameToIdMap = useMemo(
		() =>
			new Map(
				(currentTournamentNames || [])
					.filter((name) => name?.name)
					.map(({ id, name }) => [name, id]),
			),
		[currentTournamentNames],
	);

	useEffect(() => {
		if (!hasPersonalData || !hasTournamentNames) {
			setPersonalRankings([]);
			return;
		}

		try {
			const rankings = Object.entries(personalRatings || {})
				.filter(([name]) => tournamentNameSet.has(name))
				.map(([name, rating]) => {
					const ratingObj = typeof rating === "object" ? rating : null;
					return {
						id: nameToIdMap.get(name),
						name,
						rating: Math.round(typeof rating === "number" ? rating : ratingObj?.rating || 1500),
						wins: ratingObj?.wins || 0,
						losses: ratingObj?.losses || 0,
						change: 0,
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						is_hidden: ratingObj?.is_hidden || false,
					};
				})
				.sort((a, b) => b.rating - a.rating);

			setPersonalRankings(rankings);
		} catch (error) {
			devError("Error processing personal rankings:", error);
			setPersonalRankings([]);
		}
	}, [personalRatings, tournamentNameSet, nameToIdMap, hasPersonalData, hasTournamentNames]);
	// * Calculate bracket matches for personal tournament
	const bracketMatches = useMemo(() => {
		if (!voteHistory || !voteHistory.length || !hasTournamentNames) {
			return [];
		}

		const namesCount = currentTournamentNames?.length || 0;
		const votes = voteHistory;

		return votes
			.filter(
				(vote) =>
					vote?.match?.left?.name &&
					vote?.match?.right?.name &&
					tournamentNameSet.has(vote.match.left.name) &&
					tournamentNameSet.has(vote.match.right.name),
			)
			.map((vote, index) => {
				const leftOutcome = vote?.match?.left?.outcome;
				const rightOutcome = vote?.match?.right?.outcome;
				let winner;

				if (leftOutcome || rightOutcome) {
					const leftWin = leftOutcome === "win";
					const rightWin = rightOutcome === "win";
					if (leftWin && rightWin) {
						winner = 0;
					} else if (leftWin && !rightWin) {
						winner = -1;
					} else if (!leftWin && rightWin) {
						winner = 1;
					} else {
						winner = 2;
					}
				} else if (typeof vote.result === "number") {
					if (vote.result === -1) {
						winner = -1;
					} else if (vote.result === 1) {
						winner = 1;
					} else if (vote.result === 0.5) {
						winner = 0;
					} else if (vote.result === 0) {
						winner = 2;
					} else if (vote.result < -0.1) {
						winner = -1;
					} else if (vote.result > 0.1) {
						winner = 1;
					} else if (Math.abs(vote.result) <= 0.1) {
						winner = 0;
					} else {
						winner = 2;
					}
				} else {
					winner = 2;
				}

				const matchNumber = index + 1;
				const calculatedRound = calculateBracketRound(namesCount, matchNumber);

				return {
					id: matchNumber,
					round: calculatedRound,
					name1: vote?.match?.left?.name || "Unknown",
					name2: vote?.match?.right?.name || "Unknown",
					winner,
				};
			});
	}, [voteHistory, tournamentNameSet, currentTournamentNames, hasTournamentNames]);

	// * Handle saving adjusted personal rankings
	const handleSaveAdjustments = useCallback(
		async (adjustedRankings: RankingItem[]) => {
			try {
				const updatedRankings = adjustedRankings.map((ranking: RankingItem) => {
					const oldRanking = personalRankings.find((r) => r.name === ranking.name);
					return {
						...ranking,
						change: oldRanking ? ranking.rating - oldRanking.rating : 0,
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						is_hidden: oldRanking?.is_hidden ?? false,
					} as Ranking;
				});

				const newRatings = updatedRankings.map(({ name, rating }: Ranking) => {
					const existingRating = personalRatings[name];
					const existingRatingObj =
						typeof existingRating === "object" && existingRating !== null ? existingRating : null;
					return {
						name,
						rating: Math.round(rating),
						wins: existingRatingObj?.wins || 0,
						losses: existingRatingObj?.losses || 0,
					};
				});

				await onUpdateRatings(newRatings);
				setPersonalRankings(updatedRankings);

				showToast({
					message: "Rankings updated successfully!",
					type: "success",
				});
			} catch (error) {
				devError("Failed to update rankings:", error);
				showToast({
					message: "Unable to update rankings. Please try again.",
					type: "error",
				});
			}
		},
		[personalRankings, personalRatings, onUpdateRatings, showToast],
	);

	const getRatingLabel = useCallback((rating: number) => {
		if (rating >= 1800) {
			return "Top Tier";
		}
		if (rating >= 1600) {
			return "Great";
		}
		if (rating >= 1400) {
			return "Good";
		}
		return "Fair";
	}, []);

	const topThreeNames = useMemo(() => {
		return personalRankings
			.filter((r) => !r.is_hidden)
			.slice(0, 3)
			.map((ranking, index) => ({
				...ranking,
				position: index + 1,
				ratingLabel: getRatingLabel(ranking.rating),
			}));
	}, [personalRankings, getRatingLabel]);

	if (!hasPersonalData) {
		return (
			<div className={styles.emptyState}>
				<p>Complete a tournament to see your personal results here!</p>
				<div className={styles.actions}>
					<TournamentButton onClick={onStartNew} className={styles.startNewButton}>
						Start New Tournament
					</TournamentButton>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.personalResults}>
			{/* Top 3 Summary Card */}
			{topThreeNames.length > 0 && (
				<Card background="glass" padding="large" shadow="medium" className={styles.topThreeCard}>
					<h3 className={styles.topThreeTitle}>Your Top 3 Names</h3>
					<div className={styles.topThreeList}>
						{topThreeNames.map((name, index) => (
							<div key={name.id || name.name} className={styles.topThreeItem}>
								<div className={styles.topThreePosition}>
									<span className={styles.positionBadge}>{name.position}</span>
									<span className={styles.positionMedal}>
										{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
									</span>
								</div>
								<div className={styles.topThreeDetails}>
									<span className={styles.topThreeName}>{name.name}</span>
									<div className={styles.topThreeMeta}>
										<span className={styles.ratingLabel}>{name.ratingLabel}</span>
										<span className={styles.ratingValue}>({name.rating})</span>
									</div>
								</div>
							</div>
						))}
					</div>
				</Card>
			)}

			{personalRankings.length > 0 && (
				<div className={styles.statsGrid}>
					<Card.Stats
						title="Your Winner"
						value={personalRankings[0]?.name || "-"}
						emoji="🏆"
						className={styles.statCard}
					>
						{null}
					</Card.Stats>
					<Card.Stats
						title="Top Name Score"
						value={personalRankings[0]?.rating || 1500}
						emoji="⭐"
						className={styles.statCard}
					>
						{null}
					</Card.Stats>
					<Card.Stats
						title="Total Names"
						value={personalRankings.length}
						emoji="📝"
						className={styles.statCard}
					>
						{null}
					</Card.Stats>
				</div>
			)}

			<RankingAdjustment
				rankings={rankingsForAdjustment}
				onSave={handleSaveAdjustments}
				onCancel={onStartNew}
			/>

			{bracketMatches.length > 0 && (
				<div className={styles.bracketSection}>
					<CollapsibleHeader
						title="Tournament Bracket"
						isCollapsed={isBracketCollapsed}
						onToggle={() => setIsBracketCollapsed(!isBracketCollapsed)}
						className={styles.bracketHeader}
					/>
					<CollapsibleContent isCollapsed={isBracketCollapsed} id="personal-bracket-content">
						<Bracket matches={bracketMatches} />
					</CollapsibleContent>
				</div>
			)}

			<div className={styles.actions}>
				<TournamentButton onClick={onStartNew} className={styles.startNewButton}>
					Start New Tournament
				</TournamentButton>
				{hasPersonalData && <CalendarButton rankings={personalRankings} userName={userName} />}
			</div>
		</div>
	);
}

PersonalResults.propTypes = {
	personalRatings: PropTypes.object,
	currentTournamentNames: PropTypes.array,
	voteHistory: PropTypes.arrayOf(PropTypes.object),
	onStartNew: PropTypes.func.isRequired,
	onUpdateRatings: PropTypes.func,
	userName: PropTypes.string.isRequired,
};

export default PersonalResults;
