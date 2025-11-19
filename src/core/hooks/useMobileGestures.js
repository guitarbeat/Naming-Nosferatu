/**
 * @module useMobileGestures
 * @description React hook for mobile gesture interactions
 */

import { useEffect, useRef, useCallback } from "react";
import mobileGestures from "../../shared/utils/mobileGestures";

/**
 * Custom hook for mobile gesture interactions
 * @param {Object} options - Gesture options
 * @returns {Object} Gesture handlers and utilities
 */
function useMobileGestures(options = {}) {
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

  const gestureIds = useRef([]);
  const elementRef = useRef(null);

  // Register gesture handlers
  useEffect(() => {
    const newGestureIds = [];

    if (enableSwipe && onSwipe) {
      const swipeId = mobileGestures.register(
        "swipe",
        (data) => {
          if (hapticFeedback) {
            mobileGestures.addHapticFeedback("light");
          }
          onSwipe(data);
        },
        { preventDefault },
      );
      newGestureIds.push(swipeId);
    }

    if (enablePinch && onPinch) {
      const pinchId = mobileGestures.register(
        "pinch",
        (data) => {
          if (hapticFeedback) {
            mobileGestures.addHapticFeedback("medium");
          }
          onPinch(data);
        },
        { preventDefault },
      );
      newGestureIds.push(pinchId);
    }

    if (enableLongPress && onLongPress) {
      const longPressId = mobileGestures.register(
        "longPress",
        (data) => {
          if (hapticFeedback) {
            mobileGestures.addHapticFeedback("heavy");
          }
          onLongPress(data);
        },
        { preventDefault },
      );
      newGestureIds.push(longPressId);
    }

    if (enableTap && onTap) {
      const tapId = mobileGestures.register(
        "tap",
        (data) => {
          if (hapticFeedback) {
            mobileGestures.addHapticFeedback("light");
          }
          onTap(data);
        },
        { preventDefault },
      );
      newGestureIds.push(tapId);
    }

    if (enableDoubleTap && onDoubleTap) {
      const doubleTapId = mobileGestures.register(
        "doubleTap",
        (data) => {
          if (hapticFeedback) {
            mobileGestures.addHapticFeedback("success");
          }
          onDoubleTap(data);
        },
        { preventDefault },
      );
      newGestureIds.push(doubleTapId);
    }

    gestureIds.current = newGestureIds;

    return () => {
      newGestureIds.forEach((id) => mobileGestures.unregister(id));
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

  // Attach event listeners to element
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e) => mobileGestures.handleTouchStart(e);
    const handleTouchMove = (e) => mobileGestures.handleTouchMove(e);
    const handleTouchEnd = (e) => mobileGestures.handleTouchEnd(e);

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

  // Utility functions
  const addHapticFeedback = useCallback((type) => {
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

export default useMobileGestures;
