/**
 * @module TournamentSetup/components/SwipeableNameCards
 * @description Swipeable card interface for name selection
 */
import { useState } from "react";
import PropTypes from "prop-types";
import useMobileGestures from "../../../../core/hooks/useMobileGestures";
import { TIMING } from "../../../../core/constants";
import { getRandomCatImage } from "../../utils";
import { CAT_IMAGES } from "../../constants";
import SwipeCard from "./SwipeCard";
import SwipeControls from "./SwipeControls";
import styles from "../../TournamentSetup.module.css";

function SwipeableNameCards({
  names,
  selectedNames,
  onToggleName,
  isAdmin,
  showCatPictures = false,
  imageList = CAT_IMAGES,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const currentName = names[currentIndex];
  const isSelected = selectedNames.some((n) => n.id === currentName?.id);
  const imageSrc =
    showCatPictures && currentName
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

  const handleDragStart = (e) => {
    // * Prevent default to avoid text selection and scrolling
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches ? e.touches[0] : e;
    const startX = touch.clientX || touch.pageX;
    const startY = touch.clientY || touch.pageY;

    setDragStart({ x: startX, y: startY });
    setIsDragging(true);
    setSwipeDirection(null);
    setSwipeProgress(0);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;

    // * Prevent default to avoid scrolling
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches ? e.touches[0] : e;
    const currentX = touch.clientX || touch.pageX;
    const currentY = touch.clientY || touch.pageY;
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

  const handleDragEnd = (e) => {
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

  const handleSwipeButton = (direction) => {
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

  if (!currentName) return null;

  return (
    <div className={styles.swipeContainer}>
      <SwipeCard
        name={currentName}
        isSelected={isSelected}
        swipeDirection={swipeDirection}
        swipeProgress={swipeProgress}
        dragOffset={dragOffset}
        isDragging={isDragging}
        isLongPressing={isLongPressing}
        showCatPictures={showCatPictures}
        imageSrc={imageSrc}
        isAdmin={isAdmin}
        gestureRef={gestureRef}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />

      <SwipeControls
        onSwipeLeft={() => handleSwipeButton("left")}
        onSwipeRight={() => handleSwipeButton("right")}
        currentIndex={currentIndex}
        totalCount={names.length}
      />
    </div>
  );
}

SwipeableNameCards.propTypes = {
  names: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedNames: PropTypes.arrayOf(PropTypes.object).isRequired,
  onToggleName: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
  showCatPictures: PropTypes.bool,
  imageList: PropTypes.arrayOf(PropTypes.string),
};

export default SwipeableNameCards;
