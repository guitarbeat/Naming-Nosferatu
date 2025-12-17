// @ts-nocheck
/**
 * @module useBongoCat
 * @description Custom hook for BongoCat component event handling and positioning with enhanced animations
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ANIMATION_STATES,
  TYPING_SPEED_THRESHOLDS,
  MILESTONE_THRESHOLDS,
  DEFAULT_CONFIG,
} from "../../shared/components/BongoCat/constants";
import { TIMING } from "../../core/constants";

export function useBongoCat({
  containerRef,
  size,
  onBongo,
  reduceMotion: reduceMotionProp = DEFAULT_CONFIG.reduceMotion,
  enableSounds = DEFAULT_CONFIG.enableSounds,
}) {
  const systemPrefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reduceMotion = reduceMotionProp || systemPrefersReducedMotion;
  const [isPawsDown, setIsPawsDown] = useState(false);
  const [containerTop, setContainerTop] = useState(0);
  const [catSize, setCatSize] = useState(size);
  const [isVisible, setIsVisible] = useState(true);
  const [containerZIndex, setContainerZIndex] = useState(0);
  const [animationState, setAnimationState] = useState(ANIMATION_STATES.IDLE);
  const [headTilt, setHeadTilt] = useState(0);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [tailAngle, setTailAngle] = useState(0);
  const [earTwitch, setEarTwitch] = useState(false);

  const lastKeyTimeRef = useRef(0);
  const keysHeldRef = useRef(new Set());
  const resizeObserverRef = useRef(null);
  const typingHistoryRef = useRef([]);
  const characterCountRef = useRef(0);
  const lastBackspaceTimeRef = useRef(0);
  const pauseStartTimeRef = useRef(null);
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (containerRef && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const containerWidth = rect.width;

      const formElement = containerRef.current.querySelector("form");
      let optimalTop = 19;

      if (formElement) {
        const formRect = formElement.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        optimalTop = formRect.top - containerRect.top - 60;
        optimalTop = Math.max(19, optimalTop);
      } else {
        optimalTop = 19;
      }

      if (viewportWidth <= 768) {
        const mobileAdjustment = 5;
        optimalTop += mobileAdjustment;
      }

      setContainerTop(optimalTop);

      const baseSize = size;
      const scaleFactor = Math.min(containerWidth / 500, 1);
      const mobileScaleFactor = viewportWidth <= 768 ? 0.9 : 1.0;
      setCatSize(baseSize * scaleFactor * mobileScaleFactor);

      setIsVisible(rect.top < viewportHeight);

      const containerComputedStyle = window.getComputedStyle(
        containerRef.current,
      );
      const containerZ =
        containerComputedStyle.zIndex === "auto"
          ? 1
          : parseInt(containerComputedStyle.zIndex, 10);
      setContainerZIndex(containerZ);
    }
  }, [containerRef, size]);

  const calculateTypingSpeed = useCallback(() => {
    const now = Date.now();
    const recentHistory = typingHistoryRef.current.filter(
      (entry) => now - entry.time < 2000,
    );
    if (recentHistory.length < 2) return 0;
    const timeSpan = (now - recentHistory[0].time) / 1000;
    return recentHistory.length / timeSpan;
  }, []);

  const checkMilestones = useCallback(
    (count) => {
      const milestone = MILESTONE_THRESHOLDS.find(
        (threshold) =>
          characterCountRef.current < threshold && count >= threshold,
      );
      if (milestone) {
        setAnimationState(ANIMATION_STATES.CELEBRATING);
        setTimeout(() => {
          setAnimationState(ANIMATION_STATES.IDLE);
        }, 2000);
        if (enableSounds) {
          // Sound effect placeholder
        }
      }
    },
    [enableSounds],
  );

  const updateAnimationStateFromSpeed = useCallback(
    (speed: number, now?: number) => {
      if (speed > TYPING_SPEED_THRESHOLDS.FAST) {
        setAnimationState(ANIMATION_STATES.TYPING_FAST);
        if (now !== undefined) {
          setHeadTilt(Math.sin(now / 200) * 5);
        }
      } else if (speed > TYPING_SPEED_THRESHOLDS.SLOW) {
        setAnimationState(ANIMATION_STATES.TYPING_SLOW);
        if (now !== undefined) {
          setHeadTilt(0);
        }
      } else {
        setAnimationState(ANIMATION_STATES.IDLE);
      }
    },
    [],
  );

  const updateCursorPosition = useCallback(
    (e) => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const catCenterX = rect.left + rect.width / 2;
        const catCenterY = rect.top + rect.height / 2;
        const deltaX = e.clientX - catCenterX;
        const deltaY = e.clientY - catCenterY;
        const maxDistance = Math.max(rect.width, rect.height) / 2;
        cursorPositionRef.current = {
          x: Math.max(-1, Math.min(1, deltaX / maxDistance)),
          y: Math.max(-1, Math.min(1, deltaY / maxDistance)),
        };
      }
    },
    [containerRef],
  );

  const animationLoop = useCallback(
    function loop() {
      if (reduceMotion) {
        animationFrameRef.current = null;
        return;
      }

      setEyePosition({
        x: cursorPositionRef.current.x * 2,
        y: cursorPositionRef.current.y * 2,
      });

      const time = Date.now() / 1000;
      const setTailForState = (speed: number, amplitude: number) => {
        setTailAngle(Math.sin(time * speed) * amplitude);
      };
      switch (animationState) {
        case ANIMATION_STATES.TYPING_FAST:
          setTailForState(4, 15);
          break;
        case ANIMATION_STATES.IDLE:
          setTailForState(0.8, 8);
          break;
        case ANIMATION_STATES.SLEEPY:
          setTailForState(0.3, 3);
          break;
        default:
          setTailForState(1.5, 10);
      }

      if (Math.random() < 0.01) {
        setEarTwitch(true);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    },
    [reduceMotion, animationState],
  );

  useEffect(() => {
    if (!earTwitch) return undefined;
    const timer = setTimeout(
      () => setEarTwitch(false),
      TIMING.EAR_TWITCH_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [earTwitch]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
        return;
      }

      const now = Date.now();
      const isBackspace = e.key === "Backspace" || e.key === "Delete";

      if (isBackspace) {
        lastBackspaceTimeRef.current = now;
        setAnimationState(ANIMATION_STATES.BACKSPACE);
        setTimeout(() => {
          const speed = calculateTypingSpeed();
          updateAnimationStateFromSpeed(speed);
        }, 500);
      } else {
        typingHistoryRef.current.push({ time: now });
        if (typingHistoryRef.current.length > 50) {
          typingHistoryRef.current.shift();
        }

        characterCountRef.current += 1;
        checkMilestones(characterCountRef.current);

        const speed = calculateTypingSpeed();
        updateAnimationStateFromSpeed(speed, now);

        pauseStartTimeRef.current = null;
      }

      if (now - lastKeyTimeRef.current > TIMING.PAUSE_CHECK_INTERVAL_MS) {
        lastKeyTimeRef.current = now;
      }

      keysHeldRef.current.add(e.key);
      setIsPawsDown(true);

      if (!isPawsDown && onBongo) {
        onBongo();
      }
    },
    [
      isPawsDown,
      onBongo,
      calculateTypingSpeed,
      checkMilestones,
      updateAnimationStateFromSpeed,
    ],
  );

  const handleKeyUp = useCallback((e) => {
    keysHeldRef.current.delete(e.key);
    if (keysHeldRef.current.size === 0) {
      setIsPawsDown(false);
      pauseStartTimeRef.current = Date.now();
    }
  }, []);

  const scrollTimeoutRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const orientationTimeoutRef = useRef(null);
  const mutationTimeoutRef = useRef(null);

  useEffect(() => {
    const pauseCheckInterval = setInterval(() => {
      if (
        pauseStartTimeRef.current &&
        Date.now() - pauseStartTimeRef.current > 5000 &&
        animationState !== ANIMATION_STATES.SLEEPY &&
        !isPawsDown
      ) {
        setAnimationState(ANIMATION_STATES.SLEEPY);
      } else if (isPawsDown || Date.now() - pauseStartTimeRef.current < 5000) {
        if (animationState === ANIMATION_STATES.SLEEPY) {
          const speed = calculateTypingSpeed();
          updateAnimationStateFromSpeed(speed);
        }
      }
    }, TIMING.PAUSE_CHECK_INTERVAL_MS);

    return () => clearInterval(pauseCheckInterval);
  }, [
    animationState,
    isPawsDown,
    calculateTypingSpeed,
    updateAnimationStateFromSpeed,
  ]);

  useEffect(() => {
    if (!reduceMotion) {
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationLoop, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const handleMouseMove = (e) => {
      requestAnimationFrame(() => updateCursorPosition(e));
    };
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [updateCursorPosition, reduceMotion]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    let cleanupContainerListeners = null;

    if (containerRef && containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(updatePosition);
      resizeObserverRef.current.observe(containerRef.current);

      requestAnimationFrame(updatePosition);

      const handleScroll = () => {
        if (scrollTimeoutRef.current) return;
        scrollTimeoutRef.current = requestAnimationFrame(() => {
          updatePosition();
          scrollTimeoutRef.current = null;
        });
      };

      const handleResize = () => {
        if (resizeTimeoutRef.current) return;
        resizeTimeoutRef.current = requestAnimationFrame(() => {
          updatePosition();
          resizeTimeoutRef.current = null;
        });
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleResize, { passive: true });

      const handleOrientationChange = () => {
        if (orientationTimeoutRef.current) return;
        orientationTimeoutRef.current = setTimeout(() => {
          requestAnimationFrame(updatePosition);
          orientationTimeoutRef.current = null;
        }, 100);
      };

      window.addEventListener("orientationchange", handleOrientationChange);

      const handleMutation = () => {
        if (mutationTimeoutRef.current) return;
        mutationTimeoutRef.current = requestAnimationFrame(() => {
          updatePosition();
          mutationTimeoutRef.current = null;
        });
      };

      const mutationObserver = new MutationObserver(handleMutation);
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: false,
        attributes: false,
      });

      cleanupContainerListeners = () => {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
        }

        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener(
          "orientationchange",
          handleOrientationChange,
        );
        mutationObserver.disconnect();

        if (scrollTimeoutRef.current) {
          cancelAnimationFrame(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }
        if (resizeTimeoutRef.current) {
          cancelAnimationFrame(resizeTimeoutRef.current);
          resizeTimeoutRef.current = null;
        }
        if (orientationTimeoutRef.current) {
          clearTimeout(orientationTimeoutRef.current);
          orientationTimeoutRef.current = null;
        }
        if (mutationTimeoutRef.current) {
          cancelAnimationFrame(mutationTimeoutRef.current);
          mutationTimeoutRef.current = null;
        }
      };
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      if (cleanupContainerListeners) {
        cleanupContainerListeners();
      }
    };
  }, [handleKeyDown, handleKeyUp, containerRef, updatePosition]);

  return {
    isPawsDown,
    containerTop,
    catSize,
    isVisible,
    containerZIndex,
    updatePosition,
    animationState,
    headTilt,
    eyePosition,
    tailAngle,
    earTwitch,
    characterCount: characterCountRef.current,
  };
}
