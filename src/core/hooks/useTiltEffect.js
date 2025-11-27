
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  attachMediaQueryListener,
  getMediaQueryList,
} from "../../shared/utils/mediaQueries";

const INITIAL_TRANSFORM = { rotateX: 0, rotateY: 0 };

export function useTiltEffect(options = {}) {
  const {
    maxRotation = 10,
    perspective = 1000,
    smoothing = 0.1,
    scale = 1.02,
  } = options;

  // * Validate options to ensure they're valid numbers
  const validSmoothing =
    Number.isFinite(smoothing) && smoothing > 0 && smoothing <= 1
      ? smoothing
      : 0.1;
  const validMaxRotation =
    Number.isFinite(maxRotation) && maxRotation > 0 ? maxRotation : 10;
  const validPerspective =
    Number.isFinite(perspective) && perspective > 0 ? perspective : 1000;
  const validScale = Number.isFinite(scale) && scale > 0 ? scale : 1.02;

  const elementRef = useRef(null);
  const animationFrameRef = useRef(null);
  const targetRotationRef = useRef({ ...INITIAL_TRANSFORM });
  const disableTiltRef = useRef(false);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // * Use ref for transform to avoid triggering re-renders on every animation frame
  const transformRef = useRef(INITIAL_TRANSFORM);
  const [transform, setTransform] = useState(INITIAL_TRANSFORM);
  const [environment, setEnvironment] = useState({
    prefersReducedMotion: false,
    hasFinePointer: true,
    hasHoverSupport: true,
  });

  const isTiltDisabled = useMemo(() => {
    if (environment.prefersReducedMotion) {
      return true;
    }

    return !(environment.hasFinePointer && environment.hasHoverSupport);
  }, [environment]);

  useEffect(() => {
    disableTiltRef.current = isTiltDisabled;

    if (!isTiltDisabled) {
      return;
    }

    targetRotationRef.current = { ...INITIAL_TRANSFORM };
    transformRef.current = INITIAL_TRANSFORM;
    setTransform(INITIAL_TRANSFORM);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [isTiltDisabled]);

  useEffect(() => {
    const queries = {
      prefersReducedMotion: getMediaQueryList(
        "(prefers-reduced-motion: reduce)",
      ),
      hasFinePointer: getMediaQueryList("(any-pointer: fine)"),
      hasHoverSupport: getMediaQueryList("(any-hover: hover)"),
    };

    const updateEnvironment = () => {
      setEnvironment((prev) => {
        const next = {
          prefersReducedMotion: queries.prefersReducedMotion?.matches ?? false,
          hasFinePointer: queries.hasFinePointer?.matches ?? false,
          hasHoverSupport: queries.hasHoverSupport?.matches ?? false,
        };

        if (
          prev.prefersReducedMotion === next.prefersReducedMotion &&
          prev.hasFinePointer === next.hasFinePointer &&
          prev.hasHoverSupport === next.hasHoverSupport
        ) {
          return prev;
        }

        return next;
      });
    };

    updateEnvironment();

    const cleanups = Object.values(queries).map((query) =>
      attachMediaQueryListener(query, updateEnvironment),
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  const smoothTransform = useCallback(
    function smoothTransform() {
      if (disableTiltRef.current) {
        animationFrameRef.current = null;
        return;
      }

      // * Disable tilt during scroll to prevent conflicts
      if (isScrollingRef.current) {
        // * Reset to center position during scroll
        transformRef.current = INITIAL_TRANSFORM;
        if (elementRef.current) {
          elementRef.current.style.transform = `perspective(${validPerspective}px) rotateX(0deg) rotateY(0deg) scale(${validScale})`;
        }
        animationFrameRef.current = null;
        return;
      }

      // * Check if component is still mounted before updating state
      if (!elementRef.current) {
        animationFrameRef.current = null;
        return;
      }

      // * Update ref first to track current transform
      const current = transformRef.current || INITIAL_TRANSFORM;
      const currentRotateX =
        typeof current.rotateX === "number" && Number.isFinite(current.rotateX)
          ? current.rotateX
          : 0;
      const currentRotateY =
        typeof current.rotateY === "number" && Number.isFinite(current.rotateY)
          ? current.rotateY
          : 0;

      const target = targetRotationRef.current || INITIAL_TRANSFORM;
      const targetRotateX =
        typeof target.rotateX === "number" && Number.isFinite(target.rotateX)
          ? target.rotateX
          : 0;
      const targetRotateY =
        typeof target.rotateY === "number" && Number.isFinite(target.rotateY)
          ? target.rotateY
          : 0;

      const next = {
        rotateX:
          currentRotateX + (targetRotateX - currentRotateX) * validSmoothing,
        rotateY:
          currentRotateY + (targetRotateY - currentRotateY) * validSmoothing,
      };

      // * Ensure calculated values are valid numbers
      if (!Number.isFinite(next.rotateX) || !Number.isFinite(next.rotateY)) {
        animationFrameRef.current = null;
        transformRef.current = INITIAL_TRANSFORM;
        setTransform(INITIAL_TRANSFORM);
        return;
      }

      const isCloseToTarget =
        Math.abs(next.rotateX - targetRotateX) < 0.01 &&
        Math.abs(next.rotateY - targetRotateY) < 0.01;

      // * Update ref immediately
      transformRef.current = isCloseToTarget
        ? { rotateX: targetRotateX, rotateY: targetRotateY }
        : next;

      // * Only update React state if the change is significant to reduce re-renders
      // * Increased threshold to reduce flashing
      const changeThreshold = 1.0;
      const hasSignificantChange =
        Math.abs(next.rotateX - currentRotateX) > changeThreshold ||
        Math.abs(next.rotateY - currentRotateY) > changeThreshold;

      // * Update state less frequently to prevent flashing
      if (hasSignificantChange || isCloseToTarget) {
        setTransform(transformRef.current);
      } else {
        // * Update DOM directly without triggering React re-render
        // * Calculate transform string directly instead of calling getTransformStyle
        if (elementRef.current && !disableTiltRef.current) {
          const element = elementRef.current;
          const currentTransform = transformRef.current || INITIAL_TRANSFORM;
          const rotateX = Number.isFinite(currentTransform?.rotateX)
            ? currentTransform.rotateX
            : 0;
          const rotateY = Number.isFinite(currentTransform?.rotateY)
            ? currentTransform.rotateY
            : 0;
          element.style.transform = `perspective(${validPerspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${validScale})`;
        }
      }

      if (isCloseToTarget) {
        animationFrameRef.current = null;
        return;
      }

      // * Only schedule next frame if element still exists
      if (elementRef.current) {
        animationFrameRef.current = requestAnimationFrame(smoothTransform);
      } else {
        animationFrameRef.current = null;
      }
    },
    [validSmoothing, validPerspective, validScale],
  );

  const startAnimation = useCallback(() => {
    if (disableTiltRef.current) {
      return;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(smoothTransform);
  }, [smoothTransform]);

  const handleMouseMove = useCallback(
    (event) => {
      if (
        !elementRef.current ||
        disableTiltRef.current ||
        isScrollingRef.current
      ) {
        return;
      }

      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = event.clientX - centerX;
      const y = event.clientY - centerY;

      const maxDistance = Math.max(rect.width, rect.height) / 2;

      // * Defensive check: ensure maxDistance is valid
      if (!Number.isFinite(maxDistance) || maxDistance === 0) {
        return;
      }

      const rotateXValue = (y / maxDistance) * validMaxRotation;
      const rotateYValue = -(x / maxDistance) * validMaxRotation;

      // * Ensure calculated values are valid numbers
      if (Number.isFinite(rotateXValue) && Number.isFinite(rotateYValue)) {
        targetRotationRef.current = {
          rotateX: rotateXValue,
          rotateY: rotateYValue,
        };

        startAnimation();
      }
    },
    [validMaxRotation, startAnimation],
  );

  const handleMouseLeave = useCallback(() => {
    if (disableTiltRef.current) {
      return;
    }

    targetRotationRef.current = { ...INITIAL_TRANSFORM };
    transformRef.current = INITIAL_TRANSFORM;
    setTransform(INITIAL_TRANSFORM);
    startAnimation();
  }, [startAnimation]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isTiltDisabled) {
      return undefined;
    }

    // * Detect scrolling to disable tilt during scroll
    const handleScroll = () => {
      isScrollingRef.current = true;
      // * Reset tilt to center during scroll
      targetRotationRef.current = { ...INITIAL_TRANSFORM };
      startAnimation();

      // * Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // * Re-enable tilt after scroll stops
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        scrollTimeoutRef.current = null;
      }, 150);
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleMouseMove, handleMouseLeave, isTiltDisabled, startAnimation]);

  const getTransformStyle = useCallback(() => {
    if (isTiltDisabled) {
      return {};
    }

    // * Use ref value for current transform to avoid stale state
    const currentTransform =
      transformRef.current || transform || INITIAL_TRANSFORM;
    const rotateX = Number.isFinite(currentTransform?.rotateX)
      ? currentTransform.rotateX
      : 0;
    const rotateY = Number.isFinite(currentTransform?.rotateY)
      ? currentTransform.rotateY
      : 0;

    return {
      transform: `perspective(${validPerspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${validScale})`,
      // * Always use "none" for transition to avoid conflicts with CSS transitions
      // * The smoothing is handled by the animation frame loop
      // * Inline styles have higher specificity than CSS classes, so this should override
      transition: "none",
      willChange: "transform",
    };
  }, [transform, validPerspective, validScale, isTiltDisabled, transformRef]);

  return {
    elementRef,
    style: getTransformStyle(),
  };
}
