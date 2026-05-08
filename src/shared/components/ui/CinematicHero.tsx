"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/shared/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const CINEMATIC_STYLES = `
  .gsap-reveal { visibility: hidden; }

  /* Environment Overlays */
  .film-grain {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 50; opacity: 0.03; mix-blend-mode: overlay;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-theme {
    background-size: 60px 60px;
    background-image:
      linear-gradient(to right, rgba(77, 200, 245, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(77, 200, 245, 0.05) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  /* Card with depth */
  .cinematic-card {
    background: linear-gradient(145deg, rgba(20, 30, 60, 0.8), rgba(10, 16, 29, 0.9));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow:
      0 40px 100px -20px rgba(0, 0, 0, 0.9),
      0 20px 40px -20px rgba(0, 0, 0, 0.8),
      inset 0 1px 2px rgba(77, 200, 245, 0.1),
      inset 0 -2px 4px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(77, 200, 245, 0.15);
    position: relative;
  }

  .card-sheen {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
    background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(77, 200, 245, 0.08) 0%, transparent 40%);
    mix-blend-mode: screen; transition: opacity 0.3s ease;
  }

  .progress-ring {
    transform: rotate(-90deg);
    transform-origin: center;
    stroke-dasharray: 402;
    stroke-dashoffset: 402;
    stroke-linecap: round;
  }

  /* Interactive Elements */
  .tournament-button {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
  }

  .tournament-button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 24px rgba(77, 200, 245, 0.4);
  }

  .tournament-button:active {
    transform: scale(0.98);
  }

  .stat-card {
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(77, 200, 245, 0.2);
  }

  .progress-bar {
    position: relative;
    overflow: hidden;
  }

  .progress-bar::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .matchup-card {
    transition: all 0.3s ease;
  }

  .matchup-card:hover {
    border-color: rgba(77, 200, 245, 0.4);
    box-shadow: 0 0 20px rgba(77, 200, 245, 0.2);
  }

  .counter-animation {
    font-variant-numeric: tabular-nums;
  }

  .badge-glow {
    animation: glow-pulse 2s ease-in-out infinite;
  }

  @keyframes glow-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* Smooth number transitions */
  @supports (animation: counter-inc 1s) {
    .counter-val {
      animation: counter-inc 2s ease-out forwards;
    }
  }
`;

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  tagline1?: string;
  tagline2?: string;
  description?: React.ReactNode;
  onCTA?: () => void;
  ctaLabel?: string;
  isScrollAnimated?: boolean;
}

export function CinematicHero({
  tagline1 = "Pick the perfect",
  tagline2 = "name for your cat.",
  description = "Run a tournament, gather opinions, and find the name that fits. Fair, visual, and surprisingly fun.",
  onCTA = () => {},
  ctaLabel = "Start a tournament",
  isScrollAnimated = true,
  className,
  ...props
}: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  // Mouse interaction for card sheen and 3D depth
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;

      cancelAnimationFrame(requestRef.current);

      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          mainCardRef.current.style.setProperty("--mouse-x", `${mouseX}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${mouseY}px`);

          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;

          // Enhanced 3D rotation with slight elevation
          gsap.to(mockupRef.current, {
            rotationY: xVal * 8,
            rotationX: -yVal * 8,
            y: -Math.abs(yVal) * 8,
            ease: "power3.out",
            duration: 0.8,
          });
        }
      });
    };

    const handleMouseLeave = () => {
      if (mockupRef.current) {
        gsap.to(mockupRef.current, {
          rotationY: 0,
          rotationX: 0,
          y: 0,
          ease: "power3.out",
          duration: 0.6,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Scroll timeline animation
  useEffect(() => {
    if (!isScrollAnimated) return;

    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      gsap.set(".tagline-1", { autoAlpha: 0, y: 60, scale: 0.85, filter: "blur(20px)" });
      gsap.set(".tagline-2", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".main-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".card-left-content", ".card-right-content", ".mockup-wrapper", ".card-badge"], { autoAlpha: 0 });

      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".tagline-1", { duration: 1.8, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", ease: "expo.out" })
        .to(".tagline-2", { duration: 1.4, clipPath: "inset(0 0% 0 0)", ease: "power4.inOut" }, "-=1.0");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=5000",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        .to([".hero-text", ".bg-grid-theme"], { scale: 1.15, filter: "blur(20px)", opacity: 0.2, ease: "power2.inOut", duration: 2 }, 0)
        .to(".main-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        .fromTo(".mockup-wrapper",
          { y: 300, z: -500, rotationX: 50, rotationY: -30, autoAlpha: 0, scale: 0.6 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 2.5 }, "-=0.8"
        )
        .fromTo(".card-badge", { y: 40, autoAlpha: 0, scale: 0.95 }, { y: 0, autoAlpha: 1, scale: 1, stagger: 0.15, ease: "back.out(1.2)", duration: 1.5 }, "-=1.5")
        .fromTo(".card-left-content", { x: -50, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 }, "-=1.5")
        .fromTo(".card-right-content", { x: 50, autoAlpha: 0, scale: 0.8 }, { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.5 }, "<")
        .to({}, { duration: 2 })
        .set(".hero-text", { autoAlpha: 0 })
        .to([".mockup-wrapper", ".card-badge", ".card-left-content", ".card-right-content"], {
          scale: 0.9, y: -40, z: -200, autoAlpha: 0, ease: "power3.in", duration: 1.2, stagger: 0.05,
        })
        .to(".main-card", {
          width: isMobile ? "92vw" : "85vw",
          height: isMobile ? "92vh" : "85vh",
          borderRadius: isMobile ? "32px" : "40px",
          ease: "expo.inOut",
          duration: 1.8
        }, "pullback")
        .to(".main-card", { y: -window.innerHeight - 300, ease: "power3.in", duration: 1.5 });
    }, containerRef);

    return () => ctx.revert();
  }, [isScrollAnimated]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-screen min-h-screen overflow-hidden flex items-center justify-center bg-background text-foreground font-sans antialiased", className)}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: CINEMATIC_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-theme absolute inset-0 z-0 pointer-events-none opacity-50" aria-hidden="true" />

      {/* Hero Text - Background Layer */}
      <div className="hero-text absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 will-change-transform">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">
          Tournament Mode
        </p>
        <h1
          className="tagline-1 gsap-reveal text-white text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tight"
          style={{ fontSize: "clamp(2rem, 9vw, 6rem)" }}
        >
          {tagline1}
        </h1>
        <h1
          className="tagline-2 gsap-reveal text-stardust text-5xl md:text-7xl lg:text-[6rem] font-extrabold tracking-tighter"
          style={{ fontSize: "clamp(2rem, 9vw, 6rem)" }}
        >
          {tagline2}
        </h1>
      </div>

      {/* Main Card - Foreground Layer */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="main-card cinematic-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />

          {/* Card Grid Layout */}
          <div className="relative w-full h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-between lg:justify-evenly lg:grid lg:grid-cols-3 items-center lg:gap-8 z-10 py-6 lg:py-0">
            
            {/* Left Content - Desktop: Left, Mobile: Bottom */}
            <div className="card-left-content gsap-reveal order-3 lg:order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full lg:max-w-none px-4 lg:px-0 space-y-4">
              <div>
                <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-black mb-2 tracking-tight leading-tight">
                  How it works
                </h2>
                <div className="h-1 w-12 bg-gradient-to-r from-stardust to-hot-pink rounded-full hidden lg:block" />
              </div>
              <p className="hidden md:block text-blue-100/70 text-sm md:text-base lg:text-lg font-normal leading-relaxed mx-auto lg:mx-0 max-w-sm lg:max-w-none">
                {description}
              </p>
            </div>

            {/* Center - iPhone Mockup */}
            <div className="mockup-wrapper order-2 lg:order-2 relative w-full h-[300px] lg:h-[500px] flex items-center justify-center z-10" style={{ perspective: "1000px" }}>
              <div className="relative w-full h-full flex items-center justify-center transform scale-[0.6] md:scale-75 lg:scale-100">
                
                {/* iPhone Frame */}
                <div
                  ref={mockupRef}
                  className="relative w-[280px] h-[580px] rounded-[3rem] bg-black flex flex-col will-change-transform"
                  style={{
                    boxShadow: "inset 0 0 0 2px #52525B, inset 0 0 0 7px #000, 0 40px 80px -15px rgba(0,0,0,0.9)",
                  }}
                >
                  {/* Screen */}
                  <div className="absolute inset-[7px] bg-gradient-to-b from-slate-950 to-slate-900 rounded-[2.5rem] overflow-hidden text-white z-10 flex flex-col p-4">
                    {/* Status Bar */}
                    <div className="flex items-center justify-between mb-4 text-xs text-white/70 px-2">
                      <span>9:41</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-2 bg-white/70" />
                        <div className="w-1 h-2 bg-white/70" />
                      </div>
                    </div>

                    {/* App Content */}
                    <div className="flex-1 flex flex-col gap-3">
                      {/* Header */}
                      <div className="flex justify-between items-center px-2 mb-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-stardust font-bold uppercase tracking-widest">Tournament</span>
                          <span className="text-lg font-bold">Round 1</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stardust/30 to-hot-pink/10 flex items-center justify-center border border-stardust/20 text-sm">
                          🐱
                        </div>
                      </div>

                      {/* Matchup Card */}
                      <div className="flex-1 flex flex-col gap-2 matchup-card bg-white/5 rounded-2xl p-3 border border-white/10">
                        <div className="flex gap-2 text-xs">
                          <button className="tournament-button flex-1 bg-stardust/20 text-stardust rounded-lg px-2 py-2 font-bold border border-stardust/30">
                            Whiskers
                          </button>
                          <span className="text-white/50 flex items-center text-[10px]">vs</span>
                          <button className="tournament-button flex-1 bg-white/5 text-white/70 rounded-lg px-2 py-2 font-bold border border-white/10">
                            Shadow
                          </button>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden progress-bar">
                          <div className="h-full w-3/5 bg-gradient-to-r from-stardust to-hot-pink rounded-full" />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="stat-card bg-white/5 rounded-lg p-2 border border-white/10">
                          <span className="text-white/50 text-[9px]">Total Votes</span>
                          <p className="counter-animation font-bold text-sm text-stardust">24</p>
                        </div>
                        <div className="stat-card bg-white/5 rounded-lg p-2 border border-white/10">
                          <span className="text-white/50 text-[9px]">Remaining</span>
                          <p className="counter-animation font-bold text-sm text-hot-pink">4</p>
                        </div>
                      </div>
                    </div>

                    {/* Home Indicator */}
                    <div className="h-1 w-[100px] bg-white/20 rounded-full mx-auto mt-2" />
                  </div>
                </div>

                {/* Badge */}
                <div className="card-badge absolute flex top-4 -left-16 lg:-left-24 bg-white/5 backdrop-filter backdrop-blur-md rounded-xl p-3 items-center gap-3 z-30 border border-stardust/30 shadow-lg shadow-stardust/20">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stardust/30 to-stardust/10 flex items-center justify-center border border-stardust/40 badge-glow">
                    <span className="text-base">🏆</span>
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">Fair voting</p>
                    <p className="text-stardust/80 text-[10px] font-medium">Double-blind</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Desktop: Right, Mobile: Top */}
            <div className="card-right-content gsap-reveal order-1 lg:order-3 flex flex-col justify-center lg:justify-start text-center lg:text-right z-20 w-full space-y-3">
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter bg-gradient-to-r from-stardust to-hot-pink bg-clip-text text-transparent">
                  Vote
                </h2>
              </div>
              <div className="flex flex-col lg:items-end gap-2">
                <p className="text-sm text-white/70 font-medium">See results in real time</p>
                <div className="flex gap-2 items-center justify-center lg:justify-end">
                  <div className="flex -space-x-2">
                    <div className="w-5 h-5 rounded-full bg-stardust/30 border border-stardust/50 flex items-center justify-center text-[10px]">👤</div>
                    <div className="w-5 h-5 rounded-full bg-hot-pink/30 border border-hot-pink/50 flex items-center justify-center text-[10px]">👤</div>
                    <div className="w-5 h-5 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-[10px]">+3</div>
                  </div>
                  <span className="text-xs text-white/50">5 voting</span>
                </div>
              </div>
            </div>

            {/* Feature Highlights - Bottom */}
            <div className="order-4 lg:order-4 col-span-1 lg:col-span-3 hidden lg:flex gap-4 mt-8 pt-8 border-t border-white/10 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="flex items-center gap-3 flex-1 text-left">
                <div className="w-10 h-10 rounded-lg bg-stardust/20 border border-stardust/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⚡</span>
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-widest">Instant</p>
                  <p className="text-sm font-semibold text-white">Live Results</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-1 text-center">
                <div className="w-10 h-10 rounded-lg bg-hot-pink/20 border border-hot-pink/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🔒</span>
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-widest">Blind</p>
                  <p className="text-sm font-semibold text-white">Fair Voting</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-1 text-right">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📊</span>
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-widest">Smart</p>
                  <p className="text-sm font-semibold text-white">Analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
