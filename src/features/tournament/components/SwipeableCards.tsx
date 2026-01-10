import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import Button from "../../../shared/components/Button";
import CatImage from "../../../shared/components/CatImage";
import { playSound } from "../../../shared/utils/soundManager";
import type { NameItem } from "../../../types/components";
import styles from "../tournament.module.css";
import { getRandomCatImage } from "../utils/tournamentUtils";

interface SwipeableCardsProps {
	names: NameItem[];
	selectedNames: NameItem[];
	onToggleName: (name: NameItem) => void;
	onRateName: (name: NameItem, rating: number) => void;
	isAdmin: boolean;
	isSelectionMode: boolean;
	showCatPictures: boolean;
	imageList?: string[];
	onStartTournament?: (selectedNames: NameItem[]) => void;
}

export function SwipeableCards({
	names,
	selectedNames,
	onToggleName,
	onRateName: _onRateName,
	isAdmin: _isAdmin,
	isSelectionMode: _isSelectionMode,
	showCatPictures,
	imageList = [],
	onStartTournament,
}: SwipeableCardsProps) {
	const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const undoStackRef = useRef<NameItem[]>([]);

	const SwipeThreshold = 100;

	// Get visible cards (not yet swiped)
	const visibleCards = useMemo(() => {
		return names.filter((name) => !swipedIds.has(String(name.id)));
	}, [names, swipedIds]);

	const isSelected = useCallback(
		(name: NameItem) => selectedNames.some((s) => s.id === name.id),
		[selectedNames],
	);

	const handleDragEnd = useCallback(
		async (cardId: string, info: PanInfo) => {
			if (isProcessing) {
				return;
			}

			const offset = info.offset.x;
			const card = names.find((n) => String(n.id) === cardId);

			if (!card) {
				return;
			}

			// Check if swipe exceeds threshold
			if (Math.abs(offset) < SwipeThreshold) {
				setDraggedId(null);
				setDragDirection(null);
				return;
			}

			setIsProcessing(true);

			try {
				// Save to undo stack
				undoStackRef.current = [...undoStackRef.current, card];

				let shouldSelect = false;

				// Right swipe: select card
				if (offset > SwipeThreshold) {
					setDragDirection("right");
					playSound("gameboy-pluck");

					// Only select if not already selected
					if (!isSelected(card)) {
						shouldSelect = true;
					}
				}
				// Left swipe: skip card (just mark as swiped, no selection change)
				else if (offset < -SwipeThreshold) {
					setDragDirection("left");
					playSound("wow");
				}

				// Mark card as swiped and animate it out, then update selection
				setSwipedIds((prev) => new Set([...prev, String(card.id)]));

				setTimeout(() => {
					setDraggedId(null);
					setDragDirection(null);

					// Update selection after animation completes to prevent reload
					if (shouldSelect) {
						onToggleName(card);
					}

					setIsProcessing(false);
				}, 300);
			} catch (error) {
				console.error("Error handling swipe:", error);
				setIsProcessing(false);
				setDraggedId(null);
				setDragDirection(null);
			}
		},
		[names, isProcessing, isSelected, onToggleName],
	);

	const handleUndo = useCallback(() => {
		if (undoStackRef.current.length === 0) {
			return;
		}

		const cardToRestore = undoStackRef.current.pop();
		if (cardToRestore) {
			setSwipedIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(String(cardToRestore.id));
				return newSet;
			});
			playSound("wow");
		}
	}, []);

	const progressPercentage = names.length > 0 ? (swipedIds.size / names.length) * 100 : 0;

	if (names.length === 0) {
		return (
			<div className={styles.swipeContainer}>
				<div className={styles.swipeCompletion}>
					<p>No names available to swipe.</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.swipeContainer}>
			{/* Instructions */}
			<div className={styles.swipeModeInstructions}>
				<p>
					👉 <strong>Drag right to select</strong> • <strong>Drag left to skip</strong>
				</p>
			</div>

			{/* Progress Bar */}
			<div className={styles.cardProgress}>
				<div
					style={{
						width: "100%",
						height: "4px",
						backgroundColor: "var(--surface-muted)",
						borderRadius: "2px",
						overflow: "hidden",
						marginBottom: "8px",
					}}
				>
					<div
						style={{
							width: `${progressPercentage}%`,
							height: "100%",
							backgroundColor: "var(--color-warning)",
							transition: "width 0.3s ease-out",
						}}
					/>
				</div>
				<span>
					{swipedIds.size} of {names.length} reviewed • {selectedNames.length} selected
				</span>
			</div>

			{/* Card Stack */}
			<div className={styles.swipeStack}>
				{/* Stack indicator */}
				{visibleCards.length > 1 && (
					<div className={styles.stackIndicator}>
						<span className={styles.stackCount}>{visibleCards.length - 1}</span>
						<span className={styles.stackLabel}>more cards</span>
					</div>
				)}
				<AnimatePresence mode="popLayout">
					{names.length > 0 ? (
						(() => {
							const visibleCards = names.filter((card) => !swipedIds.has(String(card.id)));
							return visibleCards.map((card, index) => {
								const cardId = String(card.id);
								const isCardSelected = isSelected(card);
								const isDragging = draggedId === cardId;

								return (
									<motion.div
										key={cardId}
										layout={true}
										layoutId={cardId}
										className={styles.swipeCardWrapper}
										initial={{ opacity: 1, scale: 1 }}
										exit={{
											opacity: 0,
											scale: 0.8,
											x: dragDirection === "right" ? 300 : -300,
											transition: { duration: 0.3 },
										}}
									>
										<motion.div
											layout={true}
											className={`${styles.swipeCard} ${isCardSelected ? styles.selected : ""} ${isDragging ? styles.longPressing : ""} ${index > 0 ? styles.stacked : ""}`}
											data-direction={isDragging ? dragDirection : undefined}
											drag="x"
											dragConstraints={{ left: 0, right: 0 }}
											dragElastic={0.2}
											onDragStart={() => setDraggedId(cardId)}
											onDragEnd={(_, info) => handleDragEnd(cardId, info)}
											initial={{ opacity: 1, scale: 1 }}
											animate={{
												opacity: isDragging ? 0.9 : index === 0 ? 1 : 0.85,
												scale: isDragging ? 1.02 : index === 0 ? 1 : 0.92,
												y: index === 0 ? 0 : index * 16,
												rotate: index === 0 ? 0 : index * 2,
												zIndex: visibleCards.length - index,
											}}
											transition={{ type: "spring", stiffness: 300, damping: 30 }}
											style={{
												position: "absolute",
												inset: 0,
												width: "100%",
												height: "100%",
												transformOrigin: "center bottom",
											}}
										>
											{/* Card Content */}
											<div className={styles.swipeCardContent}>
												{/* Image */}
												{showCatPictures && card.id && (
													<div className={styles.swipeCardImageContainer}>
														<CatImage
															src={getRandomCatImage(String(card.id), imageList)}
															containerClassName={styles.swipeCardImageContainer}
															imageClassName={styles.swipeCardImage}
														/>
													</div>
												)}

												{/* Name */}
												<h2
													className={styles.swipeCardName}
													data-card-name={String(card.name)}
													data-name-id={String(card.id)}
												>
													{String(card.name)}
												</h2>

												{/* Description */}
												{card.description && (
													<p className={styles.swipeCardDescription}>{String(card.description)}</p>
												)}

												{/* Metadata */}
												{card.categories && card.categories.length > 0 && (
													<div className={styles.swipeCardMetadata}>
														<span className={styles.metadataItem}>{card.categories[0]}</span>
													</div>
												)}
											</div>

											{/* Swipe Direction Overlay */}
											{isDragging && (
												<div
													className={`${styles.swipeOverlay} ${dragDirection ? styles.active : ""} ${dragDirection === "right" ? styles.swipeRight : dragDirection === "left" ? styles.swipeLeft : ""}`}
												>
													<span className={styles.swipeText}>
														{dragDirection === "right" ? "SELECT ✓" : "SKIP ✕"}
													</span>
												</div>
											)}

											{/* Selection Indicator */}
											<div
												className={`${styles.selectionIndicator} ${isCardSelected ? styles.selected : ""}`}
												aria-hidden="true"
											>
												✓ Selected
											</div>
										</motion.div>
									</motion.div>
								);
							});
						})()
					) : (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className={styles.swipeCompletion}
						>
							<h2>All names reviewed!</h2>
							<p>
								You selected <strong>{selectedNames.length}</strong> name
								{selectedNames.length !== 1 ? "s" : ""}
							</p>
							{selectedNames.length >= 2 && onStartTournament && (
								<Button
									onClick={() => onStartTournament(selectedNames)}
									className={styles.startTournamentButton}
								>
									Start Tournament
								</Button>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Action Buttons */}
			{visibleCards.length > 0 && (
				<div className={styles.swipeButtons}>
					<button
						type="button"
						onClick={handleUndo}
						disabled={undoStackRef.current.length === 0}
						className={styles.swipeUndoButton}
						aria-label="Undo last swipe"
					>
						↶ Undo
					</button>
					{selectedNames.length >= 2 && onStartTournament && (
						<button
							type="button"
							onClick={() => onStartTournament(selectedNames)}
							className={styles.swipeButton}
							aria-label={`Start tournament with ${selectedNames.length} names`}
						>
							Start Tournament
						</button>
					)}
				</div>
			)}
		</div>
	);
}
