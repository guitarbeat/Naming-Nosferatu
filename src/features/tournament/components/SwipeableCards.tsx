import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import type { NameItem } from "../../../types/components";
import CatImage from "../../../shared/components/CatImage/CatImage";
import Button from "../../../shared/components/Button/Button";
import { playSound } from "../../../shared/utils/soundManager";
import { getRandomCatImage } from "../tournamentUtils";
import styles from "../styles/SetupSwipe.module.css";

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
			if (isProcessing) return;

			const offset = info.offset.x;
			const card = names.find((n) => String(n.id) === cardId);

			if (!card) return;

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

				// Right swipe: select card
				if (offset > SwipeThreshold) {
					setDragDirection("right");
					playSound("gameboy-pluck");

					// Only select if not already selected
					if (!isSelected(card)) {
						onToggleName(card);
					}
				}
				// Left swipe: skip card (just mark as swiped, no selection change)
				else if (offset < -SwipeThreshold) {
					setDragDirection("left");
					playSound("wow");
				}

				// Mark card as swiped and animate it out
				setTimeout(() => {
					setSwipedIds((prev) => new Set([...prev, String(card.id)]));
					setDraggedId(null);
					setDragDirection(null);
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

	const handleCardClick = useCallback(
		(card: NameItem) => {
			playSound("gameboy-pluck");
			onToggleName(card);
		},
		[onToggleName],
	);

	const handleUndo = useCallback(() => {
		if (undoStackRef.current.length === 0) return;

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

	const progressPercentage = names.length > 0 ? ((swipedIds.size / names.length) * 100) : 0;

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
				<AnimatePresence mode="wait">
					{visibleCards.length > 0 ? (
						visibleCards.map((card, index) => {
							const cardId = String(card.id);
							const isCardSelected = isSelected(card);
							const isDragging = draggedId === cardId;

							return (
								<div key={cardId} className={styles.swipeCardWrapper}>
									<motion.div
										className={`${styles.swipeCard} ${isCardSelected ? styles.selected : ""} ${isDragging ? styles.longPressing : ""}`}
										data-direction={isDragging ? dragDirection : undefined}
										drag="x"
										dragConstraints={{ left: 0, right: 0 }}
										dragElastic={0.2}
										onDragStart={() => setDraggedId(cardId)}
										onDragEnd={(_, info) => handleDragEnd(cardId, info)}
										initial={{ opacity: 1, scale: 1 }}
										animate={{
											opacity: isDragging ? 0.9 : 1,
											scale: isDragging ? 1.02 : index === 0 ? 1 : 0.95,
											y: index === 0 ? 0 : index * 8,
											zIndex: visibleCards.length - index,
										}}
										exit={{
											opacity: 0,
											scale: 0.8,
											x: dragDirection === "right" ? 300 : -300,
											transition: { duration: 0.3 },
										}}
										transition={{ type: "spring", stiffness: 300, damping: 30 }}
										style={{
											position: "absolute",
											inset: 0,
											width: "100%",
											height: "100%",
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
											<h2 className={styles.swipeCardName}>{card.name}</h2>

											{/* Description */}
											{card.description && (
												<p className={styles.swipeCardDescription}>{card.description}</p>
											)}

											{/* Metadata */}
											{card.category && (
												<div className={styles.swipeCardMetadata}>
													<span className={styles.metadataItem}>{card.category}</span>
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
								</div>
							);
						})
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
