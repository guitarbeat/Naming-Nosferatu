import { useState, useEffect } from "react";

interface UseBongoCatProps {
  containerRef?: React.RefObject<HTMLElement> | null;
  size?: number;
  onBongo?: () => void;
  personality?: string;
  reduceMotion?: boolean;
  enableSounds?: boolean;
}

interface UseBongoCatReturn {
  isPawsDown: boolean;
  containerTop: number;
  catSize: number;
  isVisible: boolean;
  containerZIndex: number;
  animationState: string;
  headTilt: number;
  eyePosition: { x: number; y: number };
  tailAngle: number;
  earTwitch: boolean;
}

export function useBongoCat({
  containerRef,
  size = 0.5,
  onBongo: _onBongo,
  personality: _personality = "playful",
  reduceMotion: _reduceMotion = false,
  enableSounds: _enableSounds = false,
}: UseBongoCatProps): UseBongoCatReturn {
  const [isPawsDown] = useState(false);
  const [containerTop, setContainerTop] = useState(0);
  const [isVisible] = useState(true);
  const [animationState] = useState("idle");
  const [headTilt] = useState(0);
  const [eyePosition] = useState({ x: 0, y: 0 });
  const [tailAngle] = useState(0);
  const [earTwitch] = useState(false);
  const [containerZIndex, setContainerZIndex] = useState(1);

  const catSize = size * 100;

  useEffect(() => {
    if (!containerRef?.current) {
      return;
    }

    const updatePosition = () => {
      if (!containerRef?.current) {
        return;
      }

      const { current } = containerRef;
      const rect = current.getBoundingClientRect();
      setContainerTop(rect.top + window.scrollY);

      const { zIndex } = window.getComputedStyle(current);
      const parsedZIndex = parseInt(zIndex || "0", 10) || 1;
      setContainerZIndex(parsedZIndex);
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [containerRef]);

  return {
    isPawsDown,
    containerTop,
    catSize,
    isVisible,
    containerZIndex,
    animationState,
    headTilt,
    eyePosition,
    tailAngle,
    earTwitch,
  };
}

