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
function useMagneticPull(leftOrbRef, rightOrbRef, enabled = true) {
  const transformRef = useRef({ left: null, right: null });

  useEffect(() => {
    if (!enabled) return;

    const leftOrb = leftOrbRef.current;
    const rightOrb = rightOrbRef.current;

    if (!leftOrb || !rightOrb) return;

    const handleMouseMove = (e) => {
      const xAxis = (window.innerWidth / 2 - e.pageX) / 40;
      const yAxis = (window.innerHeight / 2 - e.pageY) / 40;

      // Store transforms for click interaction
      transformRef.current.left = `translate(${-xAxis}px, ${-yAxis}px)`;
      transformRef.current.right = `translate(${xAxis}px, ${yAxis}px)`;

      // Apply transforms
      leftOrb.style.transform = transformRef.current.left;
      rightOrb.style.transform = transformRef.current.right;
    };

    const handleMouseDown = (orb, isLeft) => {
      if (!orb) return;
      orb.style.transition = "transform 0.1s ease";
      const currentTransform =
        transformRef.current[isLeft ? "left" : "right"] || "";
      orb.style.transform = `${currentTransform} scale(0.9)`;
    };

    const handleMouseUp = (orb, isLeft) => {
      if (!orb) return;
      orb.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
      const currentTransform =
        transformRef.current[isLeft ? "left" : "right"] || "";
      orb.style.transform = currentTransform;
    };

    // Add mouse move listener
    document.addEventListener("mousemove", handleMouseMove);

    // Create bound handlers
    const leftMouseDown = () => handleMouseDown(leftOrb, true);
    const leftMouseUp = () => handleMouseUp(leftOrb, true);
    const rightMouseDown = () => handleMouseDown(rightOrb, false);
    const rightMouseUp = () => handleMouseUp(rightOrb, false);

    // Add click interaction
    leftOrb.addEventListener("mousedown", leftMouseDown);
    leftOrb.addEventListener("mouseup", leftMouseUp);
    rightOrb.addEventListener("mousedown", rightMouseDown);
    rightOrb.addEventListener("mouseup", rightMouseUp);

    // Cleanup function
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);

      leftOrb.removeEventListener("mousedown", leftMouseDown);
      leftOrb.removeEventListener("mouseup", leftMouseUp);
      rightOrb.removeEventListener("mousedown", rightMouseDown);
      rightOrb.removeEventListener("mouseup", rightMouseUp);

      // Reset transforms
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
