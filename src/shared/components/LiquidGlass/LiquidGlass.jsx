import { useEffect, useRef } from "react";
import "./LiquidGlass.css";

/**
 * LiquidGlass component - Creates a liquid glass refraction effect using SVG filters
 * Replaces the traditional frosted glass with a dynamic, wavy refraction effect
 */
function LiquidGlass({
  children,
  className = "",
  width = 336,
  height = 96,
  radius = 16,
  turbulence = 0.3,
  scale = -180,
  saturation = 1,
  alpha = 0.93,
  lightness = 50,
  blur = 11,
  border = 0.07,
  displace = 0.35,
  blend = "difference",
  xChannel = "R",
  yChannel = "B",
  chromaticR = 0,
  chromaticG = 10,
  chromaticB = 20,
  id = "liquid-glass-filter",
  style = {},
  ...props
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const filterRef = useRef(null);
  const displacementImageRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    // * Get filter element by ID since we can't use ref directly on SVG filter
    const filterElement = svgRef.current.querySelector(`#${id}`);
    if (!filterElement) return;

    filterRef.current = filterElement;

    const buildDisplacementImage = () => {
      const borderSize = Math.min(width, height) * (border * 0.5);
      const svgContent = `
        <svg class="displacement-image" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="red-${id}" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#000"/>
              <stop offset="100%" stop-color="red"/>
            </linearGradient>
            <linearGradient id="blue-${id}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#000"/>
              <stop offset="100%" stop-color="blue"/>
            </linearGradient>
          </defs>
          <!-- backdrop -->
          <rect x="0" y="0" width="${width}" height="${height}" fill="black"></rect>
          <!-- red linear -->
          <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#red-${id})" />
          <!-- blue linear -->
          <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#blue-${id})" style="mix-blend-mode: ${blend}" />
          <!-- block out distortion -->
          <rect x="${borderSize}" y="${Math.min(width, height) * (border * 0.5)}" width="${width - borderSize * 2}" height="${height - borderSize * 2}" rx="${radius}" fill="hsl(0 0% ${lightness}% / ${alpha})" style="filter:blur(${blur}px)" />
        </svg>
      `;

      if (displacementImageRef.current) {
        displacementImageRef.current.innerHTML = svgContent;
        const svgEl = displacementImageRef.current.querySelector(
          ".displacement-image"
        );
        if (svgEl) {
          const serialized = new XMLSerializer().serializeToString(svgEl);
          const encoded = encodeURIComponent(serialized);
          const dataUri = `data:image/svg+xml,${encoded}`;

          // * Update feImage href
          const feImage = filterRef.current.querySelector("feImage");
          if (feImage) {
            feImage.setAttribute("href", dataUri);
          }
        }
      }
    };

    const updateFilter = () => {
      buildDisplacementImage();

      // * Update CSS variables
      if (containerRef.current) {
        containerRef.current.style.setProperty("--width", `${width}`);
        containerRef.current.style.setProperty("--height", `${height}`);
        containerRef.current.style.setProperty("--radius", `${radius}`);
        containerRef.current.style.setProperty("--turbulence", `${turbulence}`);
        containerRef.current.style.setProperty("--output-blur", `${displace}`);
        containerRef.current.style.setProperty("--saturation", `${saturation}`);
        containerRef.current.style.setProperty("--filter-id", `url(#${id})`);
        containerRef.current.style.backdropFilter = `url(#${id}) saturate(${saturation})`;
      }

      // * Update displacement map scales
      const redChannel = filterRef.current.querySelector("#redchannel");
      const greenChannel = filterRef.current.querySelector("#greenchannel");
      const blueChannel = filterRef.current.querySelector("#bluechannel");
      const mainDisplacement = filterRef.current.querySelector(
        "feDisplacementMap:not([id])"
      );

      if (mainDisplacement) {
        mainDisplacement.setAttribute("scale", scale);
        mainDisplacement.setAttribute("xChannelSelector", xChannel);
        mainDisplacement.setAttribute("yChannelSelector", yChannel);
      }

      if (redChannel) {
        redChannel.setAttribute("scale", scale + chromaticR);
      }

      if (greenChannel) {
        greenChannel.setAttribute("scale", scale + chromaticG);
      }

      if (blueChannel) {
        blueChannel.setAttribute("scale", scale + chromaticB);
      }

      // * Update turbulence
      const feTurbulence = filterRef.current.querySelector("feTurbulence");
      if (feTurbulence) {
        feTurbulence.setAttribute("baseFrequency", turbulence);
        feTurbulence.setAttribute("numOctaves", "3");
        feTurbulence.setAttribute("seed", "2");
      }

      // * Update blur
      const feGaussianBlur = filterRef.current.querySelector("feGaussianBlur");
      if (feGaussianBlur) {
        feGaussianBlur.setAttribute("stdDeviation", displace);
      }
    };

    updateFilter();

    // * Update on window resize
    const handleResize = () => {
      updateFilter();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [
    width,
    height,
    radius,
    turbulence,
    scale,
    saturation,
    alpha,
    lightness,
    blur,
    border,
    displace,
    blend,
    xChannel,
    yChannel,
    chromaticR,
    chromaticG,
    chromaticB,
    id,
  ]);

  return (
    <div
      ref={containerRef}
      className={`liquid-glass ${className}`}
      style={{
        width: style.width || `${width}px`,
        height: style.height || `${height}px`,
        ...style,
      }}
      {...props}
    >
      <div className="liquid-glass-content">{children}</div>
      <svg
        ref={svgRef}
        className="liquid-glass-filter"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={id} colorInterpolationFilters="sRGB">
            {/* * Turbulence for liquid glass wavy effect */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.3"
              numOctaves="3"
              seed="2"
              result="turbulence"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale="20"
              xChannelSelector="R"
              yChannelSelector="G"
              result="turbulent"
            />

            {/* * Input displacement image */}
            <feImage x="0" y="0" width="100%" height="100%" result="map" />

            {/* * RED channel with strongest displacement */}
            <feDisplacementMap
              in="turbulent"
              in2="map"
              id="redchannel"
              xChannelSelector={xChannel}
              yChannelSelector={yChannel}
              result="dispRed"
            />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="red"
            />

            {/* * GREEN channel (reference / least displaced) */}
            <feDisplacementMap
              in="turbulent"
              in2="map"
              id="greenchannel"
              xChannelSelector={xChannel}
              yChannelSelector={yChannel}
              result="dispGreen"
            />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="green"
            />

            {/* * BLUE channel with medium displacement */}
            <feDisplacementMap
              in="turbulent"
              in2="map"
              id="bluechannel"
              xChannelSelector={xChannel}
              yChannelSelector={yChannel}
              result="dispBlue"
            />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="blue"
            />

            {/* * Blend channels back together */}
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />

            {/* * Final blur for smooth liquid glass effect */}
            <feGaussianBlur in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>
      <div
        ref={displacementImageRef}
        className="displacement-image-container"
      />
    </div>
  );
}

export default LiquidGlass;
