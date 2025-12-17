/**
 * @module useEyeTracking
 * @description Hook for tracking mouse position and calculating eye position for cat SVG
 */

import { useState, useEffect } from "react";

const EYE_MOVEMENT_MAX_PX = 4;

/**
 * Hook to track mouse position and calculate eye position for cat SVG
 * @param {Object} refs - Object containing catRef and catSvgRef
 * @returns {Object} Eye position { x, y }
 */
export function useEyeTracking({ catRef, catSvgRef }) {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const target = catSvgRef?.current || catRef?.current;
      if (target) {
        const rect = target.getBoundingClientRect();
        const catCenterX = rect.left + rect.width / 2;
        const catCenterY = rect.top + rect.height / 2;
        const deltaX = e.clientX - catCenterX;
        const deltaY = e.clientY - catCenterY;
        // * Normalize to reasonable eye movement range (max 4px for pupils)
        const maxDistance = Math.max(rect.width, rect.height) / 2;
        const normalizedX = Math.max(-1, Math.min(1, deltaX / maxDistance));
        const normalizedY = Math.max(-1, Math.min(1, deltaY / maxDistance));
        setEyePosition({
          x: normalizedX * EYE_MOVEMENT_MAX_PX,
          y: normalizedY * EYE_MOVEMENT_MAX_PX,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [catRef, catSvgRef]);

  return eyePosition;
}
