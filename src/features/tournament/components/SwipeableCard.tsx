import type { PanInfo } from "framer-motion";
import { motion } from "framer-motion";
import React, { useCallback } from "react";
import CatImage from "../../../shared/components/CatImage";
import type { NameItem } from "../../../types/components";
import styles from "../tournament.module.css";
import { getRandomCatImage } from "../utils/tournamentUtils";

interface SwipeableCardProps {
	card: NameItem;
	index: number;
	isSelected: boolean;
	isDragging: boolean;
	dragDirection: "left" | "right" | null;
	totalCards: number;
	showCatPictures: boolean;
	imageList: string[];
	onDragStart: (id: string) => void;
	onDragEnd: (id: string, info: PanInfo) => void;
}

const SwipeableCard = React.memo(
	({
		card,
		index,
		isSelected,
		isDragging,
		dragDirection,
		totalCards,
		showCatPictures,
		imageList,
		onDragStart,
		onDragEnd,
	}: SwipeableCardProps) => {
		const cardId = String(card.id);

		const handleDragStart = useCallback(() => {
			onDragStart(cardId);
		}, [cardId, onDragStart]);

		const handleDragEnd = useCallback(
			(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
				onDragEnd(cardId, info);
			},
			[cardId, onDragEnd],
		);

		return (
			<motion.div
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
					className={`${styles.swipeCard} ${isSelected ? styles.selected : ""} ${isDragging ? styles.longPressing : ""} ${index > 0 ? styles.stacked : ""}`}
					data-direction={isDragging ? dragDirection : undefined}
					drag="x"
					dragConstraints={{ left: 0, right: 0 }}
					dragElastic={0.2}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					initial={{ opacity: 1, scale: 1 }}
					animate={{
						opacity: isDragging ? 0.9 : index === 0 ? 1 : 0.85,
						scale: isDragging ? 1.02 : index === 0 ? 1 : 0.92,
						y: index === 0 ? 0 : index * 16,
						rotate: index === 0 ? 0 : index * 2,
						zIndex: totalCards - index,
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
						className={`${styles.selectionIndicator} ${isSelected ? styles.selected : ""}`}
						aria-hidden="true"
					>
						✓ Selected
					</div>
				</motion.div>
			</motion.div>
		);
	},
);

SwipeableCard.displayName = "SwipeableCard";

export default SwipeableCard;
