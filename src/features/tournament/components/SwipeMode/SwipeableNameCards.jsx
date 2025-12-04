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
  // * Disable useMobileGestures swipe handling - we handle it manually for better control
  const { elementRef: gestureRef, addHapticFeedback } = useMobileGestures({
    enableSwipe: false, // * Disabled - using manual drag handlers instead
    enableLongPress: true,
    enableDoubleTap: true,
    onSwipe: (data) => {
      const { direction, distance } = data;
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "SwipeableNameCards.jsx:42",
            message: "useMobileGestures onSwipe called",
            data: {
              direction,
              distance,
              currentIndex,
              currentNameId: currentName?.id,
              isSelected,
              selectedNamesCount: selectedNames.length,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "B",
          }),
        }
      ).catch(() => {});
      // #endregion
      if (distance > 100) {
        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "SwipeableNameCards.jsx:53",
              message: "useMobileGestures swipe detected",
              data: {
                direction,
                distance,
                currentIndex,
                currentNameId: currentName?.id,
                isSelected,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "B",
            }),
          }
        ).catch(() => {});
        // #endregion

        if (direction === "right") {
          // Swipe right = select/like (add to tournament)
          if (!isSelected) {
            // #region agent log
            fetch(
              "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  location: "SwipeableNameCards.jsx:57",
                  message: "useMobileGestures calling onToggleName right",
                  data: { currentNameId: currentName?.id, isSelected },
                  timestamp: Date.now(),
                  sessionId: "debug-session",
                  runId: "run1",
                  hypothesisId: "B",
                }),
              }
            ).catch(() => {});
            // #endregion
            onToggleName(currentName);
            addHapticFeedback("success");
          }
        } else if (direction === "left") {
          // Swipe left = pass (remove from tournament if selected)
          if (isSelected) {
            // #region agent log
            fetch(
              "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  location: "SwipeableNameCards.jsx:64",
                  message: "useMobileGestures calling onToggleName left",
                  data: { currentNameId: currentName?.id, isSelected },
                  timestamp: Date.now(),
                  sessionId: "debug-session",
                  runId: "run1",
                  hypothesisId: "B",
                }),
              }
            ).catch(() => {});
            // #endregion
            onToggleName(currentName);
            addHapticFeedback("light");
          }
        }
        // * Always move to next card after valid swipe (like Tinder)
        // * Use functional update to avoid stale closure
        setCurrentIndex((prev) => {
          const nextIndex = prev < names.length - 1 ? prev + 1 : prev;
          // #region agent log
          fetch(
            "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "SwipeableNameCards.jsx:72",
                message: "useMobileGestures advancing card",
                data: { prev, nextIndex, namesLength: names.length },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run1",
                hypothesisId: "B",
              }),
            }
          ).catch(() => {});
          // #endregion
          return nextIndex;
        });
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
    // * Prevent default to avoid text selection and scrolling
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches ? e.touches[0] : e;
    const startX = touch.clientX || touch.pageX;
    const startY = touch.clientY || touch.pageY;

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "SwipeableNameCards.jsx:77",
        message: "handleDragStart entry",
        data: {
          currentIndex,
          currentNameId: currentName?.id,
          isSelected,
          selectedNamesCount: selectedNames.length,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion

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

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "SwipeableNameCards.jsx:120",
        message: "handleDragEnd entry",
        data: {
          swipeProgress,
          swipeDirection,
          isSelected,
          currentIndex,
          currentNameId: currentName?.id,
          selectedNamesCount: selectedNames.length,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion

    setIsDragging(false);

    // Capture current values to avoid stale closure
    const capturedSwipeProgress = swipeProgress;
    const capturedSwipeDirection = swipeDirection;
    const capturedCurrentName = currentName;
    const capturedIsSelected = isSelected;

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "SwipeableNameCards.jsx:159",
        message: "handleDragEnd captured values",
        data: {
          capturedSwipeProgress,
          capturedSwipeDirection,
          capturedIsSelected,
          currentNameId: capturedCurrentName?.id,
          currentIndex,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion

    // If swiped far enough, process the swipe (like Tinder - always advance after valid swipe)
    if (capturedSwipeProgress > 0.5 && capturedSwipeDirection) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "SwipeableNameCards.jsx:165",
            message: "Swipe threshold met - processing",
            data: {
              capturedSwipeProgress,
              capturedSwipeDirection,
              capturedIsSelected,
              currentNameId: capturedCurrentName?.id,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "A",
          }),
        }
      ).catch(() => {});
      // #endregion

      // Process selection based on swipe direction
      if (capturedSwipeDirection === "right") {
        // Swipe right = select/like (add to tournament)
        if (!capturedIsSelected) {
          // #region agent log
          fetch(
            "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "SwipeableNameCards.jsx:170",
                message: "Calling onToggleName for right swipe",
                data: {
                  currentNameId: capturedCurrentName?.id,
                  capturedIsSelected,
                },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run1",
                hypothesisId: "A",
              }),
            }
          ).catch(() => {});
          // #endregion
          onToggleName(capturedCurrentName);
        }
      } else if (capturedSwipeDirection === "left") {
        // Swipe left = pass (remove from tournament if selected)
        if (capturedIsSelected) {
          // #region agent log
          fetch(
            "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "SwipeableNameCards.jsx:177",
                message: "Calling onToggleName for left swipe",
                data: {
                  currentNameId: capturedCurrentName?.id,
                  capturedIsSelected,
                },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run1",
                hypothesisId: "A",
              }),
            }
          ).catch(() => {});
          // #endregion
          onToggleName(capturedCurrentName);
        }
      }

      // * Always move to next card after valid swipe (like Tinder)
      setTimeout(() => {
        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "SwipeableNameCards.jsx:185",
              message: "setTimeout callback - advancing card",
              data: { namesLength: names.length },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "A",
            }),
          }
        ).catch(() => {});
        // #endregion
        // * Use functional update to avoid stale closure
        setCurrentIndex((prev) => {
          const nextIndex = prev < names.length - 1 ? prev + 1 : prev;
          // #region agent log
          fetch(
            "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "SwipeableNameCards.jsx:189",
                message: "setCurrentIndex functional update",
                data: { prev, nextIndex, namesLength: names.length },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run1",
                hypothesisId: "A",
              }),
            }
          ).catch(() => {});
          // #endregion
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
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "SwipeableNameCards.jsx:164",
        message: "handleSwipeButton entry",
        data: {
          direction,
          currentIndex,
          currentNameId: currentName?.id,
          isSelected,
          selectedNamesCount: selectedNames.length,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "D",
      }),
    }).catch(() => {});
    // #endregion
    setSwipeDirection(direction);
    setSwipeProgress(1);

    setTimeout(() => {
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "SwipeableNameCards.jsx:168",
            message: "handleSwipeButton setTimeout callback",
            data: {
              direction,
              currentIndex,
              currentNameId: currentName?.id,
              isSelected,
              namesLength: names.length,
              willWrap: true,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "D",
          }),
        }
      ).catch(() => {});
      // #endregion
      if (direction === "right") {
        // Right button = select/like (add to tournament)
        if (!isSelected) {
          // #region agent log
          fetch(
            "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "SwipeableNameCards.jsx:171",
                message: "handleSwipeButton calling onToggleName right",
                data: { currentNameId: currentName?.id, isSelected },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run1",
                hypothesisId: "D",
              }),
            }
          ).catch(() => {});
          // #endregion
          onToggleName(currentName);
        }
      } else if (direction === "left") {
        // Left button = pass (remove from tournament if selected)
        if (isSelected) {
          // #region agent log
          fetch(
            "http://127.0.0.1:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "SwipeableNameCards.jsx:176",
                message: "handleSwipeButton calling onToggleName left",
                data: { currentNameId: currentName?.id, isSelected },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run1",
                hypothesisId: "D",
              }),
            }
          ).catch(() => {});
          // #endregion
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
