import React, { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "@/hooks";
import { isMobileOrLowPowerDevice } from "@/lib/uiUtils";
import "./GlassSurface.css";

export interface GlassSurfaceProps {
	children?: React.ReactNode;
	width?: number | string;
	height?: number | string;
	borderRadius?: number;
	borderWidth?: number;
	brightness?: number;
	opacity?: number;
	blur?: number;
	displace?: number;
	backgroundOpacity?: number;
	saturation?: number;
	distortionScale?: number;
	redOffset?: number;
	greenOffset?: number;
	blueOffset?: number;
	xChannel?: "R" | "G" | "B";
	yChannel?: "R" | "G" | "B";
	mixBlendMode?: string;
	checkVisibility?: boolean;
	throttleSvgUpdates?: boolean;
	className?: string;
	style?: React.CSSProperties;
}

// Global scroll state tracker to defer expensive SVG filter updates during active scrolling
let isGlobalScrolling = false;
let scrollEndTimer: ReturnType<typeof setTimeout> | null = null;
const scrollEndCallbacks = new Set<() => void>();

export function triggerGlobalScroll() {
	isGlobalScrolling = true;
	if (scrollEndTimer !== null) {
		clearTimeout(scrollEndTimer);
	}
	scrollEndTimer = setTimeout(() => {
		isGlobalScrolling = false;
		scrollEndTimer = null;
		for (const cb of scrollEndCallbacks) {
			cb();
		}
	}, 120);
}

export function getIsGlobalScrolling(): boolean {
	return isGlobalScrolling;
}

function handleGlobalScroll() {
	triggerGlobalScroll();
}

if (typeof window !== "undefined") {
	window.addEventListener("scroll", handleGlobalScroll, { passive: true, capture: true });
}

// ============================================================================
// Pooled ResizeObserver
// ============================================================================
const resizeCallbacks = new Map<Element, (entry: ResizeObserverEntry) => void>();
let pooledResizeObserver: ResizeObserver | null = null;

function observeResizeWithPool(
	element: Element,
	callback: (entry: ResizeObserverEntry) => void,
): () => void {
	if (typeof window === "undefined" || typeof ResizeObserver === "undefined") {
		return () => {
			// No-op in unsupported or server environments
		};
	}
	if (!pooledResizeObserver) {
		pooledResizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const cb = resizeCallbacks.get(entry.target);
				if (cb) {
					cb(entry);
				}
			}
		});
	}
	resizeCallbacks.set(element, callback);
	pooledResizeObserver.observe(element);

	return () => {
		resizeCallbacks.delete(element);
		pooledResizeObserver?.unobserve(element);
		if (resizeCallbacks.size === 0) {
			pooledResizeObserver?.disconnect();
			pooledResizeObserver = null;
		}
	};
}

// ============================================================================
// Shared SVG Filter Registry
// ============================================================================
interface SharedFilterRecord {
	refCount: number;
	filterEl: SVGFilterElement;
}

const sharedFilterRegistry = new Map<string, SharedFilterRecord>();
let sharedSvgContainer: SVGSVGElement | null = null;
let sharedDefs: SVGDefsElement | null = null;

function ensureSharedSvgDefs(): SVGDefsElement | null {
	if (typeof document === "undefined") {
		return null;
	}
	if (!sharedSvgContainer || !document.body.contains(sharedSvgContainer)) {
		let container = document.getElementById(
			"glass-surface-shared-filters",
		) as unknown as SVGSVGElement | null;
		if (container) {
			sharedDefs = container.querySelector("defs") || null;
		} else {
			container = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			container.id = "glass-surface-shared-filters";
			container.setAttribute("aria-hidden", "true");
			container.style.position = "absolute";
			container.style.width = "0";
			container.style.height = "0";
			container.style.overflow = "hidden";
			container.style.pointerEvents = "none";
			const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
			container.appendChild(defs);
			document.body.appendChild(container);
			sharedDefs = defs;
		}
		sharedSvgContainer = container;
	}
	return sharedDefs;
}

interface FilterParams {
	actualWidth: number;
	actualHeight: number;
	effectiveRadius: number;
	edgeSize: number;
	isCircular: boolean;
	brightness: number;
	opacity: number;
	blur: number;
	distortionScale: number;
	redOffset: number;
	greenOffset: number;
	blueOffset: number;
	xChannel: "R" | "G" | "B";
	yChannel: "R" | "G" | "B";
	displace: number;
	mixBlendMode: string;
}

function registerSharedFilter(signature: string, params: FilterParams): string {
	const defs = ensureSharedSvgDefs();
	if (!defs) {
		return "";
	}

	const filterId = `gf-${signature}`;
	const existing = sharedFilterRegistry.get(filterId);
	if (existing) {
		existing.refCount++;
		return filterId;
	}

	const redGradId = `rg-${signature}`;
	const blueGradId = `bg-${signature}`;

	const svgContent = params.isCircular
		? `<svg viewBox="0 0 ${params.actualWidth} ${params.actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="${redGradId}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#808080" stop-opacity="0" />
            <stop offset="65%" stop-color="#808080" stop-opacity="0.15" />
            <stop offset="88%" stop-color="#ff0055" stop-opacity="0.85" />
            <stop offset="100%" stop-color="#000000" stop-opacity="1" />
          </radialGradient>
          <radialGradient id="${blueGradId}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#808080" stop-opacity="0" />
            <stop offset="65%" stop-color="#808080" stop-opacity="0.15" />
            <stop offset="88%" stop-color="#0066ff" stop-opacity="0.85" />
            <stop offset="100%" stop-color="#00ff88" stop-opacity="1" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="${params.actualWidth}" height="${params.actualHeight}" fill="#000000" />
        <circle cx="${params.actualWidth / 2}" cy="${params.actualHeight / 2}" r="${params.effectiveRadius}" fill="url(#${redGradId})" />
        <circle cx="${params.actualWidth / 2}" cy="${params.actualHeight / 2}" r="${params.effectiveRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${params.mixBlendMode}" />
        <circle cx="${params.actualWidth / 2}" cy="${params.actualHeight / 2}" r="${Math.max(0, params.effectiveRadius - params.edgeSize)}" fill="hsl(0 0% ${params.brightness}% / ${params.opacity})" style="filter:blur(${params.blur}px)" />
      </svg>`
		: `<svg viewBox="0 0 ${params.actualWidth} ${params.actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${params.actualWidth}" height="${params.actualHeight}" fill="black" />
        <rect x="0" y="0" width="${params.actualWidth}" height="${params.actualHeight}" rx="${params.effectiveRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${params.actualWidth}" height="${params.actualHeight}" rx="${params.effectiveRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${params.mixBlendMode}" />
        <rect x="${params.edgeSize}" y="${params.edgeSize}" width="${Math.max(0, params.actualWidth - params.edgeSize * 2)}" height="${Math.max(0, params.actualHeight - params.edgeSize * 2)}" rx="${Math.max(0, params.effectiveRadius - params.edgeSize)}" fill="hsl(0 0% ${params.brightness}% / ${params.opacity})" style="filter:blur(${params.blur}px)" />
      </svg>`;

	const dataUri = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
	const redScale = (params.distortionScale + params.redOffset).toString();
	const greenScale = (params.distortionScale + params.greenOffset).toString();
	const blueScale = (params.distortionScale + params.blueOffset).toString();
	const blurDev = params.displace.toString();

	const filterEl = document.createElementNS("http://www.w3.org/2000/svg", "filter");
	filterEl.id = filterId;
	filterEl.setAttribute("color-interpolation-filters", "sRGB");
	filterEl.setAttribute("x", "-20%");
	filterEl.setAttribute("y", "-20%");
	filterEl.setAttribute("width", "140%");
	filterEl.setAttribute("height", "140%");

	filterEl.innerHTML = `
		<feImage href="${dataUri}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
		<feDisplacementMap in="SourceGraphic" in2="map" id="redchannel" result="dispRed" scale="${redScale}" xChannelSelector="${params.xChannel}" yChannelSelector="${params.yChannel}" />
		<feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
		<feDisplacementMap in="SourceGraphic" in2="map" id="greenchannel" result="dispGreen" scale="${greenScale}" xChannelSelector="${params.xChannel}" yChannelSelector="${params.yChannel}" />
		<feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
		<feDisplacementMap in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue" scale="${blueScale}" xChannelSelector="${params.xChannel}" yChannelSelector="${params.yChannel}" />
		<feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
		<feBlend in="red" in2="green" mode="screen" result="rg" />
		<feBlend in="rg" in2="blue" mode="screen" result="output" />
		<feGaussianBlur in="output" stdDeviation="${blurDev}" />
	`;

	defs.appendChild(filterEl);
	sharedFilterRegistry.set(filterId, { refCount: 1, filterEl });
	return filterId;
}

function releaseSharedFilter(filterId: string) {
	const record = sharedFilterRegistry.get(filterId);
	if (!record) {
		return;
	}
	record.refCount--;
	if (record.refCount <= 0) {
		record.filterEl.remove();
		sharedFilterRegistry.delete(filterId);
	}
}

function areStylesEqual(prevStyle?: React.CSSProperties, nextStyle?: React.CSSProperties): boolean {
	if (prevStyle === nextStyle) {
		return true;
	}
	if (!prevStyle || !nextStyle) {
		return false;
	}
	const prevKeys = Object.keys(prevStyle);
	const nextKeys = Object.keys(nextStyle);
	if (prevKeys.length !== nextKeys.length) {
		return false;
	}
	for (const key of prevKeys) {
		if (
			(prevStyle as Record<string, unknown>)[key] !== (nextStyle as Record<string, unknown>)[key]
		) {
			return false;
		}
	}
	return true;
}

function areGlassSurfacePropsEqual(
	prevProps: GlassSurfaceProps,
	nextProps: GlassSurfaceProps,
): boolean {
	if (prevProps.children !== nextProps.children) {
		return false;
	}
	if (prevProps.className !== nextProps.className) {
		return false;
	}
	if (prevProps.width !== nextProps.width) {
		return false;
	}
	if (prevProps.height !== nextProps.height) {
		return false;
	}
	if (prevProps.borderRadius !== nextProps.borderRadius) {
		return false;
	}
	if (prevProps.borderWidth !== nextProps.borderWidth) {
		return false;
	}
	if (prevProps.brightness !== nextProps.brightness) {
		return false;
	}
	if (prevProps.opacity !== nextProps.opacity) {
		return false;
	}
	if (prevProps.blur !== nextProps.blur) {
		return false;
	}
	if (prevProps.displace !== nextProps.displace) {
		return false;
	}
	if (prevProps.backgroundOpacity !== nextProps.backgroundOpacity) {
		return false;
	}
	if (prevProps.saturation !== nextProps.saturation) {
		return false;
	}
	if (prevProps.distortionScale !== nextProps.distortionScale) {
		return false;
	}
	if (prevProps.redOffset !== nextProps.redOffset) {
		return false;
	}
	if (prevProps.greenOffset !== nextProps.greenOffset) {
		return false;
	}
	if (prevProps.blueOffset !== nextProps.blueOffset) {
		return false;
	}
	if (prevProps.xChannel !== nextProps.xChannel) {
		return false;
	}
	if (prevProps.yChannel !== nextProps.yChannel) {
		return false;
	}
	if (prevProps.mixBlendMode !== nextProps.mixBlendMode) {
		return false;
	}
	if (prevProps.checkVisibility !== nextProps.checkVisibility) {
		return false;
	}
	if (prevProps.throttleSvgUpdates !== nextProps.throttleSvgUpdates) {
		return false;
	}
	return areStylesEqual(prevProps.style, nextProps.style);
}

/**
 * Higher-Order Component / Throttle decorator that wraps a Glass component
 * to ensure SVG filter and displacement map DOM calculations pause during scroll events.
 */
export function withScrollThrottledFilter<P extends GlassSurfaceProps>(
	WrappedComponent: React.ComponentType<P>,
): React.FC<P> {
	const ThrottledComponent: React.FC<P> = (props) => {
		return <WrappedComponent {...props} throttleSvgUpdates={true} />;
	};
	ThrottledComponent.displayName = `withScrollThrottledFilter(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
	return React.memo(ThrottledComponent, (prev, next) =>
		areGlassSurfacePropsEqual(prev as GlassSurfaceProps, next as GlassSurfaceProps),
	);
}

/**
 * Base physical refractive glass surface with chromatic aberration displacement mapping.
 * Uses React.memo, ref-based prop caching, and scroll-aware throttling to prevent unneeded SVG filter calculations.
 */
const BaseGlassSurface = function BaseGlassSurface({
	children,
	width = 200,
	height = 80,
	borderRadius = 20,
	borderWidth = 0.07,
	brightness = 50,
	opacity = 0.93,
	blur = 11,
	displace = 0,
	backgroundOpacity = 0,
	saturation = 1,
	distortionScale = -180,
	redOffset = 0,
	greenOffset = 10,
	blueOffset = 20,
	xChannel = "R",
	yChannel = "G",
	mixBlendMode = "screen",
	checkVisibility = true,
	className = "",
	style = {},
}: GlassSurfaceProps) {
	const [svgSupported] = useState(() => {
		return (
			typeof window !== "undefined" &&
			!isMobileOrLowPowerDevice() &&
			typeof SVGFEDisplacementMapElement !== "undefined" &&
			typeof SVGFEColorMatrixElement !== "undefined"
		);
	});

	const containerRef = useRef<HTMLDivElement>(null);
	const [filterId, setFilterId] = useState<string>("");
	const currentFilterIdRef = useRef<string>("");

	const isVisible = useIntersectionObserver(containerRef, {
		enabled: checkVisibility,
		rootMargin: "140px",
		threshold: 0,
		initialIsVisible: true,
	});

	const [measuredSize, setMeasuredSize] = useState<{ width: number; height: number }>(() => {
		const initW = typeof width === "number" ? width : 200;
		const initH = typeof height === "number" ? height : 80;
		return { width: initW, height: initH };
	});

	// Measure true dimensions if responsive width/height are used
	useEffect(() => {
		if (!isVisible || !containerRef.current) {
			return;
		}

		if (typeof width === "number" && typeof height === "number") {
			setMeasuredSize((prev) => {
				if (prev.width === width && prev.height === height) {
					return prev;
				}
				return { width, height };
			});
			return;
		}

		const rect = containerRef.current.getBoundingClientRect();
		if (rect.width > 0 && rect.height > 0) {
			const rw = Math.round(rect.width);
			const rh = Math.round(rect.height);
			setMeasuredSize((prev) => {
				if (prev.width === rw && prev.height === rh) {
					return prev;
				}
				return { width: rw, height: rh };
			});
		}

		const unobserve = observeResizeWithPool(containerRef.current, (entry) => {
			const w = Math.round(entry.contentRect.width);
			const h = Math.round(entry.contentRect.height);
			if (w > 0 && h > 0) {
				setMeasuredSize((prev) => {
					if (Math.abs(prev.width - w) > 4 || Math.abs(prev.height - h) > 4) {
						return { width: w, height: h };
					}
					return prev;
				});
			}
		});

		return unobserve;
	}, [isVisible, width, height]);

	// Register / update shared filter
	useEffect(() => {
		if (!isVisible || !svgSupported) {
			if (currentFilterIdRef.current) {
				releaseSharedFilter(currentFilterIdRef.current);
				currentFilterIdRef.current = "";
				setFilterId("");
			}
			return;
		}

		const actualWidth = measuredSize.width;
		const actualHeight = measuredSize.height;
		const effectiveRadius = Math.min(borderRadius, Math.min(actualWidth, actualHeight) / 2);
		const isCircular = effectiveRadius >= Math.min(actualWidth, actualHeight) / 2 - 2;
		const edgeSize =
			Math.round(Math.min(actualWidth, actualHeight) * (borderWidth * 0.5) * 10) / 10;

		const signature = `${actualWidth}_${actualHeight}_${effectiveRadius}_${edgeSize}_${isCircular ? 1 : 0}_${brightness}_${opacity}_${blur}_${distortionScale}_${redOffset}_${greenOffset}_${blueOffset}_${xChannel}_${yChannel}_${displace}_${mixBlendMode}`;

		const newFilterId = registerSharedFilter(signature, {
			actualWidth,
			actualHeight,
			effectiveRadius,
			edgeSize,
			isCircular,
			brightness,
			opacity,
			blur,
			distortionScale,
			redOffset,
			greenOffset,
			blueOffset,
			xChannel,
			yChannel,
			displace,
			mixBlendMode,
		});

		if (currentFilterIdRef.current && currentFilterIdRef.current !== newFilterId) {
			releaseSharedFilter(currentFilterIdRef.current);
		}
		currentFilterIdRef.current = newFilterId;
		setFilterId(newFilterId);

		return () => {
			if (currentFilterIdRef.current) {
				releaseSharedFilter(currentFilterIdRef.current);
				currentFilterIdRef.current = "";
			}
		};
	}, [
		isVisible,
		svgSupported,
		measuredSize.width,
		measuredSize.height,
		borderRadius,
		borderWidth,
		brightness,
		opacity,
		blur,
		distortionScale,
		redOffset,
		greenOffset,
		blueOffset,
		xChannel,
		yChannel,
		displace,
		mixBlendMode,
	]);

	const hasActiveSvgFilter = isVisible && svgSupported && Boolean(filterId);

	const containerStyle: React.CSSProperties = {
		...style,
		width: typeof width === "number" ? `${width}px` : width,
		height: typeof height === "number" ? `${height}px` : height,
		borderRadius: `${borderRadius}px`,
		// @ts-expect-error custom css variables
		"--glass-frost": backgroundOpacity,
		"--glass-saturation": saturation,
		"--filter-id": hasActiveSvgFilter ? `url(#${filterId})` : "none",
	};

	return (
		<div
			ref={containerRef}
			className={`glass-surface ${hasActiveSvgFilter ? "glass-surface--svg" : "glass-surface--fallback"} ${className}`}
			style={containerStyle}
		>
			{/* Optical lens layers for physical light refraction and chromatic distortion */}
			<div className="glass-surface__refraction-lens" aria-hidden="true" />
			<div className="glass-surface__caustic-ring" aria-hidden="true" />
			<div className="glass-surface__specular-dome" aria-hidden="true" />

			<div className="glass-surface__content">{children}</div>
		</div>
	);
};

export const GlassSurface = React.memo(BaseGlassSurface, areGlassSurfacePropsEqual);
