import { useEffect, useMemo, useRef } from "react";
import { getMediaQueryMatches } from "../../utils/mediaQueries";
import "./CatBackground.css";

// * Array of available cat gifs to randomly choose from
const CAT_GIFS = [
  "/assets/images/cat.gif",
  "/assets/images/bby-cat.GIF",
];

/**
 * * Creates a floating cat video element with assigned gif
 * @param {number} index - The cat index (1-4)
 * @param {string} gifSrc - The gif source to use
 * @returns {JSX.Element} Cat video element
 */
function createCatVideo(index, gifSrc) {
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
      <img
        src={gifSrc}
        alt=""
        loading="lazy"
        decoding="async"
        fetchPriority="low"
      />
    </video>
  );
}

function BbyCat() {
  return (
    <img
      className="bby-cat"
      src="/assets/images/bby-cat.GIF"
      alt="A cat licking its tongue"
      loading="lazy"
      decoding="async"
      fetchPriority="low"
    />
  );
}

export default function CatBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const prefersReduced = getMediaQueryMatches(
      "(prefers-reduced-motion: reduce)",
    );
    if (prefersReduced) {
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const stars = el.querySelector(".cat-background__stars");
    const nebula = el.querySelector(".cat-background__nebula");
    const cats = Array.from(el.querySelectorAll(".cat-background__cat"));

    let ticking = false;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let time = 0;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        time += 0.01;
        const y = window.scrollY || 0;

        if (stars) {
          const sTranslate = Math.min(40, y * 0.03);
          const sParallaxX = (mouseX - window.innerWidth / 2) * 0.0003;
          const sParallaxY = (mouseY - window.innerHeight / 2) * 0.0002;
          const sRotate = Math.sin(time * 0.5) * 0.5;
          stars.style.transform = `translate(${sParallaxX * 20}px, ${sTranslate + sParallaxY * 15}px) rotate(${sRotate}deg)`;
        }

        if (nebula) {
          const nTranslate = Math.min(80, y * 0.06);
          const nScale = 1 + Math.min(0.15, y * 0.0003);
          const nParallaxX = (mouseX - window.innerWidth / 2) * 0.001;
          const nParallaxY = (mouseY - window.innerHeight / 2) * 0.0008;
          const nRotate = Math.sin(time * 0.3) * 1;
          const nPulse = 1 + Math.sin(time * 0.8) * 0.05;
          nebula.style.transform = `translate(${nParallaxX * 50}px, ${nTranslate + nParallaxY * 40}px) scale(${nScale * nPulse}) rotate(${nRotate}deg)`;
        }

        if (cats.length) {
          cats.forEach((node, idx) => {
            const speed = 0.04 + idx * 0.015;
            const cTranslateY = Math.min(100, y * speed);
            const swayX = Math.sin((y + idx * 150) * 0.003) * 15;
            const swayY = Math.cos((y + idx * 100) * 0.002) * 8;
            const mouseParX =
              (mouseX - window.innerWidth / 2) * (0.0008 + idx * 0.0002);
            const mouseParY =
              (mouseY - window.innerHeight / 2) * (0.0006 + idx * 0.0001);
            const catRotate = Math.sin((time + idx) * 0.4) * 2;
            const catScale = 1 + Math.sin((time + idx * 0.5) * 0.6) * 0.03;
            node.style.transform = `translate(${swayX + mouseParX * 45}px, ${cTranslateY + swayY + mouseParY * 35}px) rotate(${catRotate}deg) scale(${catScale})`;
          });
        }
        ticking = false;
      });
    };

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!ticking) onScroll();
    };

    const onCatClick = (e) => {
      // * Add a fun interaction when cats are clicked
      const cat = e.target.closest(".cat-background__cat");
      if (cat) {
        cat.style.transform += " scale(1.2)";
        cat.style.transition = "transform 0.3s ease";
        setTimeout(() => {
          cat.style.transform = cat.style.transform.replace(" scale(1.2)", "");
        }, 300);
      }
    };

    // * Continuous animation loop for smooth effects
    const animate = () => {
      if (!ticking) onScroll();
      requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    el.addEventListener("click", onCatClick);

    // * Start the animation loop
    animate();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("click", onCatClick);
    };
  }, []);

  const showCats = useMemo(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? getMediaQueryMatches("(prefers-reduced-motion: reduce)")
        : false;
    const saveData =
      typeof navigator !== "undefined" &&
      navigator.connection &&
      navigator.connection.saveData;
    return !(prefersReducedMotion || saveData);
  }, []);

  // * Randomly assign gifs to each cat position (consistent per render)
  const catGifs = useMemo(() => {
    const assignments = [];
    for (let i = 0; i < 4; i++) {
      // * Randomly select a gif for each cat
      const randomIndex = Math.floor(Math.random() * CAT_GIFS.length);
      assignments.push(CAT_GIFS[randomIndex]);
    }
    return assignments;
  }, []);

  return (
    <div className="cat-background" ref={containerRef}>
      <div className="cat-background__stars"></div>
      <div className="cat-background__nebula"></div>
      <div className="cat-background__floating-cats">
        {showCats ? (
          <>
            {createCatVideo(1, catGifs[0])}
            {createCatVideo(2, catGifs[1])}
            {createCatVideo(3, catGifs[2])}
            {createCatVideo(4, catGifs[3])}
            <BbyCat />
          </>
        ) : null}
      </div>
    </div>
  );
}
