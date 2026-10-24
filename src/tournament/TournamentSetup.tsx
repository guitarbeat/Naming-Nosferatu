import { useMutation, useQuery } from "@tanstack/react-query";
import { Layers, Moon, Play, RotateCcw, Sparkles, Sun, Trophy, Undo2, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { TournamentBracketModal } from "./TournamentBracket";
import { TournamentComplete } from "./TournamentComplete";
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
	const theme = useAppStore((state) => state.ui.theme);
	const setTheme = useAppStore((state) => state.uiActions.setTheme);
	const storeSelectedNames = useAppStore((state) => state.tournament.selectedNames);
	const storeTournamentNames = useAppStore((state) => state.tournament.names);
	const tournamentActions = useAppStore((state) => state.tournamentActions);

	const [bracketModalOpen, setBracketModalOpen] = useState(false);
	const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);

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
			if (isTournamentActive) {
				return;
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
		[isTournamentActive, namesById, selectedIds, storeSelectedNames, tournamentActions],
	);

	const handleBatchSelectNames = useCallback(
		(capturedItems: DriftWallItem[]) => {
			if (isTournamentActive) {
				return;
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
		[isTournamentActive, namesById, selectedIds, storeSelectedNames, tournamentActions],
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
		setBracketModalOpen(false);
		setBreakdownModalOpen(false);
		ts.handleQuit();
	}, [ts]);

	// Keyboard voting (Left / Right arrows + U for Undo) right inside the floating arena
	useEffect(() => {
		if (!isTournamentActive) {
			return;
		}
		const handleKeyDown = (e: KeyboardEvent) => {
			if (bracketModalOpen || breakdownModalOpen || ts.isVoting) {
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
		bracketModalOpen,
		breakdownModalOpen,
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

	// Build DriftWall items with continuous selection & duel state
	const driftWallItems = useMemo<DriftWallItem[]>(() => {
		return availableNames.map((nameItem) => {
			const idStr = String(nameItem.id);
			const subtitle = nameItem.description
				? nameItem.description
				: nameItem.pronunciation
					? `/${nameItem.pronunciation}/`
					: undefined;

			if (!isTournamentActive) {
				return {
					id: idStr,
					title: nameItem.name,
					subtitle,
					selected: selectedIds.has(idStr),
					locked: isNameLocked(nameItem),
					duelSide: null,
					isChampion: false,
					isQueuedSurvivor: false,
					isJustVotedWinner: false,
				};
			}

			const isSurvivor = tournamentRosterIds.has(idStr) && !eliminatedNameIds.has(idStr);
			const duelInfo = activeDuelOrbMap.get(idStr);
			const isChamp = ts.isComplete && isSurvivor;
			const isQueued = isSurvivor && !duelInfo && !isChamp;
			const isJustVotedWinner = Boolean(duelInfo && votingSide && duelInfo.side === votingSide);

			return {
				id: idStr,
				title: nameItem.name,
				subtitle,
				selected: isSurvivor,
				locked: isNameLocked(nameItem),
				duelSide: duelInfo?.side ?? null,
				duelPartnerIndex: duelInfo?.partnerIndex ?? 0,
				isChampion: isChamp,
				isQueuedSurvivor: isQueued,
				isJustVotedWinner,
			};
		});
	}, [
		availableNames,
		isTournamentActive,
		selectedIds,
		tournamentRosterIds,
		eliminatedNameIds,
		activeDuelOrbMap,
		ts.isComplete,
		votingSide,
	]);

	// Build the tournamentStage configuration for DriftWall's expanding Sanctuary Arena Stage
	const tournamentStageConfig = useMemo<DriftWallTournamentStage | null>(() => {
		if (!isTournamentActive) {
			return null;
		}
		const survivorCount = Array.from(tournamentRosterIds).filter(
			(id) => !eliminatedNameIds.has(id),
		).length;
		const queuedCount = Math.max(0, survivorCount - activeDuelOrbMap.size);

		if (ts.isComplete) {
			const winningRecord =
				ts.matchHistory.length > 0 ? ts.matchHistory[ts.matchHistory.length - 1] : null;
			const winnerId = winningRecord?.winner;
			const winningTeam = winnerId ? ts.teams.find((t) => t?.id === winnerId) : undefined;
			const winningNameItem = winnerId
				? activeTournamentNames.find(
						(n) => String(n.id) === String(winnerId) || n.name === String(winnerId),
					)
				: activeTournamentNames.find(
						(n) => tournamentRosterIds.has(String(n.id)) && !eliminatedNameIds.has(String(n.id)),
					);
			const championLabel = winningTeam
				? winningTeam.memberNames.join(" & ")
				: winningNameItem?.name || (winnerId ? String(winnerId) : "Champion");

			return {
				active: true,
				isComplete: true,
				round: ts.round,
				totalRounds: ts.totalRounds,
				bracketStage: ts.bracketStage,
				matchNumber: ts.matchNumber,
				totalMatches: ts.totalMatches,
				progress: 100,
				tournamentMode: ts.tournamentMode,
				championLabel,
				championSub: winningNameItem?.description,
				championElo: winnerId ? ts.ratings[String(winnerId)] : undefined,
				queuedCount: 0,
			};
		}

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
		ts.teams,
		activeTournamentNames,
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
	const modeLabel = selectedCount >= 4 && selectedCount % 4 === 0 ? "2v2 Teams" : "1v1 Bracket";
	const survivingCount = isTournamentActive
		? Array.from(tournamentRosterIds).filter((id) => !eliminatedNameIds.has(id)).length
		: selectedCount;

	const dockFooterControls = isTournamentActive ? (
		<div className="flex w-full items-center justify-between gap-2 sm:gap-4">
			<div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
				<span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-foreground whitespace-nowrap shrink-0">
					Name Nosferatu
				</span>
				<span className="h-4 w-px bg-foreground/20 shrink-0" aria-hidden="true" />
				<div className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap truncate">
					{ts.isComplete ? (
						<span className="inline-flex items-center gap-1.5 font-semibold text-primary">
							<Trophy className="size-3.5" />
							<span>Champion Crowned</span>
						</span>
					) : (
						<>
							<span className="font-mono font-bold tabular-nums text-primary">
								{survivingCount}
							</span>
							<span className="font-medium text-foreground/80">
								of {activeTournamentNames.length} surviving
							</span>
						</>
					)}
				</div>
			</div>

			<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
				<button
					type="button"
					onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
					className="inline-flex size-9 sm:size-10 items-center justify-center rounded-full border border-foreground/15 bg-foreground/8 text-foreground/80 transition-colors hover:bg-foreground/15 hover:text-foreground shrink-0"
					title={
						theme === "dark" ? "Switch to warm dusk light mode" : "Switch to nocturnal dark mode"
					}
					aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
				>
					{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
				</button>

				<button
					type="button"
					onClick={() => setBracketModalOpen(true)}
					className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full border border-primary/35 bg-primary/12 px-3 sm:px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary/22 whitespace-nowrap shrink-0"
					aria-label="Open interactive tournament bracket"
				>
					<Layers className="size-3.5" />
					<span>Bracket</span>
				</button>

				{ts.isComplete ? (
					<button
						type="button"
						onClick={() => setBreakdownModalOpen(true)}
						className="hidden sm:inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/15 px-3.5 text-xs font-semibold text-secondary transition-colors hover:bg-secondary/25 whitespace-nowrap shrink-0"
						aria-label="View full tournament summary"
					>
						<Sparkles className="size-3.5" />
						<span>Summary</span>
					</button>
				) : (
					<button
						type="button"
						onClick={handleUndoMove}
						disabled={!ts.canUndo}
						className={`inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full border px-3 sm:px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
							ts.canUndo
								? "border-foreground/20 bg-foreground/8 text-foreground/85 hover:bg-foreground/15"
								: "cursor-not-allowed border-foreground/10 bg-foreground/5 text-foreground/35"
						}`}
						aria-label="Undo last vote and recall orb"
					>
						<Undo2 className="size-3.5" />
						<span className="hidden sm:inline">Undo</span>
					</button>
				)}

				<button
					type="button"
					onClick={handleExitTournament}
					className={`inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full px-3.5 sm:px-4 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
						ts.isComplete
							? "bg-primary text-primary-foreground shadow-sm hover:brightness-105"
							: "border border-destructive/30 bg-destructive/12 text-destructive hover:bg-destructive/22"
					}`}
					aria-label={ts.isComplete ? "Start a new bracket" : "End current bracket"}
				>
					{ts.isComplete ? <RotateCcw className="size-3.5" /> : <X className="size-3.5" />}
					<span>{ts.isComplete ? "New Bracket" : "Exit"}</span>
				</button>
			</div>
		</div>
	) : (
		<div className="flex w-full items-center justify-between gap-3 sm:gap-5">
			<div className="flex items-center gap-3 min-w-0">
				<span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-foreground whitespace-nowrap shrink-0">
					Name Nosferatu
				</span>
				<span className="h-4 w-px bg-foreground/20 shrink-0" aria-hidden="true" />
				<div className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap truncate">
					{selectedCount > 0 ? (
						<>
							<span className="font-mono font-bold tabular-nums text-primary">{selectedCount}</span>
							<span className="font-medium text-foreground/85">in sanctuary</span>
							{canStartCustom ? (
								<>
									<span aria-hidden="true" className="hidden md:inline text-foreground/40">
										&middot;
									</span>
									<span className="hidden md:inline font-semibold text-secondary">{modeLabel}</span>
								</>
							) : (
								<>
									<span aria-hidden="true" className="text-foreground/40">
										&middot;
									</span>
									<span className="font-medium text-foreground/65">Choose 1 more to start</span>
								</>
							)}
						</>
					) : (
						<span className="font-medium text-foreground/75">
							Drag a box or tap orbs to choose names
						</span>
					)}
				</div>
			</div>

			<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
				<button
					type="button"
					onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
					className="inline-flex size-9 sm:size-10 items-center justify-center rounded-full border border-foreground/15 bg-foreground/8 text-foreground/80 transition-colors hover:bg-foreground/15 hover:text-foreground shrink-0"
					title={
						theme === "dark" ? "Switch to warm dusk light mode" : "Switch to nocturnal dark mode"
					}
					aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
				>
					{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
				</button>

				{selectedCount > 0 && (
					<button
						type="button"
						onClick={() => tournamentActions.setSelection([])}
						className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-foreground/10 hover:text-foreground whitespace-nowrap shrink-0"
						aria-label="Clear selected names"
					>
						<X className="size-3.5" />
						<span>Clear</span>
					</button>
				)}

				{canStartCustom && (
					<button
						type="button"
						onClick={handleStartSelected}
						className="inline-flex h-9 sm:h-10 items-center gap-2 rounded-full bg-primary px-4 sm:px-5 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm transition-all duration-150 hover:brightness-105 active:scale-[0.98] whitespace-nowrap shrink-0"
					>
						<Play className="size-3.5 fill-current" />
						<span>Start Bracket</span>
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
						onItemClick={(item) => handleToggleName(item.id as IdType)}
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

			{/* Interactive Bracket Tree Modal */}
			{isTournamentActive && (
				<TournamentBracketModal
					isOpen={bracketModalOpen}
					onClose={() => setBracketModalOpen(false)}
					bracketEntrants={ts.bracketEntrants}
					matchHistory={ts.matchHistory}
					currentMatch={ts.currentMatch}
					names={activeTournamentNames}
					teams={ts.teams}
					ratings={ts.ratings}
					totalRounds={ts.totalRounds}
					tournamentMode={ts.tournamentMode}
					onVote={(w, l) => ts.handleVote(w, l)}
				/>
			)}

			{/* Full Summary Breakdown Modal */}
			{isTournamentActive && breakdownModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md"
					role="dialog"
					aria-modal="true"
					aria-label="Tournament Summary Modal"
				>
					<div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xl">
						<button
							type="button"
							onClick={() => setBreakdownModalOpen(false)}
							className="sticky top-2 float-right z-20 inline-flex size-9 items-center justify-center rounded-full border border-border/50 bg-background/80 text-foreground hover:bg-muted"
							aria-label="Close summary modal"
						>
							<X className="size-4" />
						</button>
						<TournamentComplete
							totalMatches={ts.totalMatches}
							participantCount={activeTournamentNames.length}
							onNewTournament={handleExitTournament}
							bracketEntrants={ts.bracketEntrants}
							matchHistory={ts.matchHistory}
							names={activeTournamentNames}
							teams={ts.teams}
							ratings={ts.ratings}
							totalRounds={ts.totalRounds}
							tournamentMode={ts.tournamentMode}
						/>
					</div>
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
