import { useMemo, useRef, useState } from "react";
import { getMediaQueryMatches } from "../../utils/mediaQueries";
import "./CatBackground.css";

const CAT_GIFS = ["/assets/images/cat.gif"];

/**
 * Creates a floating cat element - simplified for performance
 */
function CatImage({ index, gifSrc }) {
  const isCatGif = gifSrc === "/assets/images/cat.gif";

  // Use video only for cat.gif (has webm version)
  if (isCatGif) {
    return (
      <video
        className={`cat-background__cat cat-background__cat--${index}`}
        muted
        loop
        autoPlay
        playsInline
        preload="none"
      >
        <source src="/assets/images/cat.webm" type="video/webm" />
        <img src={gifSrc} alt="" loading="lazy" decoding="async" />
      </video>
    );
  }

  return (
    <img
      className={`cat-background__cat cat-background__cat--${index}`}
      src={gifSrc}
      alt=""
      loading="lazy"
      decoding="async"
    />
  );
}

export default function CatBackground() {
  const containerRef = useRef(null);

  // Check if we should show cats (respects user preferences)
  const showCats = useMemo(() => {
    if (typeof window === "undefined") return false;
    const prefersReducedMotion = getMediaQueryMatches(
      "(prefers-reduced-motion: reduce)",
    );
    const saveData = navigator.connection?.saveData;
    return !(prefersReducedMotion || saveData);
  }, []);

  // Randomly assign gifs to each cat (2 cats instead of 4)
  const [catGifs] = useState(() =>
    [0, 1].map(() => CAT_GIFS[Math.floor(Math.random() * CAT_GIFS.length)]),
  );

  return (
    <div className="cat-background" ref={containerRef}>
      <div className="cat-background__stars" />
      <div className="cat-background__nebula" />
      {showCats && (
        <div className="cat-background__floating-cats">
          {catGifs.map((gif, i) => (
            <CatImage key={i} index={i + 1} gifSrc={gif} />
          ))}
        </div>
      )}
    </div>
  );
}
