import React, { useCallback, useEffect, useMemo, useRef } from "react";
import "./LiquidGlass.css";

interface LiquidGlassProps {
	children: React.ReactNode;
	className?: string;
	width?: number;
	height?: number;
	radius?: number;
	scale?: number;
	saturation?: number;
	frost?: number;
	alpha?: number;
	lightness?: number;
	inputBlur?: number;
	outputBlur?: number;
	border?: number;
	blend?: string;
	xChannel?: string;
	yChannel?: string;
	chromaticR?: number;
	chromaticG?: number;
	chromaticB?: number;
	id?: string;
	showCrosshair?: boolean;
	style?: React.CSSProperties;
	[key: string]: unknown;
}

/**
 * LiquidGlass component - Creates a liquid glass refraction effect using SVG filters
 * Based on: https://codepen.io/jh3y/pen/EajLxJV
 */
function LiquidGlass({
	children,
	className = "",
	width = 240,
	height = 110,
	radius = 42,
	scale = -110,
	saturation = 1.08,
	frost = 0.12,
	alpha = 0.64,
	lightness = 48,
	inputBlur = 14,
	outputBlur = 0.9,
	border = 0.06,
	blend = "soft-light",
	xChannel = "R",
	yChannel = "B",
	chromaticR = 4,
	chromaticG = 5,
	chromaticB = 6,
	id = "liquid-glass-filter",
	showCrosshair = false,
	style = {},
	...props
}: LiquidGlassProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const svgRef = useRef<SVGSVGElement | null>(null);
	const filterRef = useRef<SVGFilterElement | null>(null);
	const displacementImageRef = useRef<HTMLDivElement | null>(null);
	const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isInitialMountRef = useRef<boolean>(true);

	// * Validate dimensions to prevent errors - memoized to avoid recalculation
	const validWidth = useMemo(() => Math.max(1, width), [width]);
	const validHeight = useMemo(() => Math.max(1, height), [height]);
	const validRadius = useMemo(() => Math.max(0, radius), [radius]);

	// * Generate unique IDs for internal filter elements
	const redChannelId = useMemo(() => `redchannel-${id}`, [id]);
	const greenChannelId = useMemo(() => `greenchannel-${id}`, [id]);
	const blueChannelId = useMemo(() => `bluechannel-${id}`, [id]);
	const feGaussianBlurId = useMemo(() => `gaussianblur-${id}`, [id]);

	// * Check browser support for backdrop-filter with url()
	// * Uses a more reliable detection method that checks if the property is actually supported
	const supportsBackdropFilterUrl = useMemo(() => {
		if (typeof window === "undefined" || typeof document === "undefined") {
			return false;
		}
		try {
			const testEl = document.createElement("div");
			testEl.style.backdropFilter = "url(#test)";
			const hasUrl = testEl.style.backdropFilter.includes("url");
			// * Clean up test element
			testEl.remove();
			return hasUrl;
		} catch {
			return false;
		}
	}, []);

	// * Calculate pill-shaped radius: minimum of specified radius or half the height
	const pillRadius = useMemo(
		() => Math.min(validRadius, validHeight * 0.5),
		[validRadius, validHeight],
	);

	// * Calculate border size
	const borderSize = useMemo(
		() => Math.min(validWidth, validHeight) * (border * 0.5),
		[validWidth, validHeight, border],
	);

	const buildDisplacementImage = useCallback(() => {
		if (!displacementImageRef.current || !filterRef.current) {
			return;
		}

		const svgContent = `
      <svg class="displacement-image" viewBox="0 0 ${validWidth} ${validHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="red-${id}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="var(--color-neutral-900)"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="blue-${id}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-neutral-900)"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <!-- backdrop -->
        <rect x="0" y="0" width="${validWidth}" height="${validHeight}" fill="black"></rect>
        <!-- red linear -->
        <rect x="0" y="0" width="${validWidth}" height="${validHeight}" rx="${pillRadius}" fill="url(#red-${id})" />
        <!-- blue linear -->
        <rect x="0" y="0" width="${validWidth}" height="${validHeight}" rx="${pillRadius}" fill="url(#blue-${id})" style="mix-blend-mode: ${blend}" />
        <!-- block out distortion (input blur controls edge softness) -->
        <rect x="${borderSize}" y="${borderSize}" width="${validWidth - borderSize * 2}" height="${validHeight - borderSize * 2}" rx="${pillRadius}" fill="hsl(0 0% ${lightness}% / ${alpha})" style="filter:blur(${inputBlur}px)" />
      </svg>
    `;

		try {
			if (!displacementImageRef.current || !filterRef.current) {
				return;
			}
			displacementImageRef.current.innerHTML = svgContent;
			const svgEl = displacementImageRef.current.querySelector(
				".displacement-image",
			) as SVGElement | null;
			if (svgEl) {
				const serialized = new XMLSerializer().serializeToString(svgEl);
				const encoded = encodeURIComponent(serialized);
				const dataUri = `data:image/svg+xml,${encoded}`;

				// * Update feImage href
				const feImage = filterRef.current.querySelector("feImage") as SVGFEImageElement | null;
				if (feImage) {
					feImage.setAttribute("href", dataUri);
				}

				// * Update all feDisplacementMap elements with x/y channel selectors (matching example pattern)
				const allDisplacementMaps = filterRef.current.querySelectorAll(
					"feDisplacementMap",
				) as NodeListOf<SVGFEDisplacementMapElement>;
				allDisplacementMaps.forEach((map) => {
					map.setAttribute("xChannelSelector", xChannel);
					map.setAttribute("yChannelSelector", yChannel);
				});
			}
		} catch (error) {
			// * Silently fail if SVG serialization fails (e.g., in test environments)
			console.warn("LiquidGlass: Failed to build displacement image", error);
		}
	}, [
		validWidth,
		validHeight,
		pillRadius,
		borderSize,
		blend,
		lightness,
		alpha,
		inputBlur,
		id,
		xChannel,
		yChannel,
	]);

	// * Check if view transitions are supported
	const supportsViewTransition = useMemo(() => {
		return typeof document !== "undefined" && "startViewTransition" in document;
	}, []);

	const updateFilter = useCallback(() => {
		if (!filterRef.current || !containerRef.current) {
			return;
		}

		buildDisplacementImage();

		// * Update CSS variables
		if (containerRef.current) {
			containerRef.current.style.setProperty("--width", `${validWidth}`);
			containerRef.current.style.setProperty("--height", `${validHeight}`);
			containerRef.current.style.setProperty("--radius", `${pillRadius}`);
			containerRef.current.style.setProperty("--frost", `${frost}`);
			containerRef.current.style.setProperty("--output-blur", `${outputBlur}`);
			containerRef.current.style.setProperty("--saturation", `${saturation}`);
			containerRef.current.style.setProperty("--filter-id", `url(#${id})`);
		}

		// * Apply backdrop-filter with browser compatibility check
		if (containerRef.current) {
			const backdropFilterValue = supportsBackdropFilterUrl
				? `url(#${id}) saturate(${saturation})` // * Chromium browsers: use url() filter for liquid glass effect
				: `blur(8px) saturate(${saturation})`; // * Fallback for Firefox/WebKit: use blur + saturate
			containerRef.current.style.setProperty("--backdrop-filter", backdropFilterValue);
			containerRef.current.style.backdropFilter = backdropFilterValue;
		}

		if (!filterRef.current) {
			return;
		}

		// * Set base scale on all feDisplacementMap elements first (matching example pattern)
		const allDisplacementMaps = filterRef.current.querySelectorAll(
			"feDisplacementMap",
		) as NodeListOf<SVGFEDisplacementMapElement>;
		allDisplacementMaps.forEach((map) => {
			map.setAttribute("scale", String(scale));
		});

		// * Update chromatic aberration displacement scales using unique IDs
		// * Override base scale with channel-specific scales
		const channels = [
			{ id: redChannelId, scale: scale + chromaticR },
			{ id: greenChannelId, scale: scale + chromaticG },
			{ id: blueChannelId, scale: scale + chromaticB },
		];

		channels.forEach(({ id: channelId, scale: channelScale }) => {
			const channel = filterRef.current?.querySelector(
				`#${channelId}`,
			) as SVGFEDisplacementMapElement | null;
			if (channel) {
				channel.setAttribute("scale", String(channelScale));
			}
		});

		// * Update output blur (softens the chromatic aberration)
		const feGaussianBlur = filterRef.current.querySelector(
			`#${feGaussianBlurId}`,
		) as SVGFEGaussianBlurElement | null;
		if (feGaussianBlur) {
			feGaussianBlur.setAttribute("stdDeviation", String(outputBlur));
		}
	}, [
		buildDisplacementImage,
		validWidth,
		validHeight,
		pillRadius,
		frost,
		outputBlur,
		saturation,
		id,
		supportsBackdropFilterUrl,
		redChannelId,
		greenChannelId,
		blueChannelId,
		feGaussianBlurId,
		scale,
		chromaticR,
		chromaticG,
		chromaticB,
	]);

	// * Wrapper function that uses view transitions for smooth updates (matching example pattern)
	const updateFilterWithTransition = useCallback(() => {
		if (!supportsViewTransition) {
			updateFilter();
			return;
		}

		// * Use view transition for smooth visual updates
		document.startViewTransition(() => {
			updateFilter();
		});
	}, [supportsViewTransition, updateFilter]);

	// * Store latest updateFilter in ref so setup effect can access it without dependency issues
	const updateFilterRef = useRef(updateFilter);
	const updateFilterWithTransitionRef = useRef(updateFilterWithTransition);

	useEffect(() => {
		updateFilterRef.current = updateFilter;
	}, [updateFilter]);

	useEffect(() => {
		updateFilterWithTransitionRef.current = updateFilterWithTransition;
	}, [updateFilterWithTransition]);

	// * Setup effect: runs once on mount to initialize filter and setup resize handler
	useEffect(() => {
		if (!containerRef.current || !svgRef.current) {
			return;
		}

		// * Get filter element by ID since we can't use ref directly on SVG filter
		const filterElement = svgRef.current.querySelector(`#${id}`) as SVGFilterElement | null;
		if (!filterElement) {
			return;
		}

		filterRef.current = filterElement;
		// * Initial update doesn't need transition
		updateFilterRef.current();
		// * Mark that initial mount is complete
		isInitialMountRef.current = false;

		// * Debounced resize handler to prevent performance issues
		const handleResize = () => {
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}
			resizeTimeoutRef.current = setTimeout(() => {
				updateFilterWithTransitionRef.current();
			}, 150); // * 150ms debounce
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}
		};
		// * Only run on mount and when id changes (filter setup)
	}, [id]);

	// * Update filter with view transition when props change (for smooth transitions)
	useEffect(() => {
		// * Skip on initial mount (handled by setup effect above)
		if (isInitialMountRef.current || !filterRef.current) {
			return;
		}
		// * Use view transition for prop changes to create smooth visual updates
		updateFilterWithTransition();
	}, [updateFilterWithTransition]);

	return (
		<div
			ref={containerRef}
			className={`liquid-glass ${className}`}
			style={
				{
					width: (style as { width?: string | number })?.width || `${validWidth}px`,
					height: (style as { height?: string | number })?.height || `${validHeight}px`,
					...(style as React.CSSProperties),
				} as React.CSSProperties
			}
			{...props}
		>
			{children}
			<svg ref={svgRef} className="liquid-glass-filter" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<filter id={id} colorInterpolationFilters="sRGB">
						{/* * The input displacement image (generated SVG with gradients) */}
						<feImage x="0" y="0" width="100%" height="100%" result="map" />

						{/* * RED channel with strongest displacement */}
						<feDisplacementMap
							in="SourceGraphic"
							in2="map"
							id={redChannelId}
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
							id={greenChannelId}
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
							id={blueChannelId}
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
						<feGaussianBlur id={feGaussianBlurId} in="output" stdDeviation={outputBlur} />
					</filter>
				</defs>
			</svg>
			<div ref={displacementImageRef} className="displacement-image-container" />
			{showCrosshair && (
				<div
					className="liquid-glass-crosshair"
					style={{
						position: "absolute",
						inset: 0,
						pointerEvents: "none",
						display: "grid",
						placeItems: "center",
					}}
				>
					<div
						style={{
							width: "40%",
							height: "2px",
							background: "rgba(255, 255, 255, 0.6)",
							borderRadius: "2px",
							position: "absolute",
						}}
					/>
					<div
						style={{
							width: "2px",
							height: "40%",
							background: "rgba(255, 255, 255, 0.6)",
							borderRadius: "2px",
							position: "absolute",
						}}
					/>
				</div>
			)}
		</div>
	);
}

// Glass configuration presets and utilities
export const DEFAULT_GLASS_CONFIG = {
	width: 240,
	height: 110,
	radius: 42,
	scale: -110,
	saturation: 1.08,
	frost: 0.12,
	inputBlur: 14,
	outputBlur: 0.9,
};

export const HEADER_GLASS_CONFIG = {
	width: 800,
	height: 60,
	radius: 12,
	scale: -90,
	saturation: 1.05,
	frost: 0.06,
	inputBlur: 10,
	outputBlur: 0.6,
};

export function resolveGlassConfig(
	liquidGlass: boolean | Record<string, unknown> | undefined,
	defaultConfig: Record<string, unknown>,
): Record<string, unknown> {
	if (typeof liquidGlass === "boolean") {
		return defaultConfig;
	}
	if (typeof liquidGlass === "object" && liquidGlass !== null) {
		return { ...defaultConfig, ...liquidGlass };
	}
	return defaultConfig;
}

export default LiquidGlass;
