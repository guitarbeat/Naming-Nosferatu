import { useEffect, useRef } from "react";
import "./CatBackground.css";

const DEFAULT_STAR_COUNT = 120;
const MOBILE_STAR_REDUCTION = 0.4;
const MOBILE_MAX_WIDTH = 600;
const STAR_GLYPH = "✦";
const randomBetween = (min, max) => Math.random() * (max - min) + min;

export default function CatBackground() {
  const skyRef = useRef(null);

  useEffect(() => {
    const skyElement = skyRef.current;
    if (!skyElement) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      skyElement.innerHTML = "";
      return undefined;
    }

    let starCount = Number.parseInt(
      skyElement.dataset.stars ?? `${DEFAULT_STAR_COUNT}`,
      10
    );

    if (Number.isNaN(starCount)) {
      starCount = DEFAULT_STAR_COUNT;
    }

    if (window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches) {
      starCount = Math.round(starCount * MOBILE_STAR_REDUCTION);
    }

    skyElement.innerHTML = "";

    for (let i = 0; i < starCount; i += 1) {
      const el = document.createElement("div");
      el.className = "cat-background__star";
      el.textContent = STAR_GLYPH;
      el.style.left = `${Math.random() * 100}vw`;
      el.style.top = `${Math.random() * 100}vh`;

      const size = randomBetween(6, 16);
      el.style.fontSize = `${size.toFixed(2)}px`;
      el.style.setProperty(
        "--twinkle-duration",
        `${randomBetween(2.6, 4.8).toFixed(2)}s`
      );
      el.style.setProperty(
        "--twinkle-delay",
        `${randomBetween(-4, 0).toFixed(2)}s`
      );
      el.style.setProperty(
        "--twinkle-scale",
        `${randomBetween(0.9, 1.8).toFixed(2)}`
      );
      el.style.setProperty(
        "--twinkle-alpha",
        `${randomBetween(0.45, 0.95).toFixed(2)}`
      );
      el.style.setProperty(
        "--twinkle-blur",
        `${randomBetween(0, 1.2).toFixed(2)}px`
      );

      skyElement.appendChild(el);
    }

    return () => {
      skyElement.innerHTML = "";
    };
  }, []);

  return (
    <div className="cat-background" aria-hidden="true">
      <div className="cat-background__gradient" />
      <div
        id="sky"
        ref={skyRef}
        data-stars={DEFAULT_STAR_COUNT}
        className="cat-background__sky"
      />
    </div>
  );
}
