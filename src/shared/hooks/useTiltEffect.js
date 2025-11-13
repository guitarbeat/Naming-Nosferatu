import { useEffect, useRef, useState, useCallback } from "react";

export function useTiltEffect(options = {}) {
  const {
    maxRotation = 10,
    perspective = 1000,
    smoothing = 0.1,
    scale = 1.02,
  } = options;

  const elementRef = useRef(null);
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
  });
  const animationFrameRef = useRef(null);
  const targetRotationRef = useRef({ rotateX: 0, rotateY: 0 });

  const prefersReducedMotion = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const isTouchDevice = useCallback(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  const shouldDisableTilt = useCallback(() => {
    return prefersReducedMotion() || isTouchDevice();
  }, [prefersReducedMotion, isTouchDevice]);

  const smoothTransform = useCallback(() => {
    setTransform((current) => ({
      rotateX:
        current.rotateX +
        (targetRotationRef.current.rotateX - current.rotateX) * smoothing,
      rotateY:
        current.rotateY +
        (targetRotationRef.current.rotateY - current.rotateY) * smoothing,
    }));
  }, [smoothing]);

  const handleMouseMove = useCallback(
    (e) => {
      if (shouldDisableTilt() || !elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = e.clientX - centerX;
      const y = e.clientY - centerY;

      const maxDistance = Math.max(rect.width, rect.height) / 2;
      const rotateXValue = (y / maxDistance) * maxRotation;
      const rotateYValue = -(x / maxDistance) * maxRotation;

      targetRotationRef.current = {
        rotateX: rotateXValue,
        rotateY: rotateYValue,
      };

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(smoothTransform);
    },
    [shouldDisableTilt, maxRotation, smoothTransform]
  );

  const handleMouseLeave = useCallback(() => {
    if (shouldDisableTilt()) return;

    targetRotationRef.current = { rotateX: 0, rotateY: 0 };

    const resetInterval = setInterval(() => {
      setTransform((current) => {
        const newRotateX = current.rotateX * 0.9;
        const newRotateY = current.rotateY * 0.9;

        if (Math.abs(newRotateX) < 0.01 && Math.abs(newRotateY) < 0.01) {
          clearInterval(resetInterval);
          return { rotateX: 0, rotateY: 0 };
        }

        return { rotateX: newRotateX, rotateY: newRotateY };
      });
    }, 16);

    return () => clearInterval(resetInterval);
  }, [shouldDisableTilt]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || shouldDisableTilt()) return;

    element.addEventListener("mousemove", handleMouseMove, { passive: true });
    element.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleMouseMove, handleMouseLeave, shouldDisableTilt]);

  const getTransformStyle = useCallback(() => {
    if (shouldDisableTilt()) {
      return {};
    }

    return {
      transform: `perspective(${perspective}px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${scale})`,
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    };
  }, [transform, perspective, scale, shouldDisableTilt]);

  return {
    elementRef,
    style: getTransformStyle(),
  };
}
