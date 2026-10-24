import { useMutation, useQuery } from "@tanstack/react-query";
import { MousePointerClick, Play, RotateCcw, Trophy, Undo2, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
	DriftWall,
	type DriftWallItem,
	type DriftWallTournamentStage,
} from "@/components/DriftWall";
import { Button, Loading } from "@/components/UiPrimitives";
import { useTimedState } from "@/hooks/useCommonHooks";
import { useTournamentState } from "@/hooks/useTournamentState";
import { namesQueryOptions, ratingsAPI, SUPABASE_UNAVAILABLE_MSG } from "@/lib/api";
import {
	DEFAULT_SAMPLE_NAMES,
	getLockedNames,
	getVisibleNames,
	hapticNavTap,
	hapticVoteTap,
	isNameLocked,
	normalizeRatingsWithStats,
} from "@/lib/utils";
import useAppStore, { useTournamentSetupState } from "@/store";
import type { IdType, RatingData } from "@/types";
import { TournamentArena } from "./TournamentArena";
import {
	createIdToNameMap,
	extractMatchData,
	getContestantStreak,
	getMatchSideId,
	normalizeParticipant,
} from "./tournamentEngine";

/* ==========================================================================
   SYNTHESIZED WEB AUDIO FEEDBACK (ZERO-DEPENDENCY GAME CHIMES)
   ========================================================================== */

let sharedAudioCtx: AudioContext | null = null;

function playSanctuaryTone(kind: "select" | "start" | "vote" | "undo" | "champion") {
	if (typeof window === "undefined") {
		return;
	}
	try {
		const AudioCtor =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AudioCtor) {
			return;
		}
		if (!sharedAudioCtx) {
			sharedAudioCtx = new AudioCtor();
		}
		const ctx = sharedAudioCtx;
		if (ctx.state === "suspended") {
			void ctx.resume();
		}
		const now = ctx.currentTime;

		const playNote = (
			freq: number,
			startOffset: number,
			duration: number,
			gainPeak = 0.045,
			type: OscillatorType = "sine",
		) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = type;
			osc.frequency.setValueAtTime(freq, now + startOffset);
			gain.gain.setValueAtTime(0.0001, now + startOffset);
			gain.gain.exponentialRampToValueAtTime(gainPeak, now + startOffset + 0.018);
			gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + startOffset);
			osc.stop(now + startOffset + duration + 0.02);
		};

		if (kind === "select") {
			playNote(523.25, 0, 0.14, 0.035, "sine");
			playNote(659.25, 0.045, 0.16, 0.03, "triangle");
		} else if (kind === "start") {
			playNote(440, 0, 0.18, 0.04, "triangle");
			playNote(554.37, 0.06, 0.2, 0.04, "triangle");
			playNote(659.25, 0.12, 0.28, 0.048, "sine");
		} else if (kind === "vote") {
			playNote(587.33, 0, 0.14, 0.045, "triangle");
			playNote(880, 0.05, 0.22, 0.042, "sine");
		} else if (kind === "undo") {
			playNote(587.33, 0, 0.12, 0.035, "sine");
			playNote(440, 0.05, 0.16, 0.035, "sine");
		} else if (kind === "champion") {
			playNote(523.25, 0, 0.22, 0.048, "triangle");
			playNote(659.25, 0.08, 0.24, 0.048, "triangle");
			playNote(783.99, 0.16, 0.28, 0.05, "triangle");
			playNote(1046.5, 0.25, 0.45, 0.055, "sine");
		}
	} catch {
		// Ignore audio context restrictions
	}
}

/* ==========================================================================
   1. TOURNAMENT STATUS WIDGET (RETAINED FOR EXTERNAL CONSUMERS)
   ========================================================================== */

export interface TournamentStatusWidgetProps {
	namesCount: number;
	onRestart: () => void;
}

export function TournamentStatusWidget({ namesCount, onRestart }: TournamentStatusWidgetProps) {
	return (
		<div className="mx-auto mb-6 flex w-full max-w-4xl flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/85 p-3.5 sm:p-4 shadow-sm backdrop-blur-md">
			<div className="flex items-center gap-3 text-left w-full sm:w-auto">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
					<Trophy size={18} />
				</div>
				<div>
					<h4 className="text-sm font-semibold text-foreground">Tournament in Progress</h4>
					<p className="text-xs text-muted-foreground font-mono tabular-nums">
						{namesCount} contenders seeded
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
				<Button
					variant="ghost"
					size="small"
					onClick={onRestart}
					aria-label="Restart Tournament"
					className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5"
				>
					<RotateCcw size={13} />
					Restart Tournament
				</Button>
			</div>
		</div>
	);
}

/* ==========================================================================
   2. CONTINUOUS FLOATING ARENA & EXPANDING SANCTUARY STAGE
   ========================================================================== */

export const NameSelector = memo(function NameSelector({
	onTournamentComplete,
}: {
	onTournamentComplete?: (ratings: Record<string, RatingData>) => void;
}) {
	const isAdmin = useAppStore((state) => state.user.isAdmin);
	const userName = useAppStore((state) => state.user.name);

	const storeSelectedNames = useAppStore((state) => state.tournament.selectedNames);
	const storeTournamentNames = useAppStore((state) => state.tournament.names);
	const tournamentActions = useAppStore((state) => state.tournamentActions);

	const namesQuery = useQuery({
		...namesQueryOptions(isAdmin),
		retry: 2,
	});

	const error =
		namesQuery.error instanceof Error
			? namesQuery.error.message
			: namesQuery.error
				? "Failed to load names"
				: null;
	const isSupabaseUnavailable = error === SUPABASE_UNAVAILABLE_MSG;
	const names =
		namesQuery.data?.names && namesQuery.data.names.length > 0
			? namesQuery.data.names
			: DEFAULT_SAMPLE_NAMES;
	const isLoading = namesQuery.isPending && !namesQuery.data;

	const selectedIds = useMemo(
		() => new Set(storeSelectedNames.map((item) => String(item.id))),
		[storeSelectedNames],
	);

	const namesById = useMemo(() => createIdToNameMap(names), [names]);
	const availableNames = useMemo(() => getVisibleNames(names), [names]);
	const lockedInNames = useMemo(() => getLockedNames(names), [names]);

	// Active tournament contenders when a bracket has been started
	const activeTournamentNames = useMemo(
		() =>
			storeTournamentNames && storeTournamentNames.length >= 2
				? getVisibleNames(storeTournamentNames)
				: [],
		[storeTournamentNames],
	);
	const isTournamentActive = activeTournamentNames.length >= 2;

	const ts = useTournamentState(activeTournamentNames, userName || undefined);
	const { value: votingSide, setTimed: setVotingSide } = useTimedState<"left" | "right" | null>(
		null,
	);

	const hasNotifiedCompleteRef = useRef(false);
	useEffect(() => {
		if (!isTournamentActive || !ts.isComplete || ts.totalMatches === 0) {
			hasNotifiedCompleteRef.current = false;
			return;
		}
		if (!hasNotifiedCompleteRef.current) {
			hasNotifiedCompleteRef.current = true;
			playSanctuaryTone("champion");
			onTournamentComplete?.(normalizeRatingsWithStats(ts.ratings));
		}
	}, [isTournamentActive, ts.isComplete, ts.totalMatches, ts.ratings, onTournamentComplete]);

	useEffect(() => {
		if (lockedInNames.length === 0) {
			return;
		}
		const missingLocked = lockedInNames.filter((n) => !selectedIds.has(String(n.id)));
		if (missingLocked.length > 0) {
			tournamentActions.setSelection([...storeSelectedNames, ...missingLocked]);
		}
	}, [lockedInNames, storeSelectedNames, tournamentActions, selectedIds]);

	const handleToggleName = useCallback(
		(nameId: IdType) => {
			if (isTournamentActive && !ts.isComplete) {
				return;
			}
			if (ts.isComplete) {
				ts.handleQuit();
			}
			const nameItem = namesById.get(String(nameId));
			if (!nameItem || isNameLocked(nameItem)) {
				return;
			}
			hapticNavTap();
			playSanctuaryTone("select");
			const isCurrentlySelected = selectedIds.has(String(nameId));
			const nextSelection = isCurrentlySelected
				? storeSelectedNames.filter((n) => String(n.id) !== String(nameId))
				: [...storeSelectedNames, nameItem];
			tournamentActions.setSelection(nextSelection);
		},
		[isTournamentActive, ts, namesById, selectedIds, storeSelectedNames, tournamentActions],
	);

	// ⚡ Bolt Performance Optimization:
	// Wrapping the drift wall click handler in useCallback to prevent O(N) re-renders
	// on the DriftWall item list when the inline function reference would otherwise change.
	const handleDriftWallItemClick = useCallback(
		(item: DriftWallItem) => {
			handleToggleName(item.id as IdType);
		},
		[handleToggleName],
	);

	const handleBatchSelectNames = useCallback(
		(capturedItems: DriftWallItem[]) => {
			if (isTournamentActive && !ts.isComplete) {
				return;
			}
			if (ts.isComplete) {
				ts.handleQuit();
			}
			const additions = [];
			const seen = new Set(selectedIds);
			for (const item of capturedItems) {
				if (item.id === undefined) {
					continue;
				}
				const nameItem = namesById.get(String(item.id));
				if (nameItem && !isNameLocked(nameItem) && !seen.has(String(nameItem.id))) {
					seen.add(String(nameItem.id));
					additions.push(nameItem);
				}
			}
			if (additions.length > 0) {
				hapticNavTap();
				playSanctuaryTone("select");
				tournamentActions.setSelection([...storeSelectedNames, ...additions]);
			}
		},
		[isTournamentActive, ts, namesById, selectedIds, storeSelectedNames, tournamentActions],
	);

	const handleStartSelected = useCallback(() => {
		if (storeSelectedNames.length >= 2) {
			hapticNavTap();
			playSanctuaryTone("start");
			tournamentActions.setNames(storeSelectedNames);
		}
	}, [storeSelectedNames, tournamentActions]);

	const onVoteSide = useCallback(
		(side: "left" | "right") => {
			if (!isTournamentActive || !ts.currentMatch || ts.isVoting) {
				return;
			}
			hapticVoteTap(15);
			playSanctuaryTone("vote");
			setVotingSide(side, 290);
			const leftId = getMatchSideId(ts.currentMatch, "left");
			const rightId = getMatchSideId(ts.currentMatch, "right");
			ts.handleVoteWithAnimation(
				side === "left" ? leftId : rightId,
				side === "left" ? rightId : leftId,
			);
		},
		[isTournamentActive, ts, setVotingSide],
	);

	const handleUndoMove = useCallback(() => {
		if (!isTournamentActive || !ts.canUndo) {
			return;
		}
		hapticNavTap();
		playSanctuaryTone("undo");
		ts.handleUndo();
	}, [isTournamentActive, ts]);

	const handleExitTournament = useCallback(() => {
		hapticNavTap();
		ts.handleQuit();
	}, [ts]);

	// Keyboard voting (Left / Right arrows + U for Undo) right inside the floating arena
	useEffect(() => {
		if (!isTournamentActive) {
			return;
		}
		const handleKeyDown = (e: KeyboardEvent) => {
			if (ts.isVoting) {
				return;
			}
			if (e.key === "ArrowLeft" && ts.currentMatch && !ts.isComplete) {
				e.preventDefault();
				onVoteSide("left");
			} else if (e.key === "ArrowRight" && ts.currentMatch && !ts.isComplete) {
				e.preventDefault();
				onVoteSide("right");
			} else if ((e.key === "u" || e.key === "U") && ts.canUndo && !ts.isComplete) {
				e.preventDefault();
				handleUndoMove();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		isTournamentActive,
		ts.isVoting,
		ts.currentMatch,
		ts.isComplete,
		ts.canUndo,
		onVoteSide,
		handleUndoMove,
	]);

	// Compute tournament roster & eliminated name IDs
	const tournamentRosterIds = useMemo(
		() => new Set(activeTournamentNames.map((n) => String(n.id))),
		[activeTournamentNames],
	);

	const eliminatedNameIds = useMemo(() => {
		const set = new Set<string>();
		if (!isTournamentActive) {
			return set;
		}
		const teamsById = new Map(ts.teams.map((t) => [t.id, t]));
		for (const rec of ts.matchHistory) {
			if (!rec?.loser) {
				continue;
			}
			const loserId = String(rec.loser);
			const losingTeam = teamsById.get(loserId);
			if (losingTeam) {
				for (const memberId of losingTeam.memberIds) {
					set.add(String(memberId));
				}
			} else {
				set.add(loserId);
			}
		}
		return set;
	}, [isTournamentActive, ts.matchHistory, ts.teams]);

	// Map active dueling orb IDs to their Left / Right Duel Pedestal
	const activeDuelOrbMap = useMemo(() => {
		const map = new Map<string, { side: "left" | "right"; partnerIndex: number }>();
		if (!isTournamentActive || ts.isComplete || !ts.currentMatch) {
			return map;
		}
		const leftNorm = normalizeParticipant(ts.currentMatch.left);
		const rightNorm = normalizeParticipant(ts.currentMatch.right);
		leftNorm.memberIds.forEach((id, idx) => {
			map.set(String(id), { side: "left", partnerIndex: idx });
		});
		rightNorm.memberIds.forEach((id, idx) => {
			map.set(String(id), { side: "right", partnerIndex: idx });
		});
		return map;
	}, [isTournamentActive, ts.isComplete, ts.currentMatch]);

	// Derive tournament winner / champion info
	const championInfo = useMemo(() => {
		if (ts.matchHistory.length === 0) {
			return null;
		}
		const finalRecord = ts.matchHistory[ts.matchHistory.length - 1];
		const winnerId = finalRecord?.winner ? String(finalRecord.winner) : null;
		if (!winnerId) {
			return null;
		}
		const winningTeam = ts.teams.find((t) => t?.id === winnerId);
		const winningNameItem = winningTeam
			? undefined
			: activeTournamentNames.find((n) => String(n.id) === winnerId || n.name === winnerId);
		const label = winningTeam
			? winningTeam.memberNames.join(" & ")
			: winningNameItem?.name || winnerId;
		const memberIds = new Set<string>(winningTeam ? winningTeam.memberIds.map(String) : [winnerId]);
		return { winnerId, label, memberIds };
	}, [ts.matchHistory, ts.teams, activeTournamentNames]);

	// Derive tournament ranking map (rank 1, 2, 3...)
	const tournamentRankings = useMemo(() => {
		const map = new Map<string, number>();
		if (ts.matchHistory.length === 0 && Object.keys(ts.ratings).length === 0) {
			return map;
		}

		// Collect tournament participants and sort by rating/results
		const participants = activeTournamentNames.map((n) => ({
			id: String(n.id),
			name: n.name,
			rating: ts.ratings[String(n.id)] ?? n.rating ?? 1500,
			isChamp: Boolean(championInfo?.memberIds.has(String(n.id))),
		}));

		// Rank: Champion(s) first, then by rating descending
		participants.sort((a, b) => {
			if (a.isChamp && !b.isChamp) {
				return -1;
			}
			if (!a.isChamp && b.isChamp) {
				return 1;
			}
			return b.rating - a.rating;
		});

		participants.forEach((p, idx) => {
			map.set(p.id, p.isChamp ? 1 : idx + 1);
		});

		return map;
	}, [ts.matchHistory.length, ts.ratings, activeTournamentNames, championInfo]);

	// Build DriftWall items with continuous selection & duel state
	const driftWallItems = useMemo<DriftWallItem[]>(() => {
		return availableNames.map((nameItem) => {
			const idStr = String(nameItem.id);
			const subtitle = nameItem.description
				? nameItem.description
				: nameItem.pronunciation
					? `/${nameItem.pronunciation}/`
					: undefined;
			const rank = tournamentRankings.get(idStr);
			const isChamp = Boolean(championInfo?.memberIds.has(idStr));

			if (!isTournamentActive || ts.isComplete) {
				return {
					id: idStr,
					title: nameItem.name,
					subtitle,
					selected: selectedIds.has(idStr),
					locked: isNameLocked(nameItem),
					rank,
					isChampion: isChamp,
					duelSide: null,
					isQueuedSurvivor: false,
					isJustVotedWinner: false,
				};
			}

			const isSurvivor = tournamentRosterIds.has(idStr) && !eliminatedNameIds.has(idStr);
			const duelInfo = activeDuelOrbMap.get(idStr);
			const isQueued = isSurvivor && !duelInfo;
			const isJustVotedWinner = Boolean(duelInfo && votingSide && duelInfo.side === votingSide);

			return {
				id: idStr,
				title: nameItem.name,
				subtitle,
				selected: isSurvivor,
				locked: isNameLocked(nameItem),
				rank,
				duelSide: duelInfo?.side ?? null,
				duelPartnerIndex: duelInfo?.partnerIndex ?? 0,
				isChampion: false,
				isQueuedSurvivor: isQueued,
				isJustVotedWinner,
			};
		});
	}, [
		availableNames,
		isTournamentActive,
		selectedIds,
		tournamentRankings,
		championInfo,
		tournamentRosterIds,
		eliminatedNameIds,
		activeDuelOrbMap,
		ts.isComplete,
		votingSide,
	]);

	// Build the tournamentStage configuration for DriftWall's expanding Sanctuary Arena Stage
	const tournamentStageConfig = useMemo<DriftWallTournamentStage | null>(() => {
		if (!isTournamentActive || ts.isComplete) {
			return null;
		}
		const survivorCount = Array.from(tournamentRosterIds).filter(
			(id) => !eliminatedNameIds.has(id),
		).length;
		const queuedCount = Math.max(0, survivorCount - activeDuelOrbMap.size);

		const m = ts.currentMatch ? extractMatchData(ts.currentMatch) : null;
		const leftStreak = m ? getContestantStreak(m.leftId, ts.matchHistory) : 0;
		const rightStreak = m ? getContestantStreak(m.rightId, ts.matchHistory) : 0;

		return {
			active: true,
			isComplete: false,
			round: ts.round,
			totalRounds: ts.totalRounds,
			bracketStage: ts.bracketStage,
			matchNumber: ts.matchNumber,
			totalMatches: ts.totalMatches,
			progress: ts.progress,
			tournamentMode: ts.tournamentMode,
			leftLabel: m?.leftName ?? "Left",
			rightLabel: m?.rightName ?? "Right",
			leftSub: m?.leftDescription,
			rightSub: m?.rightDescription,
			leftElo: m ? (ts.ratings[m.leftId] ?? 1500) : undefined,
			rightElo: m ? (ts.ratings[m.rightId] ?? 1500) : undefined,
			leftStreak,
			rightStreak,
			votingSide,
			isVoting: ts.isVoting,
			queuedCount,
			onVoteSide,
		};
	}, [
		isTournamentActive,
		tournamentRosterIds,
		eliminatedNameIds,
		activeDuelOrbMap.size,
		ts.isComplete,
		ts.matchHistory,
		ts.round,
		ts.totalRounds,
		ts.bracketStage,
		ts.matchNumber,
		ts.totalMatches,
		ts.progress,
		ts.tournamentMode,
		ts.currentMatch,
		ts.ratings,
		ts.isVoting,
		votingSide,
		onVoteSide,
	]);

	if (isLoading) {
		return (
			<div className="w-full min-h-screen flex items-center justify-center">
				<Loading variant="spinner" text="Loading contenders..." />
			</div>
		);
	}

	if (error && !isSupabaseUnavailable && availableNames.length === 0) {
		return (
			<div className="w-full min-h-screen flex flex-col items-center justify-center text-center px-4">
				<div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 max-w-md space-y-4">
					<h3 className="font-display text-xl font-bold text-foreground">
						Could not load shortlist
					</h3>
					<p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
					<Button onClick={() => void namesQuery.refetch()} variant="outline" size="small">
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	const selectedCount = storeSelectedNames.length;
	const canStartCustom = selectedCount >= 2;

	const dockFooterControls = isTournamentActive ? (
		<div className="flex w-full items-center justify-between gap-3 sm:gap-4">
			<div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
				<span className="font-display text-sm sm:text-base font-bold tracking-tight text-foreground whitespace-nowrap shrink-0">
					Name Nosferatu
				</span>
				<span className="text-foreground/25 font-light" aria-hidden="true">
					&middot;
				</span>
				<div className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap truncate">
					{ts.isComplete ? (
						<span className="inline-flex items-center gap-1.5 font-semibold text-primary">
							<Trophy className="size-3.5" />
							<span>Champion: {championInfo?.label || "Complete"}</span>
						</span>
					) : (
						<span className="font-mono text-xs font-medium text-foreground/75 tabular-nums">
							Round {ts.round} &middot; Match {ts.matchNumber}/{ts.totalMatches}
						</span>
					)}
				</div>
			</div>

			<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
				{ts.isComplete ? (
					<>
						{selectedCount > 0 && (
							<button
								type="button"
								onClick={() => tournamentActions.setSelection([])}
								className="inline-flex h-8 sm:h-9 items-center gap-1 rounded-full border border-foreground/15 bg-foreground/6 px-2.5 sm:px-3 text-xs font-medium text-foreground/80 transition-colors hover:bg-foreground/12 hover:text-foreground active:scale-95 whitespace-nowrap shrink-0"
								aria-label="Clear selected names"
							>
								<X className="size-3" />
								<span>Clear</span>
							</button>
						)}
						<button
							type="button"
							onClick={handleExitTournament}
							className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-full bg-primary px-3 sm:px-3.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:brightness-105 active:scale-95 whitespace-nowrap shrink-0"
							aria-label="Start a new bracket"
						>
							<RotateCcw className="size-3" />
							<span>New Bracket</span>
						</button>
					</>
				) : (
					<>
						<button
							type="button"
							onClick={handleUndoMove}
							disabled={!ts.canUndo}
							className={`inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-full border px-2.5 sm:px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
								ts.canUndo
									? "border-foreground/15 bg-foreground/6 text-foreground/80 hover:bg-foreground/12 hover:text-foreground active:scale-95"
									: "cursor-not-allowed border-foreground/5 bg-foreground/2 text-foreground/25"
							}`}
							aria-label="Undo last vote"
						>
							<Undo2 className="size-3" />
							<span className="hidden sm:inline">Undo</span>
						</button>

						<button
							type="button"
							onClick={handleExitTournament}
							className="inline-flex h-8 sm:h-9 items-center gap-1 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 sm:px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 active:scale-95 whitespace-nowrap shrink-0"
							aria-label="Exit tournament"
						>
							<X className="size-3" />
							<span>Exit</span>
						</button>
					</>
				)}
			</div>
		</div>
	) : (
		<div className="flex w-full items-center justify-between gap-3 sm:gap-4">
			<div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
				{selectedCount === 0 ? (
					<div className="flex items-center gap-2 min-w-0">
						<span className="hidden sm:inline font-display text-sm sm:text-base font-bold tracking-tight text-foreground whitespace-nowrap shrink-0">
							Name Nosferatu
						</span>
						<span
							className="hidden sm:inline text-foreground/25 font-light shrink-0"
							aria-hidden="true"
						>
							&middot;
						</span>
						<span className="text-xs sm:text-sm text-foreground/80 font-medium truncate flex items-center gap-1.5">
							<MousePointerClick className="size-3.5 text-primary shrink-0" />
							<span>Click names or drag to select</span>
						</span>
					</div>
				) : (
					<>
						<span className="font-display text-sm sm:text-base font-bold tracking-tight text-foreground whitespace-nowrap shrink-0">
							Name Nosferatu
						</span>
						<span className="text-foreground/25 font-light" aria-hidden="true">
							&middot;
						</span>
						<span className="font-mono text-xs font-bold tabular-nums text-primary">
							{selectedCount} selected
						</span>
						{selectedCount === 1 && (
							<span className="hidden md:inline text-xs text-foreground/45 font-normal">
								(pick 1 more to duel)
							</span>
						)}
					</>
				)}
			</div>

			<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
				{selectedCount > 0 && (
					<button
						type="button"
						onClick={() => tournamentActions.setSelection([])}
						className="inline-flex h-8 sm:h-9 items-center gap-1 rounded-full border border-foreground/15 bg-foreground/6 px-2.5 sm:px-3 text-xs font-medium text-foreground/80 transition-colors hover:bg-foreground/12 hover:text-foreground active:scale-95 whitespace-nowrap shrink-0"
						aria-label="Clear selected names"
					>
						<X className="size-3" />
						<span>Clear</span>
					</button>
				)}

				{canStartCustom && (
					<button
						type="button"
						onClick={handleStartSelected}
						className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-full bg-primary px-3 sm:px-4 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:brightness-105 active:scale-95 whitespace-nowrap shrink-0"
					>
						<Play className="size-3 fill-current" />
						<span>Start</span>
						<span className="font-mono tabular-nums opacity-90">&middot; {selectedCount}</span>
					</button>
				)}
			</div>
		</div>
	);

	return (
		<div className="relative w-full min-h-screen overflow-hidden select-none flex flex-col">
			{availableNames.length > 0 && (
				<div className="absolute inset-0 w-full h-full overflow-hidden">
					<DriftWall
						items={driftWallItems}
						onItemClick={handleDriftWallItemClick}
						onItemsBatchSelect={handleBatchSelectNames}
						dockFooter={dockFooterControls}
						tournamentStage={tournamentStageConfig}
						columns={7}
						tileWidth={150}
						tileHeight={150}
						gap={22}
						radius={9999}
						perspective={1200}
						depth={120}
						speed={22}
						direction="up"
						variance={0.45}
						parallax={0.55}
						pauseOnHover={true}
						className="w-full h-full"
					/>
				</div>
			)}
		</div>
	);
});

export { TournamentArena };

/* ==========================================================================
   3. TOURNAMENT SETUP CONTAINER
   ========================================================================== */

export function TournamentSetup() {
	const { isComplete, ratings, userId, userName } = useTournamentSetupState();
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const hasSavedRef = useRef(false);

	const saveRatingsMutation = useMutation({
		mutationFn: ({ userId, ratings }: { userId: string; ratings: Record<string, RatingData> }) =>
			ratingsAPI.saveRatings(userId, ratings),
		onError: (error) => {
			console.error("Tournament ratings save failed:", error);
		},
	});

	useEffect(() => {
		if (!isComplete) {
			hasSavedRef.current = false;
			return;
		}
		if (hasSavedRef.current) {
			return;
		}
		if (Object.keys(ratings).length > 0) {
			hasSavedRef.current = true;
			const effectiveUserId = userId || userName || "anonymous";
			saveRatingsMutation.mutate({
				userId: effectiveUserId,
				ratings: normalizeRatingsWithStats(ratings),
			});
		}
	}, [isComplete, ratings, userId, userName, saveRatingsMutation.mutate]);

	const handleArenaComplete = useCallback(
		(completedRatings: Record<string, RatingData>) => {
			tournamentActions.completeTournament(completedRatings);
		},
		[tournamentActions],
	);

	return (
		<div className="w-full flex flex-col flex-1 min-h-screen">
			<NameSelector onTournamentComplete={handleArenaComplete} />
		</div>
	);
}
