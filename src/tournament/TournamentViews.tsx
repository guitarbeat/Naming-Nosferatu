import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
	Check,
	Clock,
	Flame,
	Gamepad2,
	Layers,
	LogOut,
	RotateCcw,
	Trophy,
	Undo2,
	X,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import {
	memo,
	type SyntheticEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button, Card, CatImage, Loading } from "@/components/AppChrome";
import { MagicToolbar } from "@/components/MagicControls";
import { DriftWall, type DriftWallItem } from "@/components/VisualEffects";
import { useDebounce, useInertiaScroll, useTimedState, useTournamentState } from "@/hooks";
import { namesQueryOptions, ratingsAPI, SUPABASE_UNAVAILABLE_MSG } from "@/lib/api";
import {
	DEFAULT_SAMPLE_NAMES,
	fadeMotionPreset,
	getLockedNames,
	getRandomCatImage,
	getVisibleNames,
	hapticNavTap,
	hapticVoteTap,
	isNameLocked,
	MOTION_DURATIONS,
	normalizeRatingsWithStats,
} from "@/lib/utils";
import useAppStore, { useTournamentSetupState } from "@/store";
import type {
	IdType,
	Match,
	MatchRecord,
	NameItem,
	RatingData,
	Team,
	TournamentMode,
	TournamentProps,
} from "@/types";
import {
	areMatchNodePropsEqual,
	createIdToNameMap,
	deriveVisualBracketTree,
	extractMatchData,
	getContestantStreak,
	getFlameCount,
	getHeatCardClasses,
	getHeatGradientClasses,
	getHeatLevel,
	getHeatTextClasses,
	getMatchSideId,
	type HeatLevel,
	STREAK_THRESHOLDS,
	type VisualContender,
	type VisualMatch,
} from "./tournamentEngine";

const handleImgError = (e: SyntheticEvent<HTMLImageElement>) => {
	e.currentTarget.style.display = "none";
};

/* ==========================================================================
   1. BRACKET TREE & TOURNAMENT HEADER
   ========================================================================== */

function getRoundCaption(stageRound: number, totalRounds: number): string {
	if (stageRound === totalRounds) {
		return "Final";
	}
	if (stageRound === totalRounds - 1) {
		return "Semi";
	}
	if (stageRound === totalRounds - 2) {
		return "Quarter";
	}
	return `R${stageRound}`;
}

function getStageFlavor(round: number, totalRounds: number): string {
	if (round >= totalRounds) {
		return "Finals";
	}
	if (totalRounds - round === 1) {
		return "Semifinals";
	}
	if (round <= 2) {
		return "Preliminary Rounds";
	}
	return "Middle Rounds";
}

export function BracketTree({
	round,
	totalRounds,
	onOpenBracket,
}: {
	round: number;
	totalRounds: number;
	onOpenBracket?: () => void;
}) {
	const rounds = useMemo(
		() => Array.from({ length: Math.max(1, totalRounds) }, (_, i) => i + 1),
		[totalRounds],
	);
	const stageFlavor = useMemo(() => getStageFlavor(round, totalRounds), [round, totalRounds]);

	const content = (
		<div className="flex items-center gap-1 overflow-x-auto pb-1">
			{rounds.map((stageRound, index) => {
				const isDone = stageRound < round;
				const isActive = stageRound === round;
				const tone = isActive
					? "border-primary/70 bg-primary/20 text-primary shadow-[0_0_18px_rgba(166,94,237,0.45)]"
					: isDone
						? "border-chart-2/45 bg-chart-2/10 text-chart-2"
						: "border-border/20 bg-foreground/5 text-muted-foreground";

				return (
					<div key={`bracket-round-${stageRound}`} className="flex items-center gap-1">
						<div className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${tone}`}>
							{getRoundCaption(stageRound, totalRounds)}
							{isActive ? " ✦" : ""}
						</div>
						{index < rounds.length - 1 && (
							<div
								className={`h-[1px] w-4 sm:w-6 ${
									isDone ? "bg-chart-2/70" : isActive ? "bg-primary/70" : "bg-border/20"
								}`}
							/>
						)}
					</div>
				);
			})}
		</div>
	);

	if (onOpenBracket) {
		return (
			<button
				type="button"
				onClick={onOpenBracket}
				className="w-full text-left rounded-xl border border-border/15 bg-foreground/[0.03] px-3 py-2 transition-all cursor-pointer hover:border-primary/40 hover:bg-foreground/[0.06] group/bracket focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
				title="Click to view full interactive tournament bracket"
				aria-label="Open full interactive tournament bracket"
				aria-haspopup="dialog"
			>
				<div className="mb-2 flex items-center justify-between text-[10px] tracking-wide text-muted-foreground">
					<span className="flex items-center gap-1">
						<Layers className="size-3 text-primary" />
						<span>Bracket Path</span>
						<span className="text-[9px] text-primary underline underline-offset-2 opacity-0 group-hover/bracket:opacity-100 transition-opacity">
							(Click to expand)
						</span>
					</span>
					<span>{stageFlavor}</span>
				</div>
				{content}
			</button>
		);
	}

	return (
		<div className="rounded-xl border border-border/15 bg-foreground/[0.03] px-3 py-2 transition-all">
			<div className="mb-2 flex items-center justify-between text-[10px] tracking-wide text-muted-foreground">
				<span className="flex items-center gap-1">
					<Layers className="size-3 text-primary" />
					<span>Bracket Path</span>
				</span>
				<span>{stageFlavor}</span>
			</div>
			{content}
		</div>
	);
}

export interface TournamentHeaderProps {
	roundNumber: number;
	totalRounds: number;
	bracketStage: string;
	tournamentMode: string;
	currentMatchNumber: number;
	totalMatches: number;
	etaMinutes: number;
	canUndo: boolean;
	handleUndo: () => void;
	quitTournament: () => void;
	onOpenBracket?: () => void;
	progressWidth: number;
	stageHeadline: string;
	dominantStreak: { name: string; streak: number; heatLevel: HeatLevel } | null;
	matchupTone: string;
	pressureCopy: string;
	matchesRemaining: number;
	roundMatchesLeft: number;
}

export const TournamentHeader = memo(function TournamentHeader({
	roundNumber,
	totalRounds,
	bracketStage,
	tournamentMode,
	currentMatchNumber,
	totalMatches,
	etaMinutes,
	canUndo,
	handleUndo,
	quitTournament,
	onOpenBracket,
	progressWidth,
	stageHeadline: _stageHeadline,
	dominantStreak,
	matchupTone,
	pressureCopy,
}: TournamentHeaderProps) {
	return (
		<header className="px-2 pt-2 sm:px-4 sm:pt-4">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-2xl border border-border/40 bg-card/75 p-3.5 sm:p-4 shadow-lg backdrop-blur-xl">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-xl border border-border/50 bg-secondary/40 text-primary shadow-xs">
							<Gamepad2 className="size-4" />
						</div>
						<div className="space-y-0.5">
							<div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground">
								<span>Round {roundNumber}</span>
								<span className="text-muted-foreground" aria-hidden="true">
									&middot;
								</span>
								<span>{bracketStage}</span>
								<span className="text-muted-foreground" aria-hidden="true">
									&middot;
								</span>
								<span>{tournamentMode === "2v2" ? "2v2 Teams" : "1v1 Head-to-Head"}</span>
							</div>
							<div className="flex items-baseline gap-2">
								<h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
									Match{" "}
									<span className="font-mono tabular-nums text-primary">{currentMatchNumber}</span>{" "}
									of <span className="font-mono tabular-nums">{totalMatches}</span>
								</h2>
								{etaMinutes > 0 && (
									<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
										<Clock className="size-3" />
										<span className="font-mono tabular-nums">{etaMinutes}m</span> left
									</span>
								)}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-1.5 sm:gap-2">
						{onOpenBracket && (
							<button
								type="button"
								onClick={onOpenBracket}
								className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 text-xs font-semibold text-primary transition-all duration-[300ms] ease-spring hover:bg-primary/20 hover:-translate-y-0.5 active:scale-[0.93] shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
								aria-label="View tournament bracket tree"
								title="View tournament bracket"
							>
								<Layers className="size-3.5" />
								<span>Bracket</span>
							</button>
						)}

						<button
							type="button"
							onClick={() => handleUndo()}
							disabled={!canUndo}
							className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-all duration-[300ms] ease-spring active:scale-[0.93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
								canUndo
									? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:-translate-y-0.5 cursor-pointer"
									: "cursor-not-allowed border-border/30 bg-secondary/10 text-muted-foreground opacity-60"
							}`}
							aria-label="Undo last vote"
							title={canUndo ? "Undo last vote (Press U)" : "No votes to undo"}
						>
							<Undo2 className="size-3.5" />
							<span className="hidden sm:inline">Undo</span>
						</button>

						<button
							type="button"
							onClick={quitTournament}
							className="inline-flex h-9 items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-4 text-xs font-medium text-destructive transition-all duration-[300ms] ease-spring hover:bg-destructive/20 hover:-translate-y-0.5 active:scale-[0.93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
							aria-label="Exit tournament"
							title="Exit tournament"
						>
							<X className="size-3.5" />
							<span className="hidden sm:inline">Exit</span>
						</button>
					</div>
				</div>

				<div className="space-y-2">
					<div
						className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50"
						role="progressbar"
						aria-label="Tournament progress"
						aria-valuenow={Math.round(progressWidth)}
						aria-valuemin={0}
						aria-valuemax={100}
					>
						<div
							className="h-full rounded-full bg-primary transition-all duration-500 ease-out shadow-[0_0_12px_hsl(var(--pw-sage-hsl)/0.5)]"
							style={{ width: `${progressWidth}%` }}
						/>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
						<div className="flex flex-wrap items-center gap-2 text-muted-foreground">
							<span className="inline-flex items-center rounded-full border border-border/40 bg-secondary/30 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80">
								{matchupTone}
							</span>
							<span className="hidden md:inline text-muted-foreground">&middot;</span>
							<span className="hidden md:inline text-muted-foreground">{pressureCopy}</span>
						</div>

						{dominantStreak && (
							<span
								className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${getHeatTextClasses(
									dominantStreak.heatLevel,
								)}`}
							>
								<span className="rounded-full bg-foreground/10 px-1 py-0.2 text-[9px]">HOT</span>
								<span>
									{dominantStreak.name} &times;{dominantStreak.streak}
								</span>
							</span>
						)}
					</div>

					<div className="hidden sm:block pt-1">
						<BracketTree
							round={roundNumber}
							totalRounds={totalRounds}
							onOpenBracket={onOpenBracket}
						/>
					</div>
				</div>
			</div>
		</header>
	);
});

/* ==========================================================================
   2. TOURNAMENT STATUS WIDGET
   ========================================================================== */

export interface TournamentStatusWidgetProps {
	namesCount: number;
	onRestart: () => void;
}

export function TournamentStatusWidget({ namesCount, onRestart }: TournamentStatusWidgetProps) {
	return (
		<div className="mx-auto mb-6 flex w-full max-w-4xl flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/80 p-3.5 sm:p-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 group cursor-default">
			<div className="flex items-center gap-3 text-left w-full sm:w-auto">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:scale-110 group-hover:bg-primary/25 transition-transform duration-300">
					<Trophy size={18} />
				</div>
				<div>
					<h4 className="text-sm font-semibold text-foreground">Tournament in Progress</h4>
					<p className="text-xs text-muted-foreground">{namesCount} contenders seeded</p>
				</div>
			</div>
			<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
				<Button
					variant="ghost"
					size="small"
					onClick={() => {
						if (
							window.confirm(
								"Are you sure you want to restart the tournament? Your current progress will be lost.",
							)
						) {
							onRestart();
						}
					}}
					aria-label="Restart Tournament"
					className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5"
				>
					<RotateCcw
						size={13}
						className="group-hover/btn:-rotate-90 transition-transform duration-500"
					/>
					Restart Tournament
				</Button>
			</div>
		</div>
	);
}

/* ==========================================================================
   3. TOURNAMENT BRACKET & MODAL
   ========================================================================== */

export interface TournamentBracketProps {
	bracketEntrants?: string[];
	matchHistory?: MatchRecord[];
	currentMatch?: Match | null;
	names?: NameItem[];
	teams?: Team[];
	ratings?: Record<string, number>;
	totalRounds?: number;
	tournamentMode?: TournamentMode;
	isComplete?: boolean;
	onVote?: (winnerId: string, loserId: string) => void;
	onClose?: () => void;
	isModal?: boolean;
	inline?: boolean;
	className?: string;
}

const ContenderRow = memo(function ContenderRow({
	contender,
	placeholderText,
	isWinner = false,
	isLoser = false,
	isLive = false,
	isHighlighted = false,
	onSelect,
	onVote,
}: {
	contender: VisualContender | null;
	placeholderText?: string;
	isWinner?: boolean;
	isLoser?: boolean;
	isLive?: boolean;
	isHighlighted?: boolean;
	onSelect?: () => void;
	onVote?: () => void;
}) {
	if (!contender) {
		return (
			<div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground/60 italic border-b border-border/10 last:border-b-0 min-h-[38px]">
				<span className="size-5 rounded-full bg-border/20 shrink-0 flex items-center justify-center text-[10px] text-muted-foreground/50">
					?
				</span>
				<span className="truncate">{placeholderText || "TBD"}</span>
			</div>
		);
	}

	const isBye = contender.isBye;
	const streak = contender.streak ?? 0;
	const _flameCount = Math.min(getFlameCount(streak), 3);

	return (
		<div
			className={`flex items-center justify-between gap-2 px-3 py-1.5 text-xs transition-colors border-b border-border/10 last:border-b-0 min-h-[38px] group ${
				isWinner
					? "bg-primary/10 text-foreground font-semibold"
					: isLoser
						? "opacity-50 line-through text-muted-foreground"
						: isLive
							? "bg-accent/10 font-medium"
							: ""
			} ${isHighlighted ? "ring-2 ring-primary/60 bg-primary/15" : ""}`}
		>
			<button
				type="button"
				onClick={onSelect}
				className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer focus-visible:outline-none"
			>
				{contender.avatarUrl ? (
					<img
						src={contender.avatarUrl}
						alt=""
						className="size-5 rounded-full object-cover shrink-0 border border-white/20"
						onError={handleImgError}
					/>
				) : (
					<span
						className={`size-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
							isBye ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary"
						}`}
					>
						{isBye ? "-" : (contender.name[0] || "C").toUpperCase()}
					</span>
				)}

				<span className="truncate flex-1 font-medium text-foreground">{contender.name}</span>

				{streak >= STREAK_THRESHOLDS.warm && (
					<span className="flex items-center gap-0.5 text-orange-400 text-[10px] font-bold shrink-0">
						<Flame className="size-3 fill-orange-400" />
						{streak}
					</span>
				)}

				{contender.seed && (
					<span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
						#{contender.seed}
					</span>
				)}
			</button>

			{isLive && onVote && !isBye && (
				<Button
					size="small"
					variant="primary"
					onClick={onVote}
					className="h-6 px-2 text-[10px] shrink-0 font-bold"
					title={`Vote for ${contender.name}`}
				>
					Vote
				</Button>
			)}

			{isWinner && !isLive && <Check className="size-3.5 text-primary shrink-0 font-bold" />}
		</div>
	);
});

const MatchCard = memo(function MatchCard({
	match,
	highlightedContenderId,
	onSelectMatch: _onSelectMatch,
	onSelectContender,
	onVoteForSide,
}: {
	match: VisualMatch;
	highlightedContenderId?: string | null;
	onSelectMatch?: (match: VisualMatch) => void;
	onSelectContender?: (id: string) => void;
	onVoteForSide?: (side: "left" | "right") => void;
}) {
	const isLive = match.status === "active";
	const isByeMatch = match.status === "bye";

	return (
		<div
			className={`w-60 sm:w-64 rounded-xl border transition-all duration-300 overflow-hidden shadow-xs ${
				isLive
					? "border-primary/80 ring-2 ring-primary/40 shadow-md bg-card/95"
					: isByeMatch
						? "border-border/30 opacity-70 bg-card/50"
						: match.status === "completed"
							? "border-border/60 bg-card/80"
							: "border-border/30 bg-card/40"
			}`}
		>
			<div className="flex items-center justify-between px-3 py-1 bg-muted/20 border-b border-border/10 text-[10px] text-muted-foreground font-mono">
				<span>
					{match.roundName} &middot; M{match.matchIndex + 1}
				</span>
				{isLive && (
					<span className="flex items-center gap-1 text-primary font-bold animate-pulse">
						<span className="size-1.5 rounded-full bg-primary" /> LIVE
					</span>
				)}
			</div>

			<div>
				<ContenderRow
					contender={match.contender1}
					placeholderText={match.placeholder1Text}
					isWinner={match.winnerId === match.contender1?.id}
					isLoser={match.loserId === match.contender1?.id}
					isLive={isLive}
					isHighlighted={
						Boolean(highlightedContenderId) && match.contender1?.id === highlightedContenderId
					}
					onSelect={() => match.contender1 && onSelectContender?.(match.contender1.id)}
					onVote={() => onVoteForSide?.("left")}
				/>
				<ContenderRow
					contender={match.contender2}
					placeholderText={match.placeholder2Text}
					isWinner={match.winnerId === match.contender2?.id}
					isLoser={match.loserId === match.contender2?.id}
					isLive={isLive}
					isHighlighted={
						Boolean(highlightedContenderId) && match.contender2?.id === highlightedContenderId
					}
					onSelect={() => match.contender2 && onSelectContender?.(match.contender2.id)}
					onVote={() => onVoteForSide?.("right")}
				/>
			</div>
		</div>
	);
}, areMatchNodePropsEqual);

export const TournamentBracket = memo(function TournamentBracket({
	bracketEntrants = [],
	matchHistory = [],
	currentMatch,
	names = [],
	teams = [],
	ratings = {},
	totalRounds: passedTotalRounds,
	tournamentMode = "1v1",
	isComplete: _isComplete = false,
	onVote,
	onClose,
	isModal = false,
	inline: _inline = false,
	className = "",
}: TournamentBracketProps) {
	const [viewMode, setViewMode] = useState<"tree" | "cards">("tree");
	const [searchQuery, setSearchQuery] = useState("");
	const [zoom, setZoom] = useState(1);
	const [highlightedContenderId, setHighlightedContenderId] = useState<string | null>(null);

	const debouncedSearch = useDebounce(searchQuery, 200);

	const bracketTree = useMemo(
		() =>
			deriveVisualBracketTree({
				bracketEntrants,
				matchHistory,
				currentMatch,
				names,
				teams,
				ratings,
				totalRounds: passedTotalRounds,
				tournamentMode,
			}),
		[
			bracketEntrants,
			matchHistory,
			currentMatch,
			names,
			teams,
			ratings,
			passedTotalRounds,
			tournamentMode,
		],
	);

	useEffect(() => {
		if (!debouncedSearch.trim()) {
			setHighlightedContenderId(null);
			return;
		}
		const term = debouncedSearch.trim().toLowerCase();
		for (const round of bracketTree.rounds) {
			for (const match of round.matches) {
				if (match.contender1?.name.toLowerCase().includes(term)) {
					setHighlightedContenderId(match.contender1.id);
					return;
				}
				if (match.contender2?.name.toLowerCase().includes(term)) {
					setHighlightedContenderId(match.contender2.id);
					return;
				}
			}
		}
	}, [debouncedSearch, bracketTree]);

	const handleVoteForSide = useCallback(
		(match: VisualMatch, side: "left" | "right") => {
			if (!onVote) {
				return;
			}
			const leftId = match.contender1?.id;
			const rightId = match.contender2?.id;
			if (!leftId || !rightId) {
				return;
			}
			if (side === "left") {
				onVote(leftId, rightId);
			} else {
				onVote(rightId, leftId);
			}
		},
		[onVote],
	);

	return (
		<div className={`w-full flex flex-col gap-4 ${className}`}>
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-2">
				<MagicToolbar
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					viewMode={viewMode}
					setViewMode={setViewMode}
				/>

				<div className="flex items-center gap-2 justify-end">
					<Button
						variant="outline"
						size="icon"
						onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
						title="Zoom Out"
						aria-label="Zoom Out"
					>
						<ZoomOut className="size-4" />
					</Button>
					<span className="text-xs font-mono tabular-nums text-muted-foreground w-12 text-center">
						{Math.round(zoom * 100)}%
					</span>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
						title="Zoom In"
						aria-label="Zoom In"
					>
						<ZoomIn className="size-4" />
					</Button>

					{onClose && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							title="Close bracket view"
							aria-label="Close bracket view"
						>
							<X className="size-4" />
						</Button>
					)}
				</div>
			</div>

			<div
				className="w-full overflow-x-auto overflow-y-auto min-h-[420px] p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md"
				style={{ maxHeight: isModal ? "calc(85vh - 120px)" : "600px" }}
			>
				<div
					style={{
						transform: `scale(${zoom})`,
						transformOrigin: "top left",
						transition: "transform 0.15s ease-out",
					}}
					className="flex gap-8 items-start min-w-max pb-4"
				>
					{bracketTree.rounds.map((round) => (
						<div key={`round-${round.roundNumber}`} className="flex flex-col gap-4">
							<div className="text-center font-display font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border/20 pb-2">
								{round.roundName}
							</div>
							<div className="flex flex-col justify-around gap-6 flex-1">
								{round.matches.map((match) => (
									<MatchCard
										key={match.id}
										match={match}
										highlightedContenderId={highlightedContenderId}
										onSelectContender={(id) =>
											setHighlightedContenderId((curr) => (curr === id ? null : id))
										}
										onVoteForSide={(side) => handleVoteForSide(match, side)}
									/>
								))}
							</div>
						</div>
					))}

					{bracketTree.champion && (
						<div className="flex flex-col gap-4 items-center pl-4 border-l border-primary/20">
							<div className="text-center font-display font-bold text-xs uppercase tracking-wider text-primary border-b border-primary/20 pb-2">
								Champion
							</div>
							<div className="w-56 p-4 rounded-2xl border-2 border-primary bg-primary/10 shadow-lg text-center flex flex-col items-center gap-3">
								<Trophy className="size-8 text-primary animate-bounce" />
								{bracketTree.champion.avatarUrl && (
									<img
										src={bracketTree.champion.avatarUrl}
										alt=""
										className="size-16 rounded-full object-cover border-2 border-primary shadow-md"
										onError={handleImgError}
									/>
								)}
								<div>
									<h4 className="font-display font-black text-lg text-foreground">
										{bracketTree.champion.name}
									</h4>
									{bracketTree.champion.description && (
										<p className="text-xs text-muted-foreground mt-1 italic">
											{bracketTree.champion.description}
										</p>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
});

export function TournamentBracketModal({
	isOpen,
	onClose,
	...props
}: TournamentBracketProps & { isOpen: boolean; onClose: () => void }) {
	if (!isOpen) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in"
			role="dialog"
			aria-modal="true"
			aria-label="Tournament Bracket Modal"
		>
			<div className="w-full max-w-6xl max-h-[90vh] bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-4 sm:p-6">
				<div className="flex items-center justify-between pb-3 border-b border-border/20">
					<div className="flex items-center gap-2 font-display font-bold text-lg text-foreground">
						<Layers className="size-5 text-primary" />
						<span>Tournament Bracket</span>
					</div>
					<Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
						<X className="size-5" />
					</Button>
				</div>
				<div className="flex-1 overflow-auto pt-4">
					<TournamentBracket isModal={true} onClose={onClose} {...props} />
				</div>
			</div>
		</div>
	);
}

/* ==========================================================================
   4. TOURNAMENT COMPLETE
   ========================================================================== */

export interface TournamentCompleteProps {
	totalMatches: number;
	participantCount: number;
	onNewTournament: () => void;
	bracketEntrants?: string[];
	matchHistory?: MatchRecord[];
	names?: NameItem[];
	teams?: Team[];
	ratings?: Record<string, number>;
	totalRounds?: number;
	tournamentMode?: TournamentMode;
}

export function TournamentComplete({
	totalMatches,
	participantCount,
	onNewTournament,
	bracketEntrants = [],
	matchHistory = [],
	names = [],
	teams = [],
	ratings = {},
	totalRounds,
	tournamentMode = "1v1",
}: TournamentCompleteProps) {
	const winningRecord = matchHistory.length > 0 ? matchHistory[matchHistory.length - 1] : null;
	const winnerId = winningRecord?.winner;

	const winningTeam = winnerId ? teams.find((t) => t?.id === winnerId) : undefined;
	const winningNameItem = winnerId
		? names.find((n) => n && (String(n.id) === String(winnerId) || n.name === String(winnerId)))
		: undefined;

	const winnerDisplayName = winningTeam
		? winningTeam.memberNames.join(" & ")
		: winningNameItem?.name || (winnerId ? String(winnerId) : null);

	return (
		<div className="relative flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden py-12 text-foreground">
			<div className="relative z-10 flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-6">
				<div className="mb-6 flex size-20 items-center justify-center rounded-[2rem] border border-primary/20 bg-card shadow-[0_0_40px_var(--primary)] backdrop-blur-xl">
					<Trophy className="size-9 text-primary" />
				</div>

				<p className="text-[11px] font-semibold tracking-wide text-muted-foreground">
					Tournament finished
				</p>

				<h1 className="mt-2 max-w-4xl text-pretty font-display text-[clamp(2.5rem,8vw,5.5rem)] font-black uppercase leading-[0.9] tracking-[-0.05em] text-foreground drop-shadow-[0_2px_20px_var(--primary)]">
					Tournament Complete
				</h1>

				{winnerDisplayName && (
					<div className="mt-4 flex flex-col items-center rounded-2xl border border-primary/30 bg-primary/10 px-6 py-3 shadow-md backdrop-blur-md">
						<span className="text-[11px] font-bold uppercase tracking-wider text-primary">
							Winner
						</span>
						<span className="mt-0.5 font-display text-2xl sm:text-3xl font-black text-foreground">
							{winnerDisplayName}
						</span>
						{winningNameItem?.description && (
							<p className="mt-1 text-xs text-muted-foreground italic max-w-md">
								{winningNameItem.description}
							</p>
						)}
					</div>
				)}

				<p className="mt-3 max-w-xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
					The tournament is complete. Review the final bracket and rankings below.
				</p>

				<div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
					<Card className="px-6 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.05)] bg-card/80">
						<p className="text-[10px] font-semibold tracking-wide text-muted-foreground">
							Total matches
						</p>
						<p className="mt-2 text-3xl font-black leading-none text-foreground">{totalMatches}</p>
					</Card>
					<Card className="px-6 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.05)] bg-card/80">
						<p className="text-[10px] font-semibold tracking-wide text-muted-foreground">
							Participants
						</p>
						<p className="mt-2 text-3xl font-black leading-none text-foreground">
							{participantCount}
						</p>
					</Card>
				</div>

				{bracketEntrants.length > 0 && (
					<div className="mt-10 w-full text-left">
						<TournamentBracket
							inline={true}
							isComplete={true}
							bracketEntrants={bracketEntrants}
							matchHistory={matchHistory}
							names={names}
							teams={teams}
							ratings={ratings}
							totalRounds={totalRounds}
							tournamentMode={tournamentMode}
							className="shadow-2xl border-primary/20 bg-card/70 backdrop-blur-xl"
						/>
					</div>
				)}

				<div className="mt-8 flex w-full max-w-sm justify-center">
					<Button
						variant="primary"
						size="large"
						onClick={onNewTournament}
						className="w-full flex justify-center gap-2.5 rounded-full shadow-lg"
					>
						<LogOut size={15} />
						Start New Tournament
					</Button>
				</div>
			</div>
		</div>
	);
}

/* ==========================================================================
   5. NAME SELECTOR
   ========================================================================== */

export const NameSelector = memo(function NameSelector() {
	const isAdmin = useAppStore((state) => state.user.isAdmin);
	const storeSelectedNames = useAppStore((state) => state.tournament.selectedNames);
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
		() => new Set(storeSelectedNames.map((item) => item.id)),
		[storeSelectedNames],
	);

	const namesById = useMemo(() => createIdToNameMap(names), [names]);
	const availableNames = useMemo(() => getVisibleNames(names), [names]);
	const lockedInNames = useMemo(() => getLockedNames(names), [names]);

	useEffect(() => {
		if (lockedInNames.length === 0) {
			return;
		}
		const missingLocked = lockedInNames.filter((n) => !selectedIds.has(n.id));
		if (missingLocked.length > 0) {
			tournamentActions.setSelection([...storeSelectedNames, ...missingLocked]);
		}
	}, [lockedInNames, storeSelectedNames, tournamentActions, selectedIds]);

	const handleToggleName = useCallback(
		(nameId: IdType) => {
			const nameItem = namesById.get(nameId);
			if (!nameItem || isNameLocked(nameItem)) {
				return;
			}
			hapticNavTap();
			const isCurrentlySelected = selectedIds.has(nameId);
			const nextSelection = isCurrentlySelected
				? storeSelectedNames.filter((n) => n.id !== nameId)
				: [...storeSelectedNames, nameItem];
			tournamentActions.setSelection(nextSelection);
		},
		[namesById, selectedIds, storeSelectedNames, tournamentActions],
	);

	const driftWallItems = useMemo<DriftWallItem[]>(() => {
		return availableNames.map((nameItem) => {
			const isSelected = selectedIds.has(nameItem.id);
			const locked = isNameLocked(nameItem);
			return {
				id: String(nameItem.id),
				title: nameItem.name,
				subtitle: nameItem.description
					? nameItem.description
					: nameItem.pronunciation
						? `/${nameItem.pronunciation}/`
						: undefined,
				selected: isSelected,
				locked,
			};
		});
	}, [availableNames, selectedIds]);

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
					<p className="size-10 rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center mx-auto text-lg font-bold">
						!
					</p>
					<div className="space-y-1.5">
						<h3 className="font-display text-xl font-bold text-foreground">
							Could not load shortlist
						</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
					</div>
					<Button onClick={() => void namesQuery.refetch()} variant="outline" size="small">
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="relative w-full min-h-screen overflow-hidden select-none">
			{availableNames.length > 0 && (
				<div className="absolute inset-0 w-full h-full overflow-hidden">
					<DriftWall
						items={driftWallItems}
						onItemClick={(item) => handleToggleName(item.id as IdType)}
						columns={7}
						tileWidth={150}
						tileHeight={150}
						gap={22}
						radius={9999}
						tilt={0}
						turn={0}
						roll={0}
						perspective={1200}
						depth={120}
						speed={22}
						direction="up"
						variance={0.45}
						parallax={0.55}
						lift={0}
						fade={0}
						dim={1}
						pauseOnHover={true}
						grayscale={false}
						displace={0}
						distortionScale={-160}
						redOffset={5}
						greenOffset={15}
						blueOffset={25}
						borderWidth={0.16}
						brightness={60}
						opacity={0.85}
						blur={11}
						mixBlendMode="screen"
						className="w-full h-full"
					/>
				</div>
			)}
		</div>
	);
});

/* ==========================================================================
   6. TOURNAMENT ARENA
   ========================================================================== */

interface MatchSideCardProps {
	side: "left" | "right";
	name: string;
	img: string | null;
	heatLevel: HeatLevel | null;
	streak: number;
	rating: number;
	winOdds?: number;
	isFavored: boolean;
	isVoting: boolean;
	isSelected: boolean;
	hasSelectionFeedback: boolean;
	isTeam: boolean;
	members: string[];
	description?: string;
	pronunciation?: string;
	onVote: () => void;
}

const MatchSideCard = memo(function MatchSideCard({
	side,
	name,
	img,
	heatLevel,
	streak,
	rating,
	isVoting,
	isSelected,
	hasSelectionFeedback,
	isTeam,
	members,
	description,
	pronunciation,
	onVote,
}: MatchSideCardProps) {
	const isRight = side === "right";
	const heatCardClasses = getHeatCardClasses(heatLevel);
	const heatGradientClasses = heatLevel ? getHeatGradientClasses(heatLevel) : "";

	return (
		<motion.div
			className="relative flex-1 flex flex-col w-full h-full"
			initial={{ opacity: 0, y: isRight ? 16 : -16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: MOTION_DURATIONS.base }}
		>
			<button
				type="button"
				onClick={onVote}
				disabled={isVoting}
				className={`group relative flex-1 flex flex-col items-center justify-between p-4 sm:p-6 rounded-3xl border transition-all duration-300 w-full overflow-hidden text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
					isSelected && hasSelectionFeedback
						? "border-primary ring-4 ring-primary/50 scale-[1.02] shadow-2xl bg-card"
						: "border-border/60 hover:border-primary/60 bg-card/90 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
				} ${heatCardClasses}`}
				aria-label={`Vote for ${name}`}
			>
				{heatLevel && (
					<div
						className={`absolute inset-0 pointer-events-none opacity-40 ${heatGradientClasses}`}
					/>
				)}

				<div className="relative z-10 w-full flex items-center justify-between text-xs text-muted-foreground font-mono">
					<div className="flex items-center gap-1.5">
						<span className="bg-muted/40 px-2 py-0.5 rounded-full border border-border/20">
							ELO {Math.round(rating)}
						</span>
						{streak >= STREAK_THRESHOLDS.warm && (
							<span className="flex items-center gap-0.5 text-orange-400 text-[10px] font-bold bg-orange-500/10 px-1.5 py-0.5 rounded-full border border-orange-500/20">
								<Flame className="size-3 fill-orange-400" />
								{streak}
							</span>
						)}
					</div>
				</div>

				<div className="relative z-10 my-4 flex flex-col items-center gap-3">
					{img && (
						<div className="relative size-32 sm:size-40 rounded-full overflow-hidden border-4 border-card shadow-lg group-hover:scale-105 transition-transform duration-300">
							<CatImage src={img} alt={name} imageClassName="size-full object-cover" />
						</div>
					)}

					<div className="space-y-1">
						<h3 className="font-display font-black text-2xl sm:text-3xl text-foreground tracking-tight group-hover:text-primary transition-colors">
							{name}
						</h3>
						{pronunciation && (
							<p className="text-xs text-muted-foreground/80 font-mono">/{pronunciation}/</p>
						)}
						{description && (
							<p className="text-xs sm:text-sm text-muted-foreground max-w-xs line-clamp-2">
								{description}
							</p>
						)}
					</div>

					{isTeam && members.length > 0 && (
						<div className="flex flex-wrap gap-1 justify-center mt-1">
							{members.map((m, idx) => (
								<span
									key={`${m}-${idx}`}
									className="text-[10px] font-medium bg-secondary/40 border border-border/30 rounded-full px-2 py-0.5 text-foreground/80"
								>
									{m}
								</span>
							))}
						</div>
					)}
				</div>

				<div className="relative z-10 w-full pt-2">
					<div className="w-full py-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm tracking-wide group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
						Vote {isRight ? "Right" : "Left"}
					</div>
				</div>
			</button>
		</motion.div>
	);
});

export const TournamentArena = memo(function TournamentArena({
	names,
	onComplete,
	userName,
}: TournamentProps) {
	const [bracketModalOpen, setBracketModalOpen] = useState(false);
	const activeNames = useMemo(() => getVisibleNames(names), [names]);

	const {
		currentMatch,
		ratings,
		round,
		totalRounds,
		bracketStage,
		matchNumber,
		totalMatches,
		isComplete,
		tournamentMode,
		handleVote,
		handleUndo,
		canUndo,
		handleQuit,
		progress,
		etaMinutes,
		isVoting,
		handleVoteWithAnimation,
		matchHistory,
		bracketEntrants,
		teams,
	} = useTournamentState(activeNames, userName);

	const { value: selectedSide, setTimed: setSelectedSide } = useTimedState<"left" | "right" | null>(
		null,
	);

	useEffect(() => {
		if (isComplete) {
			onComplete(normalizeRatingsWithStats(ratings));
		}
	}, [isComplete, onComplete, ratings]);

	const onVoteSide = useCallback(
		(side: "left" | "right") => {
			if (!currentMatch || isVoting) {
				return;
			}
			hapticVoteTap(15);
			setSelectedSide(side, 300);

			const leftId = getMatchSideId(currentMatch, "left");
			const rightId = getMatchSideId(currentMatch, "right");
			const winnerId = side === "left" ? leftId : rightId;
			const loserId = side === "left" ? rightId : leftId;

			handleVoteWithAnimation(winnerId, loserId);
		},
		[currentMatch, isVoting, setSelectedSide, handleVoteWithAnimation],
	);

	if (isComplete) {
		return (
			<TournamentComplete
				totalMatches={totalMatches}
				participantCount={activeNames.length}
				onNewTournament={handleQuit}
				bracketEntrants={bracketEntrants}
				matchHistory={matchHistory}
				names={activeNames}
				teams={teams}
				ratings={ratings}
				totalRounds={totalRounds}
				tournamentMode={tournamentMode}
			/>
		);
	}

	if (!currentMatch) {
		return (
			<div className="w-full min-h-[400px] flex items-center justify-center">
				<Loading variant="spinner" text="Setting up matches..." />
			</div>
		);
	}

	const matchData = extractMatchData(currentMatch);
	const leftRating = ratings[matchData.leftId] ?? 1200;
	const rightRating = ratings[matchData.rightId] ?? 1200;

	const leftStreak = getContestantStreak(matchData.leftId, matchHistory);
	const rightStreak = getContestantStreak(matchData.rightId, matchHistory);

	const leftHeat = getHeatLevel(leftStreak);
	const rightHeat = getHeatLevel(rightStreak);

	const dominantStreak =
		leftStreak >= rightStreak && leftStreak >= STREAK_THRESHOLDS.warm && leftHeat
			? { name: matchData.leftName, streak: leftStreak, heatLevel: leftHeat }
			: rightStreak >= STREAK_THRESHOLDS.warm && rightHeat
				? { name: matchData.rightName, streak: rightStreak, heatLevel: rightHeat }
				: null;

	const leftImg = getRandomCatImage(matchData.leftId, undefined, matchData.leftName);
	const rightImg = getRandomCatImage(matchData.rightId, undefined, matchData.rightName);

	return (
		<div className="w-full flex flex-col flex-1 max-w-5xl mx-auto pb-8">
			<TournamentHeader
				roundNumber={round}
				totalRounds={totalRounds}
				bracketStage={bracketStage}
				tournamentMode={tournamentMode}
				currentMatchNumber={matchNumber}
				totalMatches={totalMatches}
				etaMinutes={etaMinutes}
				canUndo={canUndo}
				handleUndo={handleUndo}
				quitTournament={handleQuit}
				onOpenBracket={() => setBracketModalOpen(true)}
				progressWidth={progress}
				stageHeadline={`Round ${round}`}
				dominantStreak={dominantStreak}
				matchupTone="High Stakes"
				pressureCopy="Choose your favorite cat name"
				matchesRemaining={totalMatches - matchNumber}
				roundMatchesLeft={totalRounds - round}
			/>

			<div className="flex-1 flex flex-col md:flex-row items-stretch justify-center gap-4 sm:gap-8 px-2 sm:px-4 mt-6">
				<MatchSideCard
					side="left"
					name={matchData.leftName}
					img={leftImg}
					heatLevel={leftHeat}
					streak={leftStreak}
					rating={leftRating}
					isFavored={leftRating > rightRating}
					isVoting={isVoting}
					isSelected={selectedSide === "left"}
					hasSelectionFeedback={Boolean(selectedSide)}
					isTeam={matchData.leftIsTeam}
					members={matchData.leftMembers}
					description={matchData.leftDescription}
					pronunciation={matchData.leftPronunciation}
					onVote={() => onVoteSide("left")}
				/>

				<div className="flex items-center justify-center my-auto shrink-0 py-2">
					<div className="size-10 sm:size-12 rounded-full border border-border/40 bg-card/90 shadow-md flex items-center justify-center font-display font-black text-xs text-muted-foreground">
						VS
					</div>
				</div>

				<MatchSideCard
					side="right"
					name={matchData.rightName}
					img={rightImg}
					heatLevel={rightHeat}
					streak={rightStreak}
					rating={rightRating}
					isFavored={rightRating > leftRating}
					isVoting={isVoting}
					isSelected={selectedSide === "right"}
					hasSelectionFeedback={Boolean(selectedSide)}
					isTeam={matchData.rightIsTeam}
					members={matchData.rightMembers}
					description={matchData.rightDescription}
					pronunciation={matchData.rightPronunciation}
					onVote={() => onVoteSide("right")}
				/>
			</div>

			<TournamentBracketModal
				isOpen={bracketModalOpen}
				onClose={() => setBracketModalOpen(false)}
				bracketEntrants={bracketEntrants}
				matchHistory={matchHistory}
				currentMatch={currentMatch}
				names={activeNames}
				teams={teams}
				ratings={ratings}
				totalRounds={totalRounds}
				tournamentMode={tournamentMode}
				onVote={(w, l) => handleVote(w, l)}
			/>
		</div>
	);
});

/* ==========================================================================
   7. TOURNAMENT SETUP
   ========================================================================== */

export function TournamentSetup() {
	const { names, isComplete, ratings, userId, userName } = useTournamentSetupState();
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const hasSavedRef = useRef(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const prefersReducedMotion = useReducedMotion();

	useInertiaScroll(containerRef, prefersReducedMotion);

	const saveRatingsMutation = useMutation({
		mutationFn: ({ userId, ratings }: { userId: string; ratings: Record<string, RatingData> }) =>
			ratingsAPI.saveRatings(userId, ratings),
		onError: (error) => {
			console.error("Tournament ratings save failed — ratings were not persisted", error);
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
			const ratingsWithStats = normalizeRatingsWithStats(ratings);
			saveRatingsMutation.mutate({
				userId: effectiveUserId,
				ratings: ratingsWithStats,
			});
		}
	}, [isComplete, ratings, userId, userName, saveRatingsMutation.mutate]);

	return (
		<div ref={containerRef} className="w-full flex flex-col flex-1 min-h-[520px] gap-2">
			<AnimatePresence mode="wait">
				{names && names.length >= 2 ? (
					<motion.div
						key="arena"
						{...fadeMotionPreset}
						className="w-full flex flex-col flex-1 min-h-[520px] py-0"
					>
						<TournamentArena
							names={names}
							onComplete={(completedRatings) => {
								tournamentActions.completeTournament(completedRatings);
							}}
							userName={userName ?? undefined}
						/>
					</motion.div>
				) : (
					<motion.div
						key="setup"
						{...fadeMotionPreset}
						className="w-full flex flex-col flex-1 min-h-[520px] py-0"
					>
						<NameSelector />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
