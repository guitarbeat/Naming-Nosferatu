import { Check, Flame, Layers, Trophy, X, ZoomIn, ZoomOut } from "lucide-react";
import { memo, type SyntheticEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/UiPrimitives";
import { MagicToolbar } from "@/components/ui/MagicToolbar";
import { useDebounce } from "@/hooks/useCommonHooks";
import type { Match, MatchRecord, NameItem, Team, TournamentMode } from "@/types";
import {
	areMatchNodePropsEqual,
	deriveVisualBracketTree,
	type VisualContender,
	type VisualMatch,
} from "./bracketTree";
import { STREAK_THRESHOLDS } from "./tournamentEngine";

const handleImgError = (e: SyntheticEvent<HTMLImageElement>) => {
	e.currentTarget.style.display = "none";
};

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
					<span className="flex items-center gap-0.5 text-orange-400 text-[10px] font-bold shrink-0 font-mono tabular-nums">
						<Flame className="size-3 fill-orange-400" />
						{streak}
					</span>
				)}
				{contender.seed && (
					<span className="text-[10px] font-mono tabular-nums text-muted-foreground/60 shrink-0">
						#{contender.seed}
					</span>
				)}
			</button>

			{isLive && onVote && !isBye && (
				<Button
					size="small"
					variant="primary"
					onClick={onVote}
					className="h-6 min-h-0 px-2.5 text-[10px] shrink-0 font-bold"
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
	return (
		<div
			className={`w-60 sm:w-64 rounded-xl border transition-all duration-200 overflow-hidden shadow-xs ${
				isLive
					? "border-primary/80 ring-2 ring-primary/40 shadow-md bg-card/95"
					: match.status === "bye"
						? "border-border/30 opacity-70 bg-card/50"
						: match.status === "completed"
							? "border-border/60 bg-card/80"
							: "border-border/30 bg-card/40"
			}`}
		>
			<div className="flex items-center justify-between px-3 py-1 bg-muted/20 border-b border-border/10 text-[10px] text-muted-foreground font-mono tabular-nums">
				<span>
					{match.roundName} &middot; M{match.matchIndex + 1}
				</span>
				{isLive && <span className="text-primary font-bold">LIVE</span>}
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
	onVote,
	onClose,
	isModal = false,
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
			for (const m of round.matches) {
				const found =
					(m.contender1?.name.toLowerCase().includes(term) && m.contender1.id) ||
					(m.contender2?.name.toLowerCase().includes(term) && m.contender2.id);
				if (found) {
					setHighlightedContenderId(found);
					return;
				}
			}
		}
	}, [debouncedSearch, bracketTree]);

	const handleVoteForSide = useCallback(
		(match: VisualMatch, side: "left" | "right") => {
			if (!onVote || !match.contender1?.id || !match.contender2?.id) {
				return;
			}
			if (side === "left") {
				onVote(match.contender1.id, match.contender2.id);
			} else {
				onVote(match.contender2.id, match.contender1.id);
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
					className={
						viewMode === "cards"
							? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4"
							: "flex gap-8 items-start min-w-max pb-4"
					}
				>
					{bracketTree.rounds.map((round) => (
						<div key={`round-${round.roundNumber}`} className="flex flex-col gap-4">
							<div className="text-center font-display font-bold text-xs tracking-wider text-muted-foreground border-b border-border/20 pb-2">
								{round.roundName}
							</div>
							<div className="flex flex-col justify-around gap-5 flex-1 items-center">
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
							<div className="text-center font-display font-bold text-xs tracking-wider text-primary border-b border-primary/20 pb-2">
								Champion
							</div>
							<div className="w-56 p-4 rounded-2xl border-2 border-primary bg-primary/10 shadow-lg text-center flex flex-col items-center gap-3">
								<Trophy className="size-8 text-primary" />
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
