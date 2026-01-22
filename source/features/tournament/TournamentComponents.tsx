import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
	AlertCircle,
	ChevronDown,
	ChevronRight,
	Keyboard,
	Music,
	Volume2,
	VolumeX,
} from "lucide-react";
import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useProfile } from "../../core/hooks/useProfile";
import Bracket from "../../shared/components/Bracket";
import Button, { IconButton } from "../../shared/components/Button";
import Card from "../../shared/components/Card";
import CatImage from "../../shared/components/CatImage";
import { ErrorComponent } from "../../shared/components/ErrorComponent";
import LiquidGlass from "../../shared/components/LiquidGlass";
import {
	NameManagementContext,
	useNameManagementContextOptional,
} from "../../shared/components/NameManagementView/nameManagementCore";
import { ErrorManager } from "../../shared/services/errorManager";
import {
	exportTournamentResultsToCSV,
	extractNameIds,
	isNameHidden,
	selectedNamesToSet,
} from "../../shared/utils";
import { playSound } from "../../shared/utils/soundManager";
import type { BracketMatch, Match, NameItem } from "../../types/components";
import { AnalysisDashboard } from "../analytics/AnalysisDashboard";
import { useMagneticPull, useNameManagementCallbacks } from "./TournamentHooks";
import { getRandomCatImage } from "./TournamentLogic";
import styles from "./tournament.module.css";

import "./TournamentRankingAdjustment.css";

/* =========================================================================
   COMPONENTS
   ========================================================================= */

const CardBody = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={className} {...props}>
		{children}
	</div>
);

export const TournamentHeader = memo(
	({
		roundNumber,
		currentMatchNumber,
		totalMatches,
		progress,
	}: {
		roundNumber: number;
		currentMatchNumber: number;
		totalMatches: number;
		progress: number;
	}) => {
		const eloTooltipText =
			"Each choice updates name rankings using the Elo rating system. Your preferences determine which names rank highest!";
		return (
			<Card
				className="w-full max-w-full mb-4 p-3 bg-gradient-to-br from-white/8 to-white/4 border border-white/15 rounded-lg shadow-lg backdrop-blur-xl"
				role="status"
				aria-live="polite"
			>
				<CardBody className="flex flex-row items-center justify-between gap-4 p-0">
					<div className="flex flex-row flex-wrap items-center gap-3">
						<span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider">
							Round {roundNumber}
						</span>
						<span
							className="text-sm md:text-base font-medium text-slate-400 opacity-85 cursor-help"
							title="Current matchup"
						>
							Match {currentMatchNumber} of {totalMatches}
						</span>
					</div>
					<div
						className="px-3 py-2 text-sm md:text-base font-bold text-purple-600 bg-gradient-to-br from-purple-500/12 to-purple-500/8 border border-purple-500/25 rounded-full shadow-md cursor-help relative group"
						title={eloTooltipText}
					>
						{progress}% Complete{" "}
						<span className="absolute -top-1 -right-1 text-xs opacity-60 group-hover:opacity-100">
							ℹ️
						</span>
					</div>
				</CardBody>
			</Card>
		);
	},
);

export const RippleEffects = memo(
	React.forwardRef((_, ref: React.Ref<{ trigger: () => void }>) => {
		const [ripples, setRipples] = useState<{ id: string }[]>([]);
		React.useImperativeHandle(ref, () => ({
			trigger: () => {
				const id = `ripple-${Date.now()}-${Math.random()}`;
				setRipples((p) => [...p, { id }]);
				setTimeout(() => setRipples((p) => p.filter((r) => r.id !== id)), 800);
			},
		}));
		return (
			<AnimatePresence>
				{ripples.map((r) => (
					<motion.div
						key={r.id}
						className={styles.ripple}
						initial={{ scale: 0, opacity: 1 }}
						animate={{ scale: 2.5, opacity: 0 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.8, ease: "easeOut" }}
					/>
				))}
			</AnimatePresence>
		);
	}),
);

export const TournamentMatch = memo(
	({
		currentMatch,
		selectedOption,
		isProcessing,
		isTransitioning,
		votingError,
		onNameCardClick,
		onVoteWithAnimation,
		onVoteRetry,
		onDismissError,
		showCatPictures,
		imageList,
	}: {
		currentMatch: Match;
		selectedOption: "left" | "right" | "both" | "neither" | null;
		isProcessing: boolean;
		isTransitioning: boolean;
		votingError: unknown;
		onNameCardClick: (option: "left" | "right" | "both" | "neither" | null) => void;
		onVoteWithAnimation: (option: "left" | "right" | "both" | "neither") => void;
		onVoteRetry: () => void;
		onDismissError: () => void;
		showCatPictures: boolean;
		imageList: string[];
	}) => {
		const leftOrbRef = useRef<HTMLDivElement>(null);
		const rightOrbRef = useRef<HTMLDivElement>(null);
		const leftRippleRef = useRef<{ trigger: () => void } | null>(null);
		const rightRippleRef = useRef<{ trigger: () => void } | null>(null);
		const [showVoteConfirmation, setShowVoteConfirmation] = useState<"left" | "right" | null>(null);
		const isEnabled = !isProcessing && !isTransitioning;

		useEffect(() => {
			if (selectedOption === "left" || selectedOption === "right") {
				setShowVoteConfirmation(selectedOption);
				playSound("wow");
				const timer = setTimeout(() => setShowVoteConfirmation(null), 800);
				return () => clearTimeout(timer);
			}
			return undefined;
		}, [selectedOption]);

		useMagneticPull(leftOrbRef, rightOrbRef, isEnabled);

		const handleDragEnd = (side: "left" | "right", info: PanInfo) => {
			if (!isEnabled) {
				return;
			}
			const threshold = 100;
			if (side === "left" && info.offset.x > threshold) {
				leftRippleRef.current?.trigger();
				playSound("gameboy-pluck");
				onNameCardClick("left");
			} else if (side === "right" && info.offset.x < -threshold) {
				rightRippleRef.current?.trigger();
				playSound("gameboy-pluck");
				onNameCardClick("right");
			}
		};

		const l =
			typeof currentMatch.left === "string"
				? { name: currentMatch.left, id: currentMatch.left }
				: currentMatch.left || { name: "Unknown", id: null };
		const r =
			typeof currentMatch.right === "string"
				? { name: currentMatch.right, id: currentMatch.right }
				: currentMatch.right || { name: "Unknown", id: null };
		const lImg = showCatPictures && l.id ? getRandomCatImage(l.id, imageList) : null;
		const rImg = showCatPictures && r.id ? getRandomCatImage(r.id, imageList) : null;

		return (
			<div className={styles.matchup} role="region" aria-label="Matchup">
				<svg xmlns="http://www.w3.org/2000/svg" version="1.1" className={styles.ferroFilter}>
					<defs>
						<filter id="tournament-ferro-goo">
							<feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
							<feColorMatrix
								in="blur"
								mode="matrix"
								values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 32 -14"
								result="goo"
							/>
							<feComposite in="SourceGraphic" in2="goo" operator="atop" />
						</filter>
					</defs>
				</svg>

				<div
					className={styles.battleStage}
					style={{ filter: "url(#tournament-ferro-goo)" } as React.CSSProperties}
				>
					<div className={styles.stageWrapper}>
						<motion.div
							ref={leftOrbRef}
							drag={isEnabled ? "x" : false}
							dragConstraints={{ left: 0, right: 0 }}
							dragElastic={0.2}
							onDragEnd={(_, info) => handleDragEnd("left", info)}
							className={`${styles.fighterOrb} ${selectedOption === "left" ? styles.selected : ""} ${isEnabled ? "" : styles.disabled}`}
							onClick={() => {
								if (isEnabled) {
									leftRippleRef.current?.trigger();
									playSound("gameboy-pluck");
									onNameCardClick("left");
								}
							}}
						>
							<div className={styles.spikes} />
							<RippleEffects ref={leftRippleRef} />
							<div className={styles.fighterContent}>
								{lImg && (
									<div className={styles.avatarWrap}>
										<img src={lImg} alt={l.name} />
									</div>
								)}
								<h3 className={styles.nameText}>{l.name}</h3>
							</div>
							{showVoteConfirmation === "left" && (
								<motion.div
									initial={{ opacity: 0, scale: 0 }}
									animate={{ opacity: 1, scale: 1 }}
									className={styles.voteCheckmark}
								>
									✓
								</motion.div>
							)}
						</motion.div>

						<div className={styles.vsCore}>
							<div className={styles.vsText}>VS</div>
						</div>

						<motion.div
							ref={rightOrbRef}
							drag={isEnabled ? "x" : false}
							dragConstraints={{ left: 0, right: 0 }}
							dragElastic={0.2}
							onDragEnd={(_, info) => handleDragEnd("right", info)}
							className={`${styles.fighterOrb} ${styles.right} ${selectedOption === "right" ? styles.selected : ""} ${isEnabled ? "" : styles.disabled}`}
							onClick={() => {
								if (isEnabled) {
									rightRippleRef.current?.trigger();
									playSound("gameboy-pluck");
									onNameCardClick("right");
								}
							}}
						>
							<div className={styles.spikes} />
							<RippleEffects ref={rightRippleRef} />
							<div className={styles.fighterContent}>
								{rImg && (
									<div className={styles.avatarWrap}>
										<img src={rImg} alt={r.name} />
									</div>
								)}
								<h3 className={styles.nameText}>{r.name}</h3>
							</div>
							{showVoteConfirmation === "right" && (
								<motion.div
									initial={{ opacity: 0, scale: 0 }}
									animate={{ opacity: 1, scale: 1 }}
									className={styles.voteCheckmark}
								>
									✓
								</motion.div>
							)}
						</motion.div>
						<div className={styles.magneticLine} />
					</div>
				</div>

				<div className={styles.extraOptions}>
					<Button
						onClick={() => onVoteWithAnimation("both")}
						disabled={!isEnabled}
						variant={selectedOption === "both" ? "primary" : "secondary"}
						className={styles.extraOptionsButton}
					>
						Both! <span className={styles.shortcutHint}>(↑)</span>
					</Button>
					<Button
						onClick={() => onVoteWithAnimation("neither")}
						disabled={!isEnabled}
						variant={selectedOption === "neither" ? "primary" : "secondary"}
						className={styles.extraOptionsButton}
					>
						Pass <span className={styles.shortcutHint}>(↓)</span>
					</Button>
				</div>

				{!!votingError && (
					<ErrorComponent
						variant="inline"
						error={votingError as Error | string}
						onRetry={onVoteRetry}
						onDismiss={onDismissError}
						showRetry={true}
						showDismiss={true}
						className={styles.votingError}
					/>
				)}
			</div>
		);
	},
);

export const TournamentControls = memo(
	({
		onEndEarly,
		isTransitioning,
		isMuted,
		onToggleMute,
		onNextTrack,
		isShuffle,
		onToggleShuffle,
		trackInfo,
		audioError,
		onRetryAudio,
		volume,
		onVolumeChange,
		showCatPictures,
		onToggleCatPictures,
	}: {
		onEndEarly: () => void;
		isTransitioning: boolean;
		isMuted: boolean;
		onToggleMute: () => void;
		onNextTrack: () => void;
		isShuffle: boolean;
		onToggleShuffle: () => void;
		trackInfo: { name: string } | null;
		audioError: string | null;
		onRetryAudio: () => void;
		volume: { music: number; effects: number };
		onVolumeChange: (type: "music" | "effects", value: number) => void;
		showCatPictures: boolean;
		onToggleCatPictures: () => void;
	}) => {
		const [showConfirmation, setShowConfirmation] = useState(false);
		const [showVolume, setShowVolume] = useState(false);
		return (
			<LiquidGlass
				width={1200}
				height={140}
				radius={28}
				scale={-95}
				className={styles.tournamentControlsGlass}
				style={{ width: "100%", height: "auto", padding: 0 }}
			>
				<div className={styles.tournamentControls} role="toolbar">
					<div className={styles.soundControls}>
						<IconButton
							onClick={audioError ? onRetryAudio : onToggleMute}
							icon={isMuted ? <VolumeX /> : <Volume2 />}
							variant={audioError ? "danger" : "ghost"}
							ariaLabel={isMuted ? "Unmute" : "Mute"}
							className={`${styles.soundToggleButton} ${isMuted ? styles.muted : ""} ${audioError ? styles.error : ""}`}
						/>
						{!isMuted && (
							<div
								className={styles.volumeContainer}
								onMouseEnter={() => setShowVolume(true)}
								onMouseLeave={() => setShowVolume(false)}
							>
								<div className={`${styles.volumeControls} ${showVolume ? styles.show : ""}`}>
									<label className={styles.volumeLabel}>
										🎵{" "}
										<input
											type="range"
											min="0"
											max="1"
											step="0.1"
											value={volume.music}
											onChange={(e) => onVolumeChange("music", parseFloat(e.target.value))}
											className={styles.volumeSlider}
										/>
									</label>
									<label className={styles.volumeLabel}>
										🎮{" "}
										<input
											type="range"
											min="0"
											max="1"
											step="0.1"
											value={volume.effects}
											onChange={(e) => onVolumeChange("effects", parseFloat(e.target.value))}
											className={styles.volumeSlider}
										/>
									</label>
								</div>
							</div>
						)}
						{!isMuted && (
							<IconButton
								onClick={onNextTrack}
								icon={<Music />}
								variant="ghost"
								title={trackInfo?.name || "Next"}
								ariaLabel="Next track"
								className={styles.soundToggleButton}
							/>
						)}
						{!isMuted && (
							<IconButton
								onClick={onToggleShuffle}
								icon={<span>🔀</span>}
								variant="ghost"
								ariaLabel="Toggle shuffle"
								className={`${styles.soundToggleButton} ${isShuffle ? styles.muted : ""}`}
							/>
						)}
						<IconButton
							onClick={onToggleCatPictures}
							icon={<span>🐱</span>}
							variant="ghost"
							ariaLabel="Toggle cats"
							className={`${styles.soundToggleButton} ${showCatPictures ? styles.muted : ""}`}
							title="Toggle Cats"
						/>
						{audioError && (
							<IconButton
								onClick={onRetryAudio}
								icon={<AlertCircle />}
								variant="danger"
								ariaLabel="Retry audio"
								title={audioError}
								className={styles.soundToggleButton}
							/>
						)}
						{!isMuted && trackInfo?.name && (
							<div className={styles.trackInfo}>
								<span className={styles.trackName}>{trackInfo.name}</span>
							</div>
						)}
					</div>
					<Button
						onClick={() => setShowConfirmation(true)}
						variant="danger"
						disabled={isTransitioning}
						className={styles.controlButton}
					>
						End Tournament Early
					</Button>
					{showConfirmation && (
						<div className={styles.modalBackdrop} onClick={() => setShowConfirmation(false)}>
							<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
								<h2 className={styles.modalTitle}>End Tournament?</h2>
								<p className={styles.modalText}>Your progress will be saved.</p>
								<div className={styles.modalActions}>
									<Button
										onClick={() => {
											setShowConfirmation(false);
											onEndEarly();
										}}
										variant="danger"
										className={styles.confirmButton}
									>
										Yes, End
									</Button>
									<Button
										onClick={() => setShowConfirmation(false)}
										variant="secondary"
										className={styles.cancelButton}
									>
										Cancel
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			</LiquidGlass>
		);
	},
);

export const TournamentFooter = memo(
	({
		showBracket,
		transformedMatches,
		onToggleBracket,
		onToggleKeyboardHelp,
	}: {
		showBracket: boolean;
		showKeyboardHelp: boolean;
		transformedMatches: BracketMatch[];
		onToggleBracket: () => void;
		onToggleKeyboardHelp: () => void;
	}) => (
		<>
			<div className="sticky top-0 z-10 flex flex-wrap gap-3 items-center justify-center w-full p-0 m-0">
				<div className="relative w-full max-w-[800px]">
					<Button
						className="w-full"
						onClick={onToggleBracket}
						variant="secondary"
						endIcon={showBracket ? <ChevronDown /> : <ChevronRight />}
					>
						{showBracket ? "Hide Bracket" : "Show Bracket"}
					</Button>
				</div>
				<Button onClick={onToggleKeyboardHelp} variant="secondary" startIcon={<Keyboard />}>
					Shortcuts
				</Button>
			</div>
			<AnimatePresence>
				{showBracket && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="relative p-6 mt-4 overflow-x-auto bg-white/5 border border-white/10 rounded-2xl"
					>
						<Bracket matches={transformedMatches} />
					</motion.div>
				)}
			</AnimatePresence>
		</>
	),
);

export const SwipeableCards = memo(
	({
		names,
		selectedNames,
		onToggleName,
		showCatPictures,
		imageList,
		onStartTournament,
	}: {
		names: NameItem[];
		selectedNames: NameItem[];
		onToggleName: (name: NameItem) => void;
		showCatPictures: boolean;
		imageList: string[];
		onStartTournament: (names: NameItem[]) => void;
	}) => {
		const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
		const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);
		const visibleCards = useMemo(
			() => names.filter((n: NameItem) => !swipedIds.has(String(n.id))),
			[names, swipedIds],
		);
		const cardsToRender = visibleCards.slice(0, 3);
		const isSelected = useCallback(
			(n: NameItem) => selectedNames.some((s: NameItem) => s.id === n.id),
			[selectedNames],
		);

		const handleDragEnd = useCallback(
			(card: NameItem, info: PanInfo) => {
				const offset = info.offset.x;
				const threshold = 100;
				if (Math.abs(offset) < threshold) {
					return;
				}
				if (offset > threshold) {
					setDragDirection("right");
					playSound("gameboy-pluck");
					if (!isSelected(card)) {
						onToggleName(card);
					}
				} else {
					setDragDirection("left");
					playSound("wow");
				}
				setSwipedIds((prev) => new Set([...prev, String(card.id)]));
				setTimeout(() => setDragDirection(null), 300);
			},
			[isSelected, onToggleName],
		);

		return (
			<div className={styles.swipeContainer}>
				<div className={styles.cardProgress}>
					<div
						style={{
							width: "100%",
							height: "4px",
							background: "rgba(255,255,255,0.1)",
							borderRadius: "2px",
						}}
					>
						<div
							style={{
								width: `${(swipedIds.size / names.length) * 100}%`,
								height: "100%",
								background: "var(--color-warning)",
							}}
						/>
					</div>
					<span>
						{swipedIds.size} of {names.length} reviewed
					</span>
				</div>
				<div className={styles.swipeStack}>
					<AnimatePresence mode="popLayout">
						{visibleCards.length > 0 ? (
							cardsToRender.map((card: NameItem, index: number) => (
								<motion.div
									key={card.id}
									layout={true}
									layoutId={String(card.id)}
									className={styles.swipeCardWrapper}
									exit={{
										opacity: 0,
										x: dragDirection === "right" ? 300 : -300,
									}}
								>
									<motion.div
										drag="x"
										dragConstraints={{ left: 0, right: 0 }}
										onDragEnd={(_, info) => handleDragEnd(card, info)}
										className={`${styles.swipeCard} ${isSelected(card) ? styles.selected : ""} ${index > 0 ? styles.stacked : ""}`}
										animate={{
											y: index * 16,
											scale: 1 - index * 0.05,
											opacity: 1 - index * 0.15,
											zIndex: 10 - index,
										}}
									>
										<div className={styles.swipeCardContent}>
											{showCatPictures && card.id && (
												<div className={styles.swipeCardImageContainer}>
													<CatImage src={getRandomCatImage(card.id, imageList)} />
												</div>
											)}
											<h2 className={styles.swipeCardName}>{card.name}</h2>
											{card.description && (
												<p className={styles.swipeCardDescription}>{card.description}</p>
											)}
										</div>
									</motion.div>
								</motion.div>
							))
						) : (
							<div className={styles.swipeCompletion}>
								<h2>All clear!</h2>
								{selectedNames.length >= 2 && (
									<Button onClick={() => onStartTournament(selectedNames)}>Start Tournament</Button>
								)}
							</div>
						)}
					</AnimatePresence>
				</div>
				{visibleCards.length > 0 && (
					<div className={styles.swipeButtons}>
						<Button
							onClick={() => onStartTournament(selectedNames)}
							disabled={selectedNames.length < 2}
						>
							Start Tournament ({selectedNames.length})
						</Button>
					</div>
				)}
			</div>
		);
	},
);

/* =========================================================================
   ANALYSIS WRAPPERS
   ========================================================================= */

export function AnalysisHandlersProvider({
	activeUser,
	handlersRef,
	showSuccess,
	showError,
}: {
	activeUser: string | undefined;
	handlersRef: React.RefObject<Record<string, (id: string) => Promise<void>>>;
	showSuccess: (msg: string) => void;
	showError: (msg: string) => void;
}) {
	const context = useContext(NameManagementContext);
	const { setAllNames, fetchNames } = useNameManagementCallbacks(context);

	const { handleToggleVisibility, handleDelete } = useProfile(activeUser || "", {
		showSuccess,
		showError,
		fetchNames,
		setAllNames: (val) => setAllNames(val as NameItem[]),
	});

	useEffect(() => {
		if (!context) {
			return;
		}
		handlersRef.current.handleToggleVisibility = handleToggleVisibility;
		handlersRef.current.handleDelete = async (id: string) => {
			const name = context.names.find((n) => String(n.id) === id);
			if (name) {
				await handleDelete(name);
			}
		};
	}, [context, handleToggleVisibility, handleDelete, handlersRef]);

	return null;
}

export const createAnalysisDashboardWrapper = (
	_stats: unknown,
	_selectionStats: unknown,
	isAdmin: boolean,
	activeUser: string | undefined,
	onNameHidden: (() => void) | undefined,
) => {
	return function AnalysisDashboardWrapperWithProps() {
		const context = useNameManagementContextOptional();
		const handleNameHidden =
			onNameHidden ||
			(() => {
				if (context && "fetchNames" in context && typeof context.fetchNames === "function") {
					context.fetchNames();
				}
			});
		return (
			<AnalysisDashboard
				highlights={undefined}
				isAdmin={isAdmin}
				userName={activeUser}
				onNameHidden={handleNameHidden}
			/>
		);
	};
};

export function AnalysisBulkActionsWrapper(props: {
	activeUser?: string;
	showSuccess: (msg: string) => void;
	showError: (msg: string) => void;
	canManageActiveUser?: boolean;
	isAdmin?: boolean;
}) {
	const context = useNameManagementContextOptional();

	const selectedNamesValue = context?.selectedNames ?? [];
	const selectedCount = context?.selectedCount ?? 0;
	const selectedNamesSet = useMemo(
		() => selectedNamesToSet(selectedNamesValue),
		[selectedNamesValue],
	);
	const selectedNamesArray = useMemo(
		() => extractNameIds(selectedNamesValue),
		[selectedNamesValue],
	);

	const { setAllNames, fetchNames } = useNameManagementCallbacks(context);
	const { handleBulkHide, handleBulkUnhide } = useProfile(props.activeUser ?? "", {
		showSuccess: props.showSuccess,
		showError: props.showError,
		fetchNames,
		setAllNames: (val) => setAllNames(val as NameItem[]),
	});

	const filteredAndSortedNames = useMemo(() => {
		if (!context?.names) {
			return [];
		}
		let filtered = [...context.names];
		if (context.filterStatus === "visible") {
			filtered = filtered.filter((n) => !isNameHidden(n));
		} else if (context.filterStatus === "hidden") {
			filtered = filtered.filter((n) => isNameHidden(n));
		}
		return filtered;
	}, [context?.names, context?.filterStatus]);

	const allVisibleSelected = useMemo(
		() =>
			filteredAndSortedNames.length > 0 &&
			filteredAndSortedNames.every((n) => selectedNamesSet.has(n.id)),
		[filteredAndSortedNames, selectedNamesSet],
	);

	const handleSelectAll = useCallback(() => {
		const visibleNameIds = filteredAndSortedNames.map((n) => n.id);
		if (visibleNameIds.length === 0) {
			return;
		}
		const shouldSelect = !allVisibleSelected;
		if (context?.toggleNamesByIds) {
			context.toggleNamesByIds(
				visibleNameIds.map((id) => String(id)),
				shouldSelect,
			);
		} else {
			visibleNameIds.forEach((id) => {
				context?.toggleNameById?.(String(id), shouldSelect);
			});
		}
	}, [allVisibleSelected, filteredAndSortedNames, context]);

	const handleExport = useCallback(() => {
		try {
			const success = exportTournamentResultsToCSV(
				filteredAndSortedNames,
				"naming_nosferatu_export",
			);
			if (!success) {
				props.showError("Failed to export results.");
			}
		} catch {
			props.showError("Failed to export results.");
		}
	}, [filteredAndSortedNames, props]);

	if (!context) {
		return null;
	}

	if (!props.canManageActiveUser || filteredAndSortedNames.length === 0) {
		return null;
	}

	return (
		<div className="flex gap-2 items-center flex-wrap p-3">
			<span className="text-sm text-slate-400">
				{selectedCount} of {filteredAndSortedNames.length} selected
			</span>
			<Button variant="secondary" size="small" onClick={handleSelectAll}>
				{allVisibleSelected ? "Deselect All" : "Select All"}
			</Button>
			{props.isAdmin && (
				<>
					<Button
						variant="secondary"
						size="small"
						onClick={() => handleBulkHide(selectedNamesArray.map((id) => id.toString()))}
						disabled={selectedCount === 0}
					>
						Hide Selected
					</Button>
					<Button
						variant="secondary"
						size="small"
						onClick={() => handleBulkUnhide(selectedNamesArray.map((id) => id.toString()))}
						disabled={selectedCount === 0}
					>
						Unhide Selected
					</Button>
				</>
			)}
			<Button variant="secondary" size="small" onClick={handleExport}>
				Export CSV
			</Button>
		</div>
	);
}

/* =========================================================================
   RANKING ADJUSTMENT
   ========================================================================= */

function haveRankingsChanged(newItems: NameItem[], oldRankings: NameItem[]): boolean {
	if (newItems.length !== oldRankings.length) {
		return true;
	}
	return newItems.some(
		(item, index) =>
			item.name !== oldRankings[index]?.name || item.rating !== oldRankings[index]?.rating,
	);
}

const RankingItemContent = memo(({ item, index }: { item: NameItem; index: number }) => (
	<>
		<div className="rank-badge">{index + 1}</div>
		<div className="card-content">
			<h3 className="name">{item.name}</h3>
			<div className="stats">
				<span className="rating">Rating: {Math.round(item.rating as number)}</span>
			</div>
		</div>
	</>
));
RankingItemContent.displayName = "RankingItemContent";

export const RankingAdjustment = memo(
	({
		rankings,
		onSave,
		onCancel,
	}: {
		rankings: NameItem[];
		onSave: (items: NameItem[]) => Promise<void>;
		onCancel: () => void;
	}) => {
		const [items, setItems] = useState(rankings || []);
		const [saveStatus, setSaveStatus] = useState("");
		const [isDragging, setIsDragging] = useState(false);
		const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
		const isMountedRef = useRef(true);
		const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		useEffect(() => {
			if (hasUnsavedChanges) {
				return;
			}
			const sorted = [...rankings].sort((a, b) => (b.rating as number) - (a.rating as number));
			if (haveRankingsChanged(sorted, items)) {
				setItems(sorted);
			}
		}, [rankings, hasUnsavedChanges, items]);

		useEffect(() => {
			isMountedRef.current = true;
			if (items && rankings && haveRankingsChanged(items, rankings)) {
				setSaveStatus("saving");
				if (saveTimerRef.current) {
					clearTimeout(saveTimerRef.current);
				}
				saveTimerRef.current = setTimeout(() => {
					onSave(items)
						.then(() => {
							if (!isMountedRef.current) {
								return;
							}
							setHasUnsavedChanges(false);
							setSaveStatus("success");
							setTimeout(() => {
								if (isMountedRef.current) {
									setSaveStatus("");
								}
							}, 2000);
						})
						.catch((e: unknown) => {
							if (!isMountedRef.current) {
								return;
							}
							setSaveStatus("error");
							ErrorManager.handleError(e, "Save Rankings");
						});
				}, 1000);
			}
			return () => {
				if (saveTimerRef.current) {
					clearTimeout(saveTimerRef.current);
				}
			};
		}, [items, rankings, onSave]);

		const handleDragEnd = (result: DropResult) => {
			setIsDragging(false);
			if (!result.destination) {
				return;
			}
			const newItems = Array.from(items);
			const [reordered] = newItems.splice(result.source.index, 1);
			if (reordered) {
				newItems.splice(result.destination.index, 0, reordered);
			}
			const adjusted = newItems.map((item: NameItem, index: number) => ({
				...item,
				rating: Math.round(1000 + (1000 * (newItems.length - index)) / newItems.length),
			}));
			setHasUnsavedChanges(true);
			setItems(adjusted);
		};

		return (
			<Card
				className={`ranking-adjustment ${isDragging ? "is-dragging" : ""}`}
				padding="xl"
				shadow="xl"
			>
				<header className="ranking-header">
					<h2>Your Cat Name Rankings</h2>
					{saveStatus && (
						<div className={`save-status ${saveStatus}`}>
							{saveStatus === "saving"
								? "Saving..."
								: saveStatus === "success"
									? "Saved!"
									: "Error saving"}
						</div>
					)}
				</header>
				<div className="rankings-grid">
					<DragDropContext onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
						<Droppable droppableId="rankings">
							{(provided) => (
								<div {...provided.droppableProps} ref={provided.innerRef} className="rankings-list">
									{items.map((item: NameItem, index: number) => (
										<Draggable
											key={item.id || item.name}
											draggableId={String(item.id || item.name)}
											index={index}
										>
											{(provided, snapshot) => (
												<div
													ref={provided.innerRef}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
													className={`ranking-card ${snapshot.isDragging ? "dragging" : ""}`}
												>
													<RankingItemContent item={item} index={index} />
												</div>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</DragDropContext>
				</div>
				<div className="adjustment-controls">
					<Button onClick={onCancel} variant="secondary">
						Back to Tournament
					</Button>
				</div>
			</Card>
		);
	},
);
RankingAdjustment.displayName = "RankingAdjustment";
