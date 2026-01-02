/**
 * @module TournamentSetup/components/SwipeableNameCards
 * @description Swipeable card interface for name selection
 */
import { useState } from "react";
import { TIMING } from "../../../../core/constants";
import type { NameItem } from "../../../../shared/propTypes";
import { CAT_IMAGES, getRandomCatImage } from "../../config";
import styles from "../../TournamentSetup.module.css";
import { SwipeCard, SwipeControls, useMobileGestures } from "./SwipeComponents";

interface SwipeableNameCardsProps {
	names: NameItem[];
	selectedNames: NameItem[];
	onToggleName: (name: NameItem) => void;
	isAdmin?: boolean;
	showCatPictures?: boolean;
	imageList?: string[];
	onStartTournament?: (names: NameItem[]) => void;
}

function SwipeableNameCards({
	names,
	selectedNames,
	onToggleName,
	isAdmin,
	showCatPictures = false,
	imageList = CAT_IMAGES,
	onStartTournament,
}: SwipeableNameCardsProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
		null,
	);
	const [swipeProgress, setSwipeProgress] = useState(0);
	const [isLongPressing, setIsLongPressing] = useState(false);

	const currentName = names[currentIndex];
	const nextName = names[currentIndex + 1];
	const nextImageSrc =
		showCatPictures && nextName && imageList && imageList.length > 0
			? getRandomCatImage(nextName.id, imageList)
			: null;
	const isSelected = selectedNames.some((n) => n.id === currentName?.id);
	const imageSrc =
		showCatPictures && currentName && imageList && imageList.length > 0
			? getRandomCatImage(currentName.id, imageList)
			: null;

	// Enhanced mobile gestures
	// * Disable useMobileGestures swipe handling - we handle it manually for better control
	const { elementRef: gestureRef, addHapticFeedback } = useMobileGestures({
		enableSwipe: false, // * Disabled - using manual drag handlers instead
		enableLongPress: true,
		enableDoubleTap: true,
		onSwipe: () => {}, // * Placeholder - swipe disabled
		onLongPress: () => {
			setIsLongPressing(true);
			addHapticFeedback("heavy");
			// Show additional info or context menu
			setTimeout(() => setIsLongPressing(false), TIMING.LONG_PRESS_TIMEOUT_MS);
		},
		onDoubleTap: () => {
			// Double tap to toggle selection
			onToggleName(currentName);
			addHapticFeedback("success");
		},
	});

	const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
		// * Prevent default to avoid text selection and scrolling
		e.preventDefault();
		e.stopPropagation();

		const touch =
			"touches" in e && e.touches ? e.touches[0] : (e as React.MouseEvent);
		const startX =
			"clientX" in touch ? touch.clientX : (touch as Touch).clientX;
		const startY =
			"clientY" in touch ? touch.clientY : (touch as Touch).clientY;

		setDragStart({ x: startX, y: startY });
		setIsDragging(true);
		setSwipeDirection(null);
		setSwipeProgress(0);
		setDragOffset({ x: 0, y: 0 });
	};

	const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
		if (!isDragging) return;

		// * Prevent default to avoid scrolling
		e.preventDefault();
		e.stopPropagation();

		const touch =
			"touches" in e && e.touches ? e.touches[0] : (e as React.MouseEvent);
		const currentX =
			"clientX" in touch ? touch.clientX : (touch as Touch).clientX;
		const currentY =
			"clientY" in touch ? touch.clientY : (touch as Touch).clientY;
		const deltaX = currentX - dragStart.x;
		const deltaY = currentY - dragStart.y;

		setDragOffset({ x: deltaX, y: deltaY });

		// Calculate swipe progress (0-1)
		const progress = Math.min(Math.abs(deltaX) / 150, 1);
		setSwipeProgress(progress);

		// Determine swipe direction
		if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
			setSwipeDirection(deltaX > 0 ? "right" : "left");
		} else {
			setSwipeDirection(null);
		}
	};

	const handleDragEnd = (e?: React.MouseEvent | React.TouchEvent) => {
		if (!isDragging) {
			return;
		}

		// * Prevent default
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}

		setIsDragging(false);

		// Capture current values to avoid stale closure
		const capturedSwipeProgress = swipeProgress;
		const capturedSwipeDirection = swipeDirection;
		const capturedCurrentName = currentName;
		const capturedIsSelected = isSelected;

		// If swiped far enough, process the swipe (like Tinder - always advance after valid swipe)
		if (capturedSwipeProgress > 0.5 && capturedSwipeDirection) {
			// Process selection based on swipe direction
			if (capturedSwipeDirection === "right") {
				// Swipe right = select/like (add to tournament)
				if (!capturedIsSelected) {
					onToggleName(capturedCurrentName);
				}
			} else if (capturedSwipeDirection === "left") {
				// Swipe left = pass (remove from tournament if selected)
				if (capturedIsSelected) {
					onToggleName(capturedCurrentName);
				}
			}

			// * Always move to next card after valid swipe (like Tinder)
			setTimeout(() => {
				// * Use functional update to avoid stale closure
				setCurrentIndex((prev) => {
					const nextIndex = prev < names.length - 1 ? prev + 1 : prev;
					return nextIndex;
				});
				setDragOffset({ x: 0, y: 0 });
				setSwipeDirection(null);
				setSwipeProgress(0);
			}, 300);
		} else {
			// Reset card position with animation
			setDragOffset({ x: 0, y: 0 });
			setSwipeDirection(null);
			setSwipeProgress(0);
		}
	};

	const handleSwipeButton = (direction: "left" | "right") => {
		setSwipeDirection(direction);
		setSwipeProgress(1);

		setTimeout(() => {
			if (direction === "right") {
				// Right button = select/like (add to tournament)
				if (!isSelected) {
					onToggleName(currentName);
				}
			} else if (direction === "left") {
				// Left button = pass (remove from tournament if selected)
				if (isSelected) {
					onToggleName(currentName);
				}
			}

			setCurrentIndex((prev) => (prev + 1) % names.length);
			setDragOffset({ x: 0, y: 0 });
			setSwipeDirection(null);
			setSwipeProgress(0);
		}, 300);
	};

	const handleUndo = () => {
		setCurrentIndex((prev) => Math.max(prev - 1, 0));
		setDragOffset({ x: 0, y: 0 });
		setSwipeDirection(null);
		setSwipeProgress(0);
		setIsDragging(false);
		setIsLongPressing(false);
	};

	if (!currentName) {
		return (
			<div className={styles.swipeContainer}>
				<div className={styles.swipeCompletion}>
					<h3>All caught up!</h3>
					<p>You&apos;ve gone through all available names.</p>
					{selectedNames.length >= 2 ? (
						<button
							className={styles.startTournamentButton}
							onClick={() => onStartTournament?.(selectedNames)}
						>
							Start Tournament ({selectedNames.length} selected)
						</button>
					) : (
						<p>Select at least 2 names to start a tournament.</p>
					)}
					<button className={styles.undoButton} onClick={handleUndo}>
						Undo Last Swipe
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.swipeContainer}>
			<div className={styles.swipeStack} aria-live="polite">
				{nextName ? (
					<SwipeCard
						key={nextName.id ?? `${nextName?.name || "preview"}-next`}
						name={nextName}
						isSelected={selectedNames.some((n) => n.id === nextName?.id)}
						swipeDirection={null}
						swipeProgress={0}
						dragOffset={{ x: 0, y: 0 }}
						isDragging={false}
						isLongPressing={false}
						showCatPictures={showCatPictures}
						imageSrc={nextImageSrc}
						isAdmin={isAdmin ?? false}
						gestureRef={null}
						stackIndex={1}
					/>
				) : null}

				<SwipeCard
					key={currentName?.id ?? `${currentName?.name || "card"}-current`}
					name={currentName}
					isSelected={isSelected}
					swipeDirection={swipeDirection}
					swipeProgress={swipeProgress}
					dragOffset={dragOffset}
					isDragging={isDragging}
					isLongPressing={isLongPressing}
					showCatPictures={showCatPictures}
					imageSrc={imageSrc}
					isAdmin={isAdmin ?? false}
					gestureRef={gestureRef}
					onDragStart={handleDragStart}
					onDragMove={handleDragMove}
					onDragEnd={handleDragEnd}
					stackIndex={0}
				/>
			</div>

			<SwipeControls
				onSwipeLeft={() => handleSwipeButton("left")}
				onSwipeRight={() => handleSwipeButton("right")}
				onUndo={handleUndo}
				currentIndex={currentIndex}
				totalCount={names.length}
			/>
		</div>
	);
}

export default SwipeableNameCards;
