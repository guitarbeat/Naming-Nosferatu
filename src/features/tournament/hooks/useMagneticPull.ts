/**
 * @module Tournament/hooks/useMagneticPull
 * @description Hook for creating magnetic pull effect on orbs based on mouse movement
 */

import { useEffect, useRef } from "react";

/**
 * Hook that applies magnetic pull effect to fighter orbs based on mouse position
 * @param {React.RefObject} leftOrbRef - Ref to the left orb element
 * @param {React.RefObject} rightOrbRef - Ref to the right orb element
 * @param {boolean} enabled - Whether the effect is enabled
 */
function useMagneticPull(
  leftOrbRef: React.RefObject<HTMLElement | null>,
  rightOrbRef: React.RefObject<HTMLElement | null>,
  enabled = true,
) {
  // Use refs for state that updates frequently to avoid re-renders
  const mousePosRef = useRef({ x: typeof window !== "undefined" ? window.innerWidth / 2 : 0, y: typeof window !== "undefined" ? window.innerHeight / 2 : 0 });
  const isPressedRef = useRef({ left: false, right: false });
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const leftOrb = leftOrbRef.current;
    const rightOrb = rightOrbRef.current;

    if (!leftOrb || !rightOrb) return;

    // Animation loop to decouple DOM updates from mouse events
    const update = () => {
      const { x, y } = mousePosRef.current;

      // Calculate offset based on center of screen
      // Division by 40 controls the intensity of the magnetic pull
      const xAxis = (window.innerWidth / 2 - x) / 40;
      const yAxis = (window.innerHeight / 2 - y) / 40;

      // Calculate transforms including scale if pressed
      // We calculate this every frame to ensure smooth movement even while pressed
      const leftTransform = `translate(${-xAxis}px, ${-yAxis}px)${isPressedRef.current.left ? " scale(0.9)" : ""}`;
      const rightTransform = `translate(${xAxis}px, ${yAxis}px)${isPressedRef.current.right ? " scale(0.9)" : ""}`;

      // Apply transforms
      leftOrb.style.transform = leftTransform;
      rightOrb.style.transform = rightTransform;

      requestRef.current = requestAnimationFrame(update);
    };

    // Start the animation loop
    requestRef.current = requestAnimationFrame(update);

    const handleMouseMove = (e: MouseEvent) => {
      // Only update the data, don't touch the DOM
      mousePosRef.current = { x: e.pageX, y: e.pageY };
    };

    const handleMouseDown = (orb: HTMLElement, isLeft: boolean) => {
      if (!orb) return;
      orb.style.transition = "transform 0.1s ease";
      if (isLeft) isPressedRef.current.left = true;
      else isPressedRef.current.right = true;
    };

    const handleMouseUp = (orb: HTMLElement, isLeft: boolean) => {
      if (!orb) return;
      orb.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
      if (isLeft) isPressedRef.current.left = false;
      else isPressedRef.current.right = false;
    };

    // Add mouse move listener to document
    document.addEventListener("mousemove", handleMouseMove);

    // Create bound handlers for orb interactions
    const leftMouseDown = () => handleMouseDown(leftOrb, true);
    const leftMouseUp = () => handleMouseUp(leftOrb, true);
    const rightMouseDown = () => handleMouseDown(rightOrb, false);
    const rightMouseUp = () => handleMouseUp(rightOrb, false);

    // Add click interaction listeners
    leftOrb.addEventListener("mousedown", leftMouseDown);
    leftOrb.addEventListener("mouseup", leftMouseUp);
    rightOrb.addEventListener("mousedown", rightMouseDown);
    rightOrb.addEventListener("mouseup", rightMouseUp);

    // Cleanup function
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      document.removeEventListener("mousemove", handleMouseMove);

      leftOrb.removeEventListener("mousedown", leftMouseDown);
      leftOrb.removeEventListener("mouseup", leftMouseUp);
      rightOrb.removeEventListener("mousedown", rightMouseDown);
      rightOrb.removeEventListener("mouseup", rightMouseUp);

      // Reset styles
      if (leftOrb) {
        leftOrb.style.transform = "";
        leftOrb.style.transition = "";
      }
      if (rightOrb) {
        rightOrb.style.transform = "";
        rightOrb.style.transition = "";
      }
    };
  }, [leftOrbRef, rightOrbRef, enabled]);
}

export default useMagneticPull;
