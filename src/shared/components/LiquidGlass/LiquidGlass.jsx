import { useEffect, useRef } from "react";
import "./LiquidGlass.css";

/**
 * LiquidGlass component - Creates a liquid glass refraction effect using SVG filters
 * Based on: https://codepen.io/jh3y/pen/EajLxJV
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render inside glass
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.width - Width of the glass effect
 * @param {number} props.height - Height of the glass effect
 * @param {number} props.radius - Border radius in pixels
 * @param {number} props.scale - Displacement scale (-180 default)
 * @param {number} props.saturation - Color saturation multiplier (1 = normal)
 * @param {number} props.frost - Frost overlay opacity (0-1)
 * @param {number} props.alpha - Displacement map alpha (0-1)
 * @param {number} props.lightness - Displacement map lightness (0-100)
 * @param {number} props.inputBlur - Input blur for displacement image
 * @param {number} props.outputBlur - Output blur for final effect
 * @param {number} props.border - Border width as fraction of size (0-1)
 * @param {string} props.blend - Blend mode for gradient mixing
 * @param {string} props.xChannel - X displacement channel (R/G/B)
 * @param {string} props.yChannel - Y displacement channel (R/G/B)
 * @param {number} props.chromaticR - Red channel offset
 * @param {number} props.chromaticG - Green channel offset
 * @param {number} props.chromaticB - Blue channel offset
 * @param {string} props.id - Unique filter ID
 */
function LiquidGlass({
  children,
  className = "",
  width = 200,
  height = 80,
  radius = 999, // * Default to very large radius for pill shape
  scale = -180,
  saturation = 1.1,
  frost = 0.05,
  alpha = 0.93,
  lightness = 50,
  inputBlur = 11,
  outputBlur = 0.7,
  border = 0.07,
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
      // * Calculate pill-shaped radius: minimum of specified radius or half the height
      const pillRadius = Math.min(radius, height * 0.5);
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
          <rect x="0" y="0" width="${width}" height="${height}" rx="${pillRadius}" fill="url(#red-${id})" />
          <!-- blue linear -->
          <rect x="0" y="0" width="${width}" height="${height}" rx="${pillRadius}" fill="url(#blue-${id})" style="mix-blend-mode: ${blend}" />
          <!-- block out distortion (input blur controls edge softness) -->
          <rect x="${borderSize}" y="${Math.min(width, height) * (border * 0.5)}" width="${width - borderSize * 2}" height="${height - borderSize * 2}" rx="${pillRadius}" fill="hsl(0 0% ${lightness}% / ${alpha})" style="filter:blur(${inputBlur}px)" />
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
        // * Calculate pill-shaped radius for CSS (minimum of specified radius or half the height)
        const pillRadius = Math.min(radius, height * 0.5);
        containerRef.current.style.setProperty("--width", `${width}`);
        containerRef.current.style.setProperty("--height", `${height}`);
        containerRef.current.style.setProperty("--radius", `${pillRadius}`);
        containerRef.current.style.setProperty("--frost", `${frost}`);
        containerRef.current.style.setProperty(
          "--output-blur",
          `${outputBlur}`
        );
        containerRef.current.style.setProperty("--saturation", `${saturation}`);
        containerRef.current.style.setProperty("--filter-id", `url(#${id})`);
        // * Apply filter with saturation
        containerRef.current.style.backdropFilter = `url(#${id}) saturate(${saturation})`;
      }

      // * Update chromatic aberration displacement scales
      const redChannel = filterRef.current.querySelector("#redchannel");
      const greenChannel = filterRef.current.querySelector("#greenchannel");
      const blueChannel = filterRef.current.querySelector("#bluechannel");

      if (redChannel) {
        redChannel.setAttribute("scale", scale + chromaticR);
        redChannel.setAttribute("xChannelSelector", xChannel);
        redChannel.setAttribute("yChannelSelector", yChannel);
      }

      if (greenChannel) {
        greenChannel.setAttribute("scale", scale + chromaticG);
        greenChannel.setAttribute("xChannelSelector", xChannel);
        greenChannel.setAttribute("yChannelSelector", yChannel);
      }

      if (blueChannel) {
        blueChannel.setAttribute("scale", scale + chromaticB);
        blueChannel.setAttribute("xChannelSelector", xChannel);
        blueChannel.setAttribute("yChannelSelector", yChannel);
      }

      // * Update output blur (softens the chromatic aberration)
      const feGaussianBlur = filterRef.current.querySelector("feGaussianBlur");
      if (feGaussianBlur) {
        feGaussianBlur.setAttribute("stdDeviation", outputBlur);
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
    scale,
    saturation,
    frost,
    alpha,
    lightness,
    inputBlur,
    outputBlur,
    border,
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
            {/* * The input displacement image (generated SVG with gradients) */}
            <feImage x="0" y="0" width="100%" height="100%" result="map" />

            {/* * RED channel with strongest displacement */}
            <feDisplacementMap
              in="SourceGraphic"
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
              in="SourceGraphic"
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
              in="SourceGraphic"
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

            {/* * Blend channels back together (chromatic aberration) */}
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />

            {/* * Output blur softens the chromatic aberration effect */}
            <feGaussianBlur in="output" stdDeviation={outputBlur} />
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
