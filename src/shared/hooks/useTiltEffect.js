import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  attachMediaQueryListener,
  getMediaQueryList,
} from "../utils/mediaQueries";

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

      // * Check if component is still mounted before updating state
      if (!elementRef.current) {
        animationFrameRef.current = null;
        return;
      }

      setTransform((current) => {
        // * Defensive checks: ensure current is an object with valid numeric properties
        if (!current || typeof current !== "object") {
          animationFrameRef.current = null;
          return INITIAL_TRANSFORM;
        }

        const currentRotateX =
          typeof current.rotateX === "number" &&
            Number.isFinite(current.rotateX)
            ? current.rotateX
            : 0;
        const currentRotateY =
          typeof current.rotateY === "number" &&
            Number.isFinite(current.rotateY)
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
          return INITIAL_TRANSFORM;
        }

        const isCloseToTarget =
          Math.abs(next.rotateX - targetRotateX) < 0.01 &&
          Math.abs(next.rotateY - targetRotateY) < 0.01;

        if (isCloseToTarget) {
          animationFrameRef.current = null;
          return { rotateX: targetRotateX, rotateY: targetRotateY };
        }

        // * Only schedule next frame if element still exists
        if (elementRef.current) {
          animationFrameRef.current = requestAnimationFrame(smoothTransform);
        } else {
          animationFrameRef.current = null;
        }

        return next;
      });
    },
    [validSmoothing],
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
      if (!elementRef.current || disableTiltRef.current) {
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
    startAnimation();
  }, [startAnimation]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isTiltDisabled) {
      return undefined;
    }

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave, isTiltDisabled]);

  const getTransformStyle = useCallback(() => {
    if (isTiltDisabled) {
      return {};
    }

    // * Ensure transform values are valid numbers
    const rotateX = Number.isFinite(transform?.rotateX) ? transform.rotateX : 0;
    const rotateY = Number.isFinite(transform?.rotateY) ? transform.rotateY : 0;

    return {
      transform: `perspective(${validPerspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${validScale})`,
      // * Always use "none" for transition to avoid conflicts with CSS transitions
      // * The smoothing is handled by the animation frame loop
      // * Inline styles have higher specificity than CSS classes, so this should override
      transition: "none",
      willChange: "transform",
    };
  }, [transform, validPerspective, validScale, isTiltDisabled]);

  return {
    elementRef,
    style: getTransformStyle(),
  };
}
