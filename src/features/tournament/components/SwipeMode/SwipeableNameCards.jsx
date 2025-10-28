/**
 * @module TournamentSetup/components/SwipeableNameCards
 * @description Swipeable card interface for name selection
 */
import { useState } from "react";
import PropTypes from "prop-types";
import useMobileGestures from "../../../../core/hooks/useMobileGestures";
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
  const { elementRef: gestureRef, addHapticFeedback } = useMobileGestures({
    enableSwipe: true,
    enableLongPress: true,
    enableDoubleTap: true,
    onSwipe: (data) => {
      const { direction, distance } = data;
      if (distance > 100) {
        if (direction === "right") {
          // Swipe right = select
          if (!isSelected) {
            onToggleName(currentName);
            addHapticFeedback("success");
          }
        } else if (direction === "left") {
          // Swipe left = deselect
          if (isSelected) {
            onToggleName(currentName);
            addHapticFeedback("light");
          }
        }
        // Move to next card
        if (currentIndex < names.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }
    },
    onLongPress: () => {
      setIsLongPressing(true);
      addHapticFeedback("heavy");
      // Show additional info or context menu
      setTimeout(() => setIsLongPressing(false), 1000);
    },
    onDoubleTap: () => {
      // Double tap to toggle selection
      onToggleName(currentName);
      addHapticFeedback("success");
    },
  });

  const handleDragStart = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
    setSwipeDirection(null);
    setSwipeProgress(0);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;

    const touch = e.touches ? e.touches[0] : e;
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;

    setDragOffset({ x: deltaX, y: deltaY });

    // Calculate swipe progress (0-1)
    const progress = Math.min(Math.abs(deltaX) / 150, 1);
    setSwipeProgress(progress);

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      setSwipeDirection(deltaX > 0 ? "right" : "left");
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) {
      return;
    }

    setIsDragging(false);

    // If swiped far enough, process the swipe
    if (swipeProgress > 0.5) {
      if (swipeDirection === "right") {
        // Swipe right = select/like (add to tournament)
        if (!isSelected) {
          onToggleName(currentName);
        }
      } else if (swipeDirection === "left") {
        // Swipe left = pass (remove from tournament if selected)
        if (isSelected) {
          onToggleName(currentName);
        }
      }

      // Move to next card
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % names.length);
        setDragOffset({ x: 0, y: 0 });
        setSwipeDirection(null);
        setSwipeProgress(0);
      }, 300);
    } else {
      // Reset card position
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

