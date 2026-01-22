import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import Button from "@/components/Button";
import Card from "@/components/Card";
import CatImage from "@/components/CatImage";

import { ErrorManager } from "@/services/errorManager";
import type { NameItem } from "@/types/components";
import { playSound } from "@/utils/soundManager";

import { getRandomCatImage } from "./TournamentLogic";
import styles from "./tournament.module.css";

import "./TournamentRankingAdjustment.css";

/* =========================================================================
   COMPONENTS
   ========================================================================= */

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
