/**
 * @module TournamentSetup/components/SwipeComponents
 * @description Consolidated swipe mode components
 * Includes SwipeCard, SwipeControls, and useMobileGestures hook
 */

import clsx from "clsx";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import type { NameItem } from "../../../../shared/propTypes";
import mobileGestures from "../../../../shared/utils/mobileGestures";
import styles from "../../styles/SetupSwipe.module.css";

// ============================================================================
// Types
// ============================================================================

interface GestureData {
	type: string;
	x?: number;
	y?: number;
	deltaX?: number;
	deltaY?: number;
	distance?: number;
	direction?: string;
	velocity?: number;
	scale?: number;
	[key: string]: unknown;
}

// ============================================================================
// useMobileGestures Hook
// ============================================================================

interface UseMobileGesturesOptions {
	enableSwipe?: boolean;
	enablePinch?: boolean;
	enableLongPress?: boolean;
	enableTap?: boolean;
	enableDoubleTap?: boolean;
	onSwipe?: (data: GestureData) => void;
	onPinch?: (data: GestureData) => void;
	onLongPress?: (data: GestureData) => void;
	onTap?: (data: GestureData) => void;
	onDoubleTap?: (data: GestureData) => void;
	hapticFeedback?: boolean;
	preventDefault?: boolean;
}

/**
 * Custom hook for mobile gesture interactions
 * @param {Object} options - Gesture options
 * @returns {Object} Gesture handlers and utilities
 */
export function useMobileGestures(options: UseMobileGesturesOptions = {}) {
	const {
		enableSwipe = true,
		enablePinch = true,
		enableLongPress = true,
		enableTap = true,
		enableDoubleTap = true,
		onSwipe,
		onPinch,
		onLongPress,
		onTap,
		onDoubleTap,
		hapticFeedback = true,
		preventDefault = true,
	} = options;

	const gestureIds = useRef<string[]>([]);
	const elementRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		const newGestureIds: string[] = [];

		if (enableSwipe && onSwipe) {
			const swipeId = mobileGestures.register(
				"swipe",
				(data: unknown) => {
					if (hapticFeedback) {
						mobileGestures.addHapticFeedback("light");
					}
					onSwipe(data as GestureData);
				},
				{ preventDefault },
			);
			newGestureIds.push(swipeId);
		}

		if (enablePinch && onPinch) {
			const pinchId = mobileGestures.register(
				"pinch",
				(data: unknown) => {
					if (hapticFeedback) {
						mobileGestures.addHapticFeedback("medium");
					}
					onPinch(data as GestureData);
				},
				{ preventDefault },
			);
			newGestureIds.push(pinchId);
		}

		if (enableLongPress && onLongPress) {
			const longPressId = mobileGestures.register(
				"longPress",
				(data: unknown) => {
					if (hapticFeedback) {
						mobileGestures.addHapticFeedback("heavy");
					}
					onLongPress(data as GestureData);
				},
				{ preventDefault },
			);
			newGestureIds.push(longPressId);
		}

		if (enableTap && onTap) {
			const tapId = mobileGestures.register(
				"tap",
				(data: unknown) => {
					if (hapticFeedback) {
						mobileGestures.addHapticFeedback("light");
					}
					onTap(data as GestureData);
				},
				{ preventDefault },
			);
			newGestureIds.push(tapId);
		}

		if (enableDoubleTap && onDoubleTap) {
			const doubleTapId = mobileGestures.register(
				"doubleTap",
				(data: unknown) => {
					if (hapticFeedback) {
						mobileGestures.addHapticFeedback("success");
					}
					onDoubleTap(data as GestureData);
				},
				{ preventDefault },
			);
			newGestureIds.push(doubleTapId);
		}

		gestureIds.current = newGestureIds;

		return () => {
			newGestureIds.forEach((id) => {
				mobileGestures.unregister(id);
			});
		};
	}, [
		enableSwipe,
		enablePinch,
		enableLongPress,
		enableTap,
		enableDoubleTap,
		onSwipe,
		onPinch,
		onLongPress,
		onTap,
		onDoubleTap,
		hapticFeedback,
		preventDefault,
	]);

	useEffect(() => {
		const element = elementRef.current;
		if (!element) {
			return;
		}

		const handleTouchStart = (e: TouchEvent) => mobileGestures.handleTouchStart(e);
		const handleTouchMove = (e: TouchEvent) => mobileGestures.handleTouchMove(e);
		const handleTouchEnd = (e: TouchEvent) => mobileGestures.handleTouchEnd(e);

		element.addEventListener("touchstart", handleTouchStart, {
			passive: false,
		});
		element.addEventListener("touchmove", handleTouchMove, { passive: false });
		element.addEventListener("touchend", handleTouchEnd, { passive: false });

		return () => {
			element.removeEventListener("touchstart", handleTouchStart);
			element.removeEventListener("touchmove", handleTouchMove);
			element.removeEventListener("touchend", handleTouchEnd);
		};
	}, []);

	const addHapticFeedback = useCallback((type: string) => {
		mobileGestures.addHapticFeedback(type);
	}, []);

	const getTouchDeviceInfo = useCallback(() => {
		return mobileGestures.getTouchDeviceInfo();
	}, []);

	const enableGestures = useCallback(() => {
		mobileGestures.enable();
	}, []);

	const disableGestures = useCallback(() => {
		mobileGestures.disable();
	}, []);

	return {
		elementRef,
		addHapticFeedback,
		getTouchDeviceInfo,
		enableGestures,
		disableGestures,
	};
}

// ============================================================================
// SwipeCard Component
// ============================================================================

interface SwipeCardProps {
	name: NameItem | null | undefined;
	isSelected: boolean;
	swipeDirection: "left" | "right" | null;
	swipeProgress: number;
	dragOffset: { x: number; y: number } | null | undefined;
	isDragging: boolean;
	isLongPressing: boolean;
	showCatPictures: boolean;
	imageSrc: string | null | undefined;
	isAdmin?: boolean;
	gestureRef?:
		| RefObject<HTMLElement | null>
		| RefObject<HTMLDivElement>
		| ((instance: HTMLDivElement | null) => void)
		| null;
	onDragStart?: (e: React.MouseEvent | React.TouchEvent) => void;
	onDragMove?: (e: React.MouseEvent | React.TouchEvent) => void;
	onDragEnd?: (e: React.MouseEvent | React.TouchEvent) => void;
	stackIndex?: number;
}

export function SwipeCard({
	name,
	isSelected,
	swipeDirection,
	swipeProgress,
	dragOffset,
	isDragging,
	isLongPressing,
	showCatPictures,
	imageSrc,
	isAdmin,
	gestureRef,
	onDragStart,
	onDragMove,
	onDragEnd,
	stackIndex = 0,
}: SwipeCardProps) {
	const depth = Math.max(0, stackIndex);
	const isTopCard = depth === 0;
	const translateX = dragOffset?.x ?? 0;
	const translateY = dragOffset?.y ?? 0;
	const rotation = Math.max(-15, Math.min(15, translateX / 5));
	const baseOpacity = 1 - Math.min(swipeProgress * 0.4, 0.6);
	const stackedScale = 1 - depth * 0.04;
	const stackedTranslateY = depth * 16;
	const stackedOpacity = isTopCard ? baseOpacity : 0.55;
	const shouldAnimateStack = !isDragging && !isLongPressing;

	const cardClassName = clsx(styles.swipeCard, {
		[styles.withCatPictures]: showCatPictures,
		[styles.selected]: isSelected,
		[styles.longPressing]: isLongPressing,
	});

	return (
		<div className={styles.swipeCardWrapper}>
			<div
				className={cardClassName}
				data-direction={swipeDirection || "neutral"}
				data-selected={isSelected}
				data-dragging={isDragging}
				data-long-pressing={isLongPressing}
				aria-hidden={!isTopCard}
				style={{
					transform: `translate(${translateX}px, ${translateY + stackedTranslateY}px) rotate(${rotation}deg) scale(${stackedScale})`,
					opacity: stackedOpacity,
					zIndex: 8 - depth,
					pointerEvents: isTopCard ? "auto" : "none",
					filter: isTopCard ? "none" : "saturate(0.92) brightness(0.95)",
					transition: shouldAnimateStack
						? "transform 240ms ease, opacity 240ms ease, filter 240ms ease"
						: "none",
				}}
				ref={gestureRef as React.Ref<HTMLDivElement> | undefined}
				onMouseDown={onDragStart}
				onMouseMove={onDragMove}
				onMouseUp={onDragEnd}
				onTouchStart={onDragStart}
				onTouchMove={onDragMove}
				onTouchEnd={onDragEnd}
				role="article"
				aria-label={`Name card for ${name?.name || "Unknown"}`}
			>
				{showCatPictures && imageSrc ? (
					<div className={styles.swipeCardImageContainer}>
						<img
							src={imageSrc}
							alt={`${name?.name || "Cat"} illustration`}
							className={styles.swipeCardImage}
						/>
					</div>
				) : null}

				<div className={styles.swipeCardContent}>
					<div className={styles.swipeCardName}>{name?.name || "Unknown"}</div>
					{name?.description ? (
						<p className={styles.swipeCardDescription}>{name.description}</p>
					) : null}
					{isAdmin ? <span className={styles.swipeCardAdminBadge}>Admin</span> : null}
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// SwipeControls Component
// ============================================================================

interface SwipeControlsProps {
	onSwipeLeft: () => void;
	onSwipeRight: () => void;
	onUndo: () => void;
	currentIndex: number;
	totalCount: number;
}

export function SwipeControls({
	onSwipeLeft,
	onSwipeRight,
	onUndo,
	currentIndex,
	totalCount,
}: SwipeControlsProps) {
	return (
		<div className={styles.swipeButtons} role="group" aria-label="Swipe controls">
			<button
				type="button"
				className={`${styles.swipeButton} ${styles.swipeUndoButton}`}
				onClick={onUndo}
				aria-label="Undo last swipe"
				disabled={currentIndex === 0}
			>
				↩️ Undo
			</button>
			<button
				type="button"
				className={`${styles.swipeButton} ${styles.swipeLeftButton}`}
				onClick={onSwipeLeft}
				aria-label="Reject name"
			>
				❌ Reject
			</button>
			<div className={styles.cardProgress}>
				{currentIndex + 1} / {totalCount}
			</div>
			<button
				type="button"
				className={`${styles.swipeButton} ${styles.swipeRightButton}`}
				onClick={onSwipeRight}
				aria-label="Accept name"
			>
				✅ Accept
			</button>
		</div>
	);
}
