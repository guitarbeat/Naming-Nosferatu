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
      prefersReducedMotion: getMediaQueryList("(prefers-reduced-motion: reduce)"),
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
      attachMediaQueryListener(query, updateEnvironment)
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

      setTransform((current) => {
        const next = {
          rotateX:
            current.rotateX +
            (targetRotationRef.current.rotateX - current.rotateX) * smoothing,
          rotateY:
            current.rotateY +
            (targetRotationRef.current.rotateY - current.rotateY) * smoothing,
        };

        const isCloseToTarget =
          Math.abs(next.rotateX - targetRotationRef.current.rotateX) < 0.01 &&
          Math.abs(next.rotateY - targetRotationRef.current.rotateY) < 0.01;

        if (isCloseToTarget) {
          animationFrameRef.current = null;
          return { ...targetRotationRef.current };
        }

        animationFrameRef.current = requestAnimationFrame(smoothTransform);
        return next;
      });
    },
    [smoothing]
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
      const rotateXValue = (y / maxDistance) * maxRotation;
      const rotateYValue = -(x / maxDistance) * maxRotation;

      targetRotationRef.current = {
        rotateX: rotateXValue,
        rotateY: rotateYValue,
      };

      startAnimation();
    },
    [maxRotation, startAnimation]
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

    return {
      transform: `perspective(${perspective}px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${scale})`,
      transition: animationFrameRef.current ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      willChange: "transform",
    };
  }, [transform, perspective, scale, isTiltDisabled]);

  return {
    elementRef,
    style: getTransformStyle(),
  };
}
