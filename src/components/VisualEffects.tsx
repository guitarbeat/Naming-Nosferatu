import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import type React from "react";
import {
	type CSSProperties,
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useIntersectionObserver } from "@/hooks";
import { handleImgError, isMobileOrLowPowerDevice } from "@/lib/utils";

/* ==========================================================================
   GLASS SURFACE COMPONENT
   ========================================================================== */

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
	className?: string;
	style?: React.CSSProperties;
}

let scrollEndTimer: ReturnType<typeof setTimeout> | null = null;
const scrollEndCallbacks = new Set<() => void>();

export function triggerGlobalScroll() {
	if (scrollEndTimer !== null) {
		clearTimeout(scrollEndTimer);
	}
	scrollEndTimer = setTimeout(() => {
		scrollEndTimer = null;
		for (const cb of scrollEndCallbacks) {
			cb();
		}
	}, 120);
}

if (typeof window !== "undefined") {
	window.addEventListener("scroll", triggerGlobalScroll, {
		passive: true,
		capture: true,
	});
}

const resizeCallbacks = new Map<Element, (entry: ResizeObserverEntry) => void>();
let pooledResizeObserver: ResizeObserver | null = null;

function observeResizeWithPool(
	element: Element,
	callback: (entry: ResizeObserverEntry) => void,
): () => void {
	if (typeof window === "undefined" || typeof ResizeObserver === "undefined") {
		return () => {
			/* no-op */
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

	const SVG_NS = "http://www.w3.org/2000/svg";
	const filterEl = document.createElementNS(SVG_NS, "filter");
	filterEl.id = filterId;
	filterEl.setAttribute("color-interpolation-filters", "sRGB");
	filterEl.setAttribute("x", "-20%");
	filterEl.setAttribute("y", "-20%");
	filterEl.setAttribute("width", "140%");
	filterEl.setAttribute("height", "140%");

	const feImage = document.createElementNS(SVG_NS, "feImage");
	feImage.setAttribute("href", dataUri);
	feImage.setAttribute("x", "0");
	feImage.setAttribute("y", "0");
	feImage.setAttribute("width", "100%");
	feImage.setAttribute("height", "100%");
	feImage.setAttribute("preserveAspectRatio", "none");
	feImage.setAttribute("result", "map");
	filterEl.appendChild(feImage);

	const redDisplacement = document.createElementNS(SVG_NS, "feDisplacementMap");
	redDisplacement.setAttribute("in", "SourceGraphic");
	redDisplacement.setAttribute("in2", "map");
	redDisplacement.id = "redchannel";
	redDisplacement.setAttribute("result", "dispRed");
	redDisplacement.setAttribute("scale", redScale);
	redDisplacement.setAttribute("xChannelSelector", params.xChannel);
	redDisplacement.setAttribute("yChannelSelector", params.yChannel);
	filterEl.appendChild(redDisplacement);

	const redMatrix = document.createElementNS(SVG_NS, "feColorMatrix");
	redMatrix.setAttribute("in", "dispRed");
	redMatrix.setAttribute("type", "matrix");
	redMatrix.setAttribute("values", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0");
	redMatrix.setAttribute("result", "red");
	filterEl.appendChild(redMatrix);

	const greenDisplacement = document.createElementNS(SVG_NS, "feDisplacementMap");
	greenDisplacement.setAttribute("in", "SourceGraphic");
	greenDisplacement.setAttribute("in2", "map");
	greenDisplacement.id = "greenchannel";
	greenDisplacement.setAttribute("result", "dispGreen");
	greenDisplacement.setAttribute("scale", greenScale);
	greenDisplacement.setAttribute("xChannelSelector", params.xChannel);
	greenDisplacement.setAttribute("yChannelSelector", params.yChannel);
	filterEl.appendChild(greenDisplacement);

	const greenMatrix = document.createElementNS(SVG_NS, "feColorMatrix");
	greenMatrix.setAttribute("in", "dispGreen");
	greenMatrix.setAttribute("type", "matrix");
	greenMatrix.setAttribute("values", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0");
	greenMatrix.setAttribute("result", "green");
	filterEl.appendChild(greenMatrix);

	const blueDisplacement = document.createElementNS(SVG_NS, "feDisplacementMap");
	blueDisplacement.setAttribute("in", "SourceGraphic");
	blueDisplacement.setAttribute("in2", "map");
	blueDisplacement.id = "bluechannel";
	blueDisplacement.setAttribute("result", "dispBlue");
	blueDisplacement.setAttribute("scale", blueScale);
	blueDisplacement.setAttribute("xChannelSelector", params.xChannel);
	blueDisplacement.setAttribute("yChannelSelector", params.yChannel);
	filterEl.appendChild(blueDisplacement);

	const blueMatrix = document.createElementNS(SVG_NS, "feColorMatrix");
	blueMatrix.setAttribute("in", "dispBlue");
	blueMatrix.setAttribute("type", "matrix");
	blueMatrix.setAttribute("values", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0");
	blueMatrix.setAttribute("result", "blue");
	filterEl.appendChild(blueMatrix);

	const blendRG = document.createElementNS(SVG_NS, "feBlend");
	blendRG.setAttribute("in", "red");
	blendRG.setAttribute("in2", "green");
	blendRG.setAttribute("mode", "screen");
	blendRG.setAttribute("result", "rg");
	filterEl.appendChild(blendRG);

	const blendOutput = document.createElementNS(SVG_NS, "feBlend");
	blendOutput.setAttribute("in", "rg");
	blendOutput.setAttribute("in2", "blue");
	blendOutput.setAttribute("mode", "screen");
	blendOutput.setAttribute("result", "output");
	filterEl.appendChild(blendOutput);

	const blurFilter = document.createElementNS(SVG_NS, "feGaussianBlur");
	blurFilter.setAttribute("in", "output");
	blurFilter.setAttribute("stdDeviation", blurDev);
	filterEl.appendChild(blurFilter);

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
		// @ts-expect-error custom css variable
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
			<div className="glass-surface__refraction-lens" aria-hidden="true" />
			<div className="glass-surface__caustic-ring" aria-hidden="true" />
			<div className="glass-surface__specular-dome" aria-hidden="true" />
			<div className="glass-surface__content">{children}</div>
		</div>
	);
};

export const GlassSurface = memo(BaseGlassSurface);

/* ==========================================================================
   IRIDESCENCE COMPONENT
   ========================================================================== */

interface IridescenceProps {
	color?: [number, number, number] | number[];
	speed?: number;
	amplitude?: number;
	mouseReact?: boolean;
	className?: string;
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

function getFragmentShader(isLowPower: boolean): string {
	const precision = isLowPower ? "mediump" : "highp";
	const iterations = isLowPower ? "5.0" : "8.0";
	return `
precision ${precision} float;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;
varying vec2 vUv;
void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;
  uv += (uMouse - vec2(0.5)) * uAmplitude;
  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < ${iterations}; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;
}

export const Iridescence = memo(function Iridescence({
	color = [1, 1, 1],
	speed = 1.0,
	amplitude = 0.1,
	mouseReact = true,
	className = "",
}: IridescenceProps) {
	const ctnDom = useRef<HTMLDivElement>(null);
	const mousePos = useRef({ x: 0.5, y: 0.5 });
	const programRef = useRef<Program | null>(null);

	const r = color[0] ?? 1;
	const g = color[1] ?? 1;
	const b = color[2] ?? 1;

	const rRef = useRef(r);
	const gRef = useRef(g);
	const bRef = useRef(b);
	const speedRef = useRef(speed);
	const amplitudeRef = useRef(amplitude);

	useEffect(() => {
		rRef.current = r;
		gRef.current = g;
		bRef.current = b;
		speedRef.current = speed;
		amplitudeRef.current = amplitude;
		const program = programRef.current;
		if (program) {
			program.uniforms.uColor.value.set(r, g, b);
			program.uniforms.uSpeed.value = speed;
			program.uniforms.uAmplitude.value = amplitude;
		}
	}, [r, g, b, speed, amplitude]);

	useEffect(() => {
		const ctn = ctnDom.current;
		if (!ctn) {
			return;
		}

		let animateId = 0;
		let renderer: Renderer | null = null;
		let program: Program | null = null;
		let handleMouseMove: ((e: MouseEvent) => void) | null = null;
		let resize: (() => void) | null = null;
		let handleVisibilityChange: (() => void) | null = null;
		let isElementVisible = true;

		let cachedWidth = ctn.clientWidth || window.innerWidth || 1;
		let cachedHeight = ctn.clientHeight || window.innerHeight || 1;
		let cachedLeft = 0;
		let cachedTop = 0;

		const isLowPower = isMobileOrLowPowerDevice();
		const prefersReduced =
			typeof window !== "undefined" &&
			Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

		const maxDpr = isLowPower ? 1.0 : 1.25;

		try {
			renderer = new Renderer({
				alpha: true,
				antialias: !isLowPower,
				dpr: Math.min(window.devicePixelRatio || 1, maxDpr),
			});
			const gl = renderer.gl;
			gl.clearColor(0, 0, 0, 0);

			resize = () => {
				if (!renderer || !ctn) {
					return;
				}
				const rect = ctn.getBoundingClientRect();
				cachedWidth = rect.width || ctn.clientWidth || window.innerWidth || 1;
				cachedHeight = rect.height || ctn.clientHeight || window.innerHeight || 1;
				cachedLeft = rect.left;
				cachedTop = rect.top;

				renderer.setSize(cachedWidth, cachedHeight);
				if (program) {
					program.uniforms.uResolution.value.set(
						gl.canvas.width,
						gl.canvas.height,
						gl.canvas.width / (gl.canvas.height || 1),
					);
				}
			};

			window.addEventListener("resize", resize, false);
			resize();

			const geometry = new Triangle(gl);
			const baseColor = new Color(rRef.current, gRef.current, bRef.current);

			program = new Program(gl, {
				vertex: vertexShader,
				fragment: getFragmentShader(isLowPower),
				uniforms: {
					uTime: { value: 0 },
					uColor: { value: baseColor },
					uResolution: {
						value: new Color(
							gl.canvas.width,
							gl.canvas.height,
							gl.canvas.width / (gl.canvas.height || 1),
						),
					},
					uMouse: {
						value: new Float32Array([mousePos.current.x, mousePos.current.y]),
					},
					uAmplitude: { value: amplitudeRef.current },
					uSpeed: { value: speedRef.current },
				},
			});
			programRef.current = program;

			const mesh = new Mesh(gl, { geometry, program });
			let lastFrameTime = 0;
			const minFrameInterval = isLowPower ? 33.3 : 16.6;

			const update = (t: number) => {
				if (document.hidden || !isElementVisible) {
					animateId = 0;
					return;
				}

				const elapsed = t - lastFrameTime;
				if (elapsed >= minFrameInterval) {
					lastFrameTime = t - (elapsed % minFrameInterval);
					if (program && renderer) {
						program.uniforms.uTime.value = t * 0.001;
						renderer.render({ scene: mesh });
					}
				}

				if (!prefersReduced) {
					animateId = requestAnimationFrame(update);
				}
			};

			if (prefersReduced) {
				update(0);
			} else {
				animateId = requestAnimationFrame(update);
			}

			const observer =
				typeof IntersectionObserver === "undefined"
					? null
					: new IntersectionObserver(([entry]) => {
							isElementVisible = entry.isIntersecting;
							if (isElementVisible && !animateId && !prefersReduced && !document.hidden) {
								animateId = requestAnimationFrame(update);
							}
						});

			if (observer && ctn) {
				observer.observe(ctn);
			}

			handleVisibilityChange = () => {
				if (!document.hidden && !animateId && !prefersReduced && isElementVisible) {
					animateId = requestAnimationFrame(update);
				}
			};
			document.addEventListener("visibilitychange", handleVisibilityChange);

			gl.canvas.style.display = "block";
			gl.canvas.style.width = "100%";
			gl.canvas.style.height = "100%";
			gl.canvas.style.pointerEvents = "none";
			ctn.appendChild(gl.canvas);

			handleMouseMove = (e: MouseEvent) => {
				const x = (e.clientX - cachedLeft) / cachedWidth;
				const y = 1.0 - (e.clientY - cachedTop) / cachedHeight;
				mousePos.current = { x, y };
				if (program) {
					(program.uniforms.uMouse.value as Float32Array)[0] = x;
					(program.uniforms.uMouse.value as Float32Array)[1] = y;
					if (prefersReduced && renderer) {
						renderer.render({ scene: mesh });
					}
				}
			};

			if (mouseReact && !isLowPower) {
				window.addEventListener("mousemove", handleMouseMove, { passive: true });
			}
		} catch (err) {
			console.warn("Iridescence WebGL init failed or unsupported", err);
		}

		return () => {
			programRef.current = null;
			if (animateId) {
				cancelAnimationFrame(animateId);
			}
			if (resize) {
				window.removeEventListener("resize", resize);
			}
			if (handleVisibilityChange) {
				document.removeEventListener("visibilitychange", handleVisibilityChange);
			}
			if (mouseReact && handleMouseMove) {
				window.removeEventListener("mousemove", handleMouseMove);
			}
			if (renderer && ctn?.contains(renderer.gl.canvas)) {
				ctn.removeChild(renderer.gl.canvas);
				renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
			}
		};
	}, [mouseReact]);

	return <div ref={ctnDom} className={`iridescence-container ${className}`} aria-hidden="true" />;
});

/* ==========================================================================
   DRIFT WALL TILE COMPONENT
   ========================================================================== */

interface DriftWallTileProps {
	tileId: string;
	col: number;
	name: string;
	width?: number;
	height?: number;
	orbitText?: string;
	isSelected?: boolean;
	image?: string;
	href?: string;
	locked?: boolean;
	originalIndex?: number;
	itemIndex?: number;
	copyIndex?: number;
	reduced?: boolean;
	displace?: number;
	distortionScale?: number;
	redOffset?: number;
	greenOffset?: number;
	blueOffset?: number;
	brightness?: number;
	opacity?: number;
	blur?: number;
	borderWidth?: number;
	borderRadius?: number;
	mixBlendMode?: string;
	onClick?: () => void;
	onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
	onBlur?: () => void;
}

const DESC_TYPOGRAPHY = {
	xs: { fontSize: 10.5, letterSpacing: 0.35 },
	sm: { fontSize: 11.5, letterSpacing: 0.45 },
	md: { fontSize: 12.5, letterSpacing: 0.6 },
	lg: { fontSize: 13.5, letterSpacing: 0.75 },
} as const;

function getDescTypography(length: number) {
	if (length > 55) {
		return DESC_TYPOGRAPHY.xs;
	}
	if (length > 40) {
		return DESC_TYPOGRAPHY.sm;
	}
	if (length > 25) {
		return DESC_TYPOGRAPHY.md;
	}
	return DESC_TYPOGRAPHY.lg;
}

function getTitleFontSize(length: number) {
	if (length > 11) {
		return 16;
	}
	if (length > 8) {
		return 18.5;
	}
	if (length > 5) {
		return 21.5;
	}
	return 24.5;
}

export const DriftWallTile = memo(function DriftWallTile({
	tileId,
	col,
	name,
	width,
	height,
	orbitText,
	isSelected = false,
	image,
	href,
	originalIndex,
	displace = 0,
	distortionScale = -160,
	redOffset = 5,
	greenOffset = 15,
	blueOffset = 25,
	brightness = 60,
	opacity = 0.85,
	blur = 11,
	borderWidth = 0.16,
	borderRadius = 9999,
	mixBlendMode = "screen",
	onClick,
	onFocus,
	onBlur,
}: DriftWallTileProps) {
	const sanitizedId = tileId.replace(/[^a-zA-Z0-9_-]/g, "_");
	const arcPathId = `textpath-top-${sanitizedId}`;

	const desc = orbitText ? String(orbitText).trim() : "";
	const title = name ? String(name).trim() : "";

	const descStyle = getDescTypography(desc.length);
	const titleFontSize = getTitleFontSize(title.length);
	const fullLabel = title ? (desc ? `${title} - ${desc}` : title) : "tile";

	const circleArcPath = "M 100, 176 a 76,76 0 1,1 0,-152 a 76,76 0 1,1 0,152";

	const { orbitDuration, orbitDelay, orbitDirection } = useMemo(() => {
		let h = 0;
		const str = `${sanitizedId}-${title}`;
		for (let i = 0; i < str.length; i++) {
			h = (h << 5) - h + str.charCodeAt(i);
			h |= 0;
		}
		const seed = Math.abs(h);
		const duration = 22 + (seed % 14);
		const delay = -(((seed % 1000) / 1000) * duration);
		const direction = seed % 3 === 0 ? "reverse" : "normal";
		return { orbitDuration: duration, orbitDelay: delay, orbitDirection: direction };
	}, [sanitizedId, title]);

	const arcGroupStyle: React.CSSProperties = {
		"--orbit-duration": `${orbitDuration}s`,
		"--orbit-delay": `${orbitDelay}s`,
		"--orbit-direction": orbitDirection,
	} as React.CSSProperties;

	const inner = (
		<GlassSurface
			className="drift-wall__inner"
			width={width ?? "100%"}
			height={height ?? "100%"}
			borderRadius={borderRadius}
			borderWidth={borderWidth}
			distortionScale={distortionScale}
			redOffset={redOffset}
			greenOffset={greenOffset}
			blueOffset={blueOffset}
			brightness={brightness}
			opacity={opacity}
			blur={blur}
			displace={displace}
			mixBlendMode={mixBlendMode}
		>
			{Boolean(image) && (
				<img
					src={image}
					alt={title || "tile"}
					loading="lazy"
					decoding="async"
					draggable={false}
					onError={handleImgError}
				/>
			)}
			{Boolean(title) && (
				<svg
					className="drift-wall__svg-face"
					viewBox="0 0 200 200"
					aria-hidden="true"
					focusable="false"
				>
					<defs>
						<path id={arcPathId} d={circleArcPath} fill="none" />
					</defs>
					{Boolean(desc) && (
						<g className="drift-wall__arc-group" style={arcGroupStyle}>
							<text
								className="drift-wall__arc-text"
								dominantBaseline="central"
								textAnchor="middle"
								style={{
									fontSize: `${descStyle.fontSize}px`,
									letterSpacing: `${descStyle.letterSpacing}px`,
								}}
							>
								<textPath href={`#${arcPathId}`} startOffset="50%" textAnchor="middle">
									{desc}
								</textPath>
							</text>
						</g>
					)}
					<text
						x="100"
						y={desc ? 104 : 100}
						className="drift-wall__center-name"
						dominantBaseline="central"
						textAnchor="middle"
						style={{ fontSize: `${titleFontSize}px` }}
					>
						{title}
					</text>
				</svg>
			)}
			{Boolean(image) && <span className="drift-wall__overlay" aria-hidden="true" />}
		</GlassSurface>
	);

	const commonProps = {
		className: `drift-wall__tile${isSelected ? " is-selected" : ""}`,
		"data-tile-id": tileId,
		"data-col": col,
		"data-original-index": originalIndex,
		"aria-pressed": isSelected,
		onFocus,
		onBlur,
		onClick,
	};

	if (href) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noreferrer noopener"
				aria-label={fullLabel}
				{...commonProps}
			>
				{inner}
			</a>
		);
	}

	return (
		<div
			tabIndex={0}
			role="button"
			aria-label={fullLabel}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					if (onClick) {
						onClick();
					} else {
						e.currentTarget.click();
					}
				}
			}}
			{...commonProps}
		>
			{inner}
		</div>
	);
});

/* ==========================================================================
   DRIFT WALL COMPONENT
   ========================================================================== */

export interface DriftWallItem {
	image?: string;
	title?: string;
	name?: string;
	subtitle?: string;
	orbitText?: string;
	href?: string;
	id?: string | number;
	selected?: boolean;
	locked?: boolean;
	displace?: number;
	distortionScale?: number;
	redOffset?: number;
	greenOffset?: number;
	blueOffset?: number;
	brightness?: number;
	opacity?: number;
	blur?: number;
	borderWidth?: number;
	borderRadius?: number;
	mixBlendMode?: string;
	onClick?: () => void;
	[key: string]: unknown;
}

const DRIFT_WALL_DATA: DriftWallItem[] = [
	{
		id: "cosmo",
		title: "Cosmo",
		name: "Cosmo",
		subtitle: "Cosmic Explorer",
		orbitText: "Cosmic Explorer",
	},
	{
		id: "miso",
		title: "Miso",
		name: "Miso",
		subtitle: "Warm & Savory",
		orbitText: "Warm & Savory",
	},
	{
		id: "churro",
		title: "Churro",
		name: "Churro",
		subtitle: "Cinnamon Twist",
		orbitText: "Cinnamon Twist",
	},
	{
		id: "noodle",
		title: "Noodle",
		name: "Noodle",
		subtitle: "Long & Wobbly",
		orbitText: "Long & Wobbly",
	},
	{
		id: "fig",
		title: "Fig",
		name: "Fig",
		subtitle: "Sweet Little Tree",
		orbitText: "Sweet Little Tree",
	},
	{
		id: "shadow",
		title: "Shadow",
		name: "Shadow",
		subtitle: "Midnight Prowler",
		orbitText: "Midnight Prowler",
	},
	{
		id: "gizmo",
		title: "Gizmo",
		name: "Gizmo",
		subtitle: "Clever Tinkerer",
		orbitText: "Clever Tinkerer",
	},
	{
		id: "simon",
		title: "Simon",
		name: "Simon",
		subtitle: "Gentle Velvet Paws",
		orbitText: "Gentle Velvet Paws",
	},
	{
		id: "atticus",
		title: "Atticus",
		name: "Atticus",
		subtitle: "Noble & Wise Thinker",
		orbitText: "Noble & Wise Thinker",
	},
	{
		id: "binx",
		title: "Binx",
		name: "Binx",
		subtitle: "Shadow Familiar",
		orbitText: "Shadow Familiar",
	},
	{
		id: "luna",
		title: "Luna",
		name: "Luna",
		subtitle: "Moonlit Dreamer",
		orbitText: "Moonlit Dreamer",
	},
	{
		id: "clover",
		title: "Clover",
		name: "Clover",
		subtitle: "Lucky Four-Leaf",
		orbitText: "Lucky Four-Leaf",
	},
	{
		id: "basil",
		title: "Basil",
		name: "Basil",
		subtitle: "Fresh Fragrant Herb",
		orbitText: "Fresh Fragrant Herb",
	},
	{
		id: "salem",
		title: "Salem",
		name: "Salem",
		subtitle: "Midnight Enchanter",
		orbitText: "Midnight Enchanter",
	},
	{
		id: "smeemo",
		title: "Smeemo",
		name: "Smeemo",
		subtitle: "Curious Spirit",
		orbitText: "Curious Spirit",
	},
	{
		id: "peanut",
		title: "Peanut",
		name: "Peanut",
		subtitle: "Tiny Butterball",
		orbitText: "Tiny Butterball",
	},
	{
		id: "pepper",
		title: "Pepper",
		name: "Pepper",
		subtitle: "Spicy Firecracker",
		orbitText: "Spicy Firecracker",
	},
	{
		id: "dumpling",
		title: "Dumpling",
		name: "Dumpling",
		subtitle: "Steamed Bun",
		orbitText: "Steamed Bun",
	},
	{ id: "suki", title: "Suki", name: "Suki", subtitle: "Golden Heart", orbitText: "Golden Heart" },
	{
		id: "casper",
		title: "Casper",
		name: "Casper",
		subtitle: "Friendly Ghost",
		orbitText: "Friendly Ghost",
	},
	{
		id: "boris",
		title: "Boris",
		name: "Boris",
		subtitle: "Gentle Giant",
		orbitText: "Gentle Giant",
	},
];

export interface DriftWallProps {
	items?: DriftWallItem[];
	columns?: number;
	tileWidth?: number;
	tileHeight?: number;
	gap?: number;
	radius?: number | string;
	tilt?: number;
	turn?: number;
	roll?: number;
	perspective?: number;
	depth?: number;
	speed?: number;
	direction?: "up" | "down";
	variance?: number;
	parallax?: number;
	pauseOnHover?: boolean;
	lift?: number;
	fade?: number;
	dim?: number;
	grayscale?: boolean;
	overlayColor?: string;
	displace?: number;
	distortionScale?: number;
	redOffset?: number;
	greenOffset?: number;
	blueOffset?: number;
	brightness?: number;
	opacity?: number;
	blur?: number;
	borderWidth?: number;
	mixBlendMode?: string;
	className?: string;
	style?: CSSProperties;
	onItemClick?: (item: DriftWallItem, index: number) => void;
}

const copyIndicesCache: number[][] = [];
function getCopyIndices(copies: number): number[] {
	let cached = copyIndicesCache[copies];
	if (!cached) {
		cached = Array.from({ length: copies }, (_, i) => i);
		copyIndicesCache[copies] = cached;
	}
	return cached;
}

const columnFactor = (index: number, variance: number) => {
	const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
	return 1 + variance * pseudo;
};

export const DriftWall = memo(function DriftWall({
	items = DRIFT_WALL_DATA,
	columns = 8,
	tileWidth = 116,
	tileHeight = 116,
	gap = 18,
	radius = 9999,
	tilt = 0,
	turn = 0,
	roll = 0,
	perspective = 1200,
	depth = 120,
	speed = 42,
	direction = "up",
	variance = 0.45,
	parallax = 0.6,
	pauseOnHover = true,
	lift = 64,
	fade = 0,
	dim = 1,
	grayscale = false,
	overlayColor = "#060010",
	displace = 0,
	distortionScale = -160,
	redOffset = 5,
	greenOffset = 15,
	blueOffset = 25,
	brightness = 60,
	opacity = 0.85,
	blur = 11,
	borderWidth = 0.16,
	mixBlendMode = "screen",
	className = "",
	style,
	onItemClick,
}: DriftWallProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const planeRef = useRef<HTMLDivElement>(null);
	const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
	const rafRef = useRef<number | null>(null);

	const startLoopRef = useRef<(() => void) | null>(null);
	const offsetsRef = useRef<number[]>([]);
	const velocitiesRef = useRef<number[]>([]);
	const wheelDeltaRef = useRef(0);
	const wheelVelocityRef = useRef(0);
	const hoveredColRef = useRef<number>(-1);
	const wallHoveredRef = useRef(false);
	const pointerRef = useRef({ x: 0, y: 0 });
	const pointerDampedRef = useRef({ x: 0, y: 0 });
	const lastTsRef = useRef<number | null>(null);
	const containerRectRef = useRef<DOMRect | null>(null);

	const isIntersectingRef = useRef(true);
	const [containerWidth, setContainerWidth] = useState(1200);
	const [containerHeight, setContainerHeight] = useState(600);
	const activeIdRef = useRef<string | null>(null);
	const activeTileElRef = useRef<HTMLElement | null>(null);
	const tilesCacheRef = useRef<HTMLElement[] | null>(null);
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		try {
			if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
				const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
				setReduced(mq.matches);
				const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
				mq.addEventListener?.("change", onChange);
				return () => mq.removeEventListener?.("change", onChange);
			}
		} catch {
			/* ignore */
		}
	}, []);

	useLayoutEffect(() => {
		if (!containerRef.current) {
			return;
		}
		const ro = new ResizeObserver(([entry]) => {
			if (entry?.contentRect) {
				setContainerWidth(entry.contentRect.width || 1200);
				setContainerHeight(entry.contentRect.height || 600);
			}
		});
		ro.observe(containerRef.current);
		return () => ro.disconnect();
	}, []);

	const isMobile = containerWidth > 0 && containerWidth < 640;
	const effectiveTileWidth = isMobile ? Math.min(tileWidth, 100) : tileWidth;
	const effectiveTileHeight = isMobile
		? tileWidth === tileHeight
			? Math.min(tileHeight, 100)
			: Math.min(tileHeight, 95)
		: tileHeight;

	const effectiveColumns = useMemo(() => {
		const unit = effectiveTileWidth + gap;
		const fitting = Math.max(
			isMobile ? 2 : 4,
			Math.ceil((containerWidth + gap) / unit) + (isMobile ? 0 : 1),
		);
		if (columns) {
			return isMobile && containerWidth < 480 ? Math.min(columns, 3) : Math.max(columns, fitting);
		}
		return fitting;
	}, [containerWidth, effectiveTileWidth, gap, columns, isMobile]);

	const columnItems = useMemo(() => {
		if (!items.length) {
			return Array.from({ length: effectiveColumns }, () => []);
		}

		const seen = new Set<string>();
		const uniquePool: DriftWallItem[] = [];
		for (const item of items) {
			const key =
				item.id != null && String(item.id).trim()
					? String(item.id).trim()
					: item.title
						? item.title.trim().toLowerCase()
						: "";
			if (!key || !seen.has(key)) {
				if (key) {
					seen.add(key);
				}
				uniquePool.push(item);
			}
		}

		const totalUnique = uniquePool.length;
		if (totalUnique === 0) {
			return Array.from({ length: effectiveColumns }, () => []);
		}

		const cols: DriftWallItem[][] = Array.from({ length: effectiveColumns }, () => []);
		for (let i = 0; i < totalUnique; i++) {
			cols[i % effectiveColumns].push(uniquePool[i]);
		}

		for (let c = 0; c < effectiveColumns; c++) {
			if (cols[c].length === 0) {
				cols[c].push(uniquePool[c % totalUnique]);
			}
		}

		return cols;
	}, [items, effectiveColumns]);

	const columnMeta = useMemo(() => {
		const unit = effectiveTileHeight + gap;
		return columnItems.map((col) => {
			const count = Math.max(1, col.length);
			const copyHeight = count * unit;
			const copies = isMobile
				? Math.max(2, Math.ceil((containerHeight * 1.4) / copyHeight) + 1)
				: Math.max(3, Math.ceil((containerHeight * 2.2) / copyHeight) + 1);
			const copyIndices = getCopyIndices(copies);
			return { copyHeight, copies, copyIndices };
		});
	}, [columnItems, effectiveTileHeight, gap, containerHeight, isMobile]);

	const baseVelocities = useMemo(() => {
		const dirSign = direction === "up" ? 1 : -1;
		return columnItems.map((_, c) => {
			const altSign = c % 2 === 0 ? 1 : -1;
			return speed * columnFactor(c, variance) * dirSign * altSign;
		});
	}, [columnItems, speed, direction, variance]);

	useEffect(() => {
		offsetsRef.current = columnMeta.map((meta, c) => {
			const existing = offsetsRef.current[c];
			if (typeof existing === "number" && !Number.isNaN(existing)) {
				return ((existing % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
			}
			return (meta.copyHeight * (c * 0.382)) % meta.copyHeight;
		});
		velocitiesRef.current = columnItems.map((_, c) => velocitiesRef.current[c] ?? 0);
		tilesCacheRef.current = null;
	}, [columnMeta, columnItems]);

	const applyPlaneTransform = useCallback(
		(px: number, py: number) => {
			const plane = planeRef.current;
			if (!plane) {
				return;
			}
			plane.style.transform =
				"translate(-50%, -50%) scale(0.95) " +
				`rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
				`translateZ(${-depth}px)`;
		},
		[tilt, turn, roll, depth],
	);

	useLayoutEffect(() => {
		applyPlaneTransform(0, 0);
	}, [applyPlaneTransform]);

	useEffect(() => {
		let isIntersecting = isIntersectingRef.current;

		const startLoop = () => {
			if (rafRef.current === null && isIntersecting && !document.hidden) {
				lastTsRef.current = null;
				rafRef.current = requestAnimationFrame(animate);
			}
		};
		startLoopRef.current = startLoop;

		const stopLoop = () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			lastTsRef.current = null;
		};

		const animate = (ts: number) => {
			if (!isIntersecting || document.hidden) {
				stopLoop();
				return;
			}
			if (lastTsRef.current === null) {
				lastTsRef.current = ts;
			}
			const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
			lastTsRef.current = ts;

			const maxTilt = parallax * 8;
			const targetX = pointerRef.current.x * maxTilt;
			const targetY = -pointerRef.current.y * maxTilt;
			const damp = 1 - Math.exp(-dt / 0.12);
			pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp;
			pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp;
			applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

			const pendingWheel = wheelDeltaRef.current;
			if (pendingWheel !== 0) {
				wheelVelocityRef.current += pendingWheel * 0.9;
				wheelDeltaRef.current = 0;
			}
			const wheelImpulse = wheelVelocityRef.current;
			if (Math.abs(wheelImpulse) > 0.05) {
				wheelVelocityRef.current *= Math.exp(-dt / 0.18);
			} else {
				wheelVelocityRef.current = 0;
			}

			if (reduced) {
				applyPlaneTransform(0, 0);
				for (let c = 0; c < trackRefs.current.length; c++) {
					const el = trackRefs.current[c];
					const meta = columnMeta[c];
					if (el && meta) {
						if (Math.abs(wheelImpulse) > 0.05) {
							const colDir = c % 2 === 0 ? 1 : -1;
							let next = (offsetsRef.current[c] ?? 0) + wheelImpulse * dt * 0.45 * colDir;
							next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
							offsetsRef.current[c] = next;
						}
						el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
					}
				}
				if (Math.abs(wheelImpulse) > 0.05) {
					rafRef.current = requestAnimationFrame(animate);
				} else {
					rafRef.current = null;
					lastTsRef.current = null;
				}
				return;
			}

			const isAnyTileActive = activeIdRef.current !== null || hoveredColRef.current !== -1;
			const isFocusedInWall = containerRef.current?.contains(document.activeElement);

			for (let c = 0; c < trackRefs.current.length; c++) {
				const meta = columnMeta[c];
				if (!meta) {
					continue;
				}

				let factor = 1;
				if (pauseOnHover) {
					if (hoveredColRef.current === c || (isFocusedInWall && activeIdRef.current !== null)) {
						factor = 0;
					} else if (isAnyTileActive) {
						factor = 0.2;
					} else if (wallHoveredRef.current) {
						factor = 0.4;
					}
				}

				const target = (baseVelocities[c] ?? 0) * factor;
				const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
				const currentVel = velocitiesRef.current[c] ?? 0;
				const nextVel = currentVel + (target - currentVel) * ease;
				velocitiesRef.current[c] = nextVel;

				const colDir = c % 2 === 0 ? 1 : -1;
				let next = (offsetsRef.current[c] ?? 0) + nextVel * dt + wheelImpulse * dt * 0.45 * colDir;
				next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
				offsetsRef.current[c] = next;

				const el = trackRefs.current[c];
				if (el) {
					el.style.transform = `translate3d(0, ${-next}px, 0)`;
				}
			}

			rafRef.current = requestAnimationFrame(animate);
		};

		const observer =
			typeof IntersectionObserver !== "undefined" && containerRef.current
				? new IntersectionObserver(
						([entry]) => {
							isIntersecting = entry.isIntersecting;
							isIntersectingRef.current = isIntersecting;
							if (isIntersecting) {
								startLoop();
							} else {
								stopLoop();
							}
						},
						{ threshold: 0 },
					)
				: null;

		if (observer && containerRef.current) {
			observer.observe(containerRef.current);
		}

		const handleVisibilityChange = () => {
			if (document.hidden) {
				stopLoop();
			} else if (isIntersecting) {
				startLoop();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		startLoop();

		return () => {
			stopLoop();
			startLoopRef.current = null;
			if (observer) {
				observer.disconnect();
			}
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [baseVelocities, columnMeta, pauseOnHover, parallax, reduced, applyPlaneTransform]);

	const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
		wheelDeltaRef.current += e.deltaY;
		triggerGlobalScroll();
		if (rafRef.current === null) {
			startLoopRef.current?.();
		}
	}, []);

	const activate = useCallback((id: string, index: number, el?: HTMLElement | null) => {
		activeIdRef.current = id;
		hoveredColRef.current = index;
		if (activeTileElRef.current && activeTileElRef.current !== el) {
			activeTileElRef.current.classList.remove("is-active");
		}
		if (el) {
			el.classList.add("is-active");
			activeTileElRef.current = el;
		}
	}, []);

	const release = useCallback(() => {
		activeIdRef.current = null;
		hoveredColRef.current = -1;
		if (activeTileElRef.current) {
			activeTileElRef.current.classList.remove("is-active");
			activeTileElRef.current = null;
		}
	}, []);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			let rect = containerRectRef.current;
			if (!rect) {
				rect = e.currentTarget.getBoundingClientRect();
				containerRectRef.current = rect;
			}
			if (parallax > 0 && !reduced && rect && rect.width > 0 && rect.height > 0) {
				pointerRef.current = {
					x: (e.clientX - rect.left) / rect.width - 0.5,
					y: (e.clientY - rect.top) / rect.height - 0.5,
				};
			}
			const targetEl = e.target as HTMLElement | null;
			const tile =
				targetEl && typeof targetEl.closest === "function"
					? (targetEl.closest("[data-tile-id]") as HTMLElement | null)
					: null;
			if (!tile) {
				if (activeIdRef.current) {
					release();
				}
				return;
			}
			const id = tile.dataset.tileId;
			if (id && id === activeIdRef.current) {
				return;
			}
			if (id) {
				activate(id, Number(tile.dataset.col), tile);
			}
		},
		[parallax, reduced, activate, release],
	);

	const handlePointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		wallHoveredRef.current = true;
		containerRectRef.current = e.currentTarget.getBoundingClientRect();
	}, []);

	const handlePointerLeaveWall = useCallback(() => {
		wallHoveredRef.current = false;
		containerRectRef.current = null;
		pointerRef.current = { x: 0, y: 0 };
		release();
	}, [release]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const active = document.activeElement as HTMLElement | null;
			if (
				active &&
				(active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)
			) {
				return;
			}

			const key = e.key;
			if (
				key !== "ArrowUp" &&
				key !== "ArrowDown" &&
				key !== "ArrowLeft" &&
				key !== "ArrowRight" &&
				key !== "Home" &&
				key !== "End" &&
				key !== "PageUp" &&
				key !== "PageDown"
			) {
				return;
			}

			const container = containerRef.current;
			if (!container) {
				return;
			}

			if (!tilesCacheRef.current || tilesCacheRef.current.length === 0) {
				tilesCacheRef.current = Array.from(
					container.querySelectorAll<HTMLElement>("[data-tile-id]"),
				).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");
			}

			const allTiles = tilesCacheRef.current;
			if (!allTiles || allTiles.length === 0) {
				return;
			}

			const containerRect = container.getBoundingClientRect();
			let currentTile: HTMLElement | null = null;
			if (active && allTiles.includes(active)) {
				currentTile = active;
			} else if (activeIdRef.current) {
				currentTile = allTiles.find((t) => t.dataset.tileId === activeIdRef.current) || null;
			}

			if (!currentTile) {
				const visibleTilesList: HTMLElement[] = [];
				const topThreshold = containerRect.top + 40;
				const bottomThreshold = containerRect.bottom - 40;
				for (let i = 0; i < allTiles.length; i++) {
					const el = allTiles[i];
					const rect = el.getBoundingClientRect();
					if (rect.bottom > topThreshold && rect.top < bottomThreshold) {
						visibleTilesList.push(el);
					}
				}
				const target =
					visibleTilesList.length > 0
						? visibleTilesList[Math.floor(visibleTilesList.length / 2)]
						: allTiles[0];
				e.preventDefault();
				target.focus({ preventScroll: true });
				activate(target.dataset.tileId || "", Number(target.dataset.col), target);
				return;
			}

			const currentCol = Number(currentTile.dataset.col);
			const tilePositions: { el: HTMLElement; rect: DOMRect }[] = [];
			const visibleTiles: { el: HTMLElement; rect: DOMRect }[] = [];

			for (let i = 0; i < allTiles.length; i++) {
				const el = allTiles[i];
				if (Number(el.dataset.col) === currentCol) {
					const rect = el.getBoundingClientRect();
					const tilePos = { el, rect };
					tilePositions.push(tilePos);
					if (rect.bottom > containerRect.top && rect.top < containerRect.bottom) {
						visibleTiles.push(tilePos);
					}
				}
			}

			tilePositions.sort((a, b) => a.rect.top - b.rect.top);
			visibleTiles.sort((a, b) => a.rect.top - b.rect.top);
			const currentIndex = tilePositions.findIndex((t) => t.el === currentTile);

			let nextTile: HTMLElement | null = null;

			if (key === "ArrowDown") {
				const isAtBottomEdge =
					currentIndex >= tilePositions.length - 1 ||
					(visibleTiles.length > 0 && currentTile === visibleTiles[visibleTiles.length - 1].el) ||
					tilePositions[currentIndex]?.rect.bottom >= containerRect.bottom - 60;

				if (isAtBottomEdge) {
					const topTarget = visibleTiles[0] || tilePositions[0];
					nextTile = topTarget.el;

					const meta = columnMeta[currentCol];
					if (meta && trackRefs.current[currentCol]) {
						const currentOffset = offsetsRef.current[currentCol] ?? 0;
						const rect = nextTile.getBoundingClientRect();
						if (rect.top < containerRect.top + 20) {
							const diff = containerRect.top + 30 - rect.top;
							offsetsRef.current[currentCol] =
								(((currentOffset - diff) % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
						}
					}
				} else if (currentIndex !== -1 && currentIndex + 1 < tilePositions.length) {
					nextTile = tilePositions[currentIndex + 1].el;
				} else {
					nextTile = visibleTiles[0]?.el || tilePositions[0]?.el;
				}
			} else if (key === "ArrowUp") {
				const isAtTopEdge =
					currentIndex <= 0 ||
					(visibleTiles.length > 0 && currentTile === visibleTiles[0].el) ||
					tilePositions[currentIndex]?.rect.top <= containerRect.top + 60;

				if (isAtTopEdge) {
					const bottomTarget =
						visibleTiles[visibleTiles.length - 1] || tilePositions[tilePositions.length - 1];
					nextTile = bottomTarget.el;
				} else if (currentIndex > 0) {
					nextTile = tilePositions[currentIndex - 1].el;
				} else {
					nextTile =
						visibleTiles[visibleTiles.length - 1]?.el ||
						tilePositions[tilePositions.length - 1]?.el;
				}
			} else if (key === "Home") {
				nextTile = visibleTiles[0]?.el || tilePositions[0]?.el;
			} else if (key === "End") {
				nextTile =
					visibleTiles[visibleTiles.length - 1]?.el || tilePositions[tilePositions.length - 1]?.el;
			} else if (key === "ArrowRight" || key === "ArrowLeft") {
				const numCols = columnMeta.length;
				const targetColNum =
					key === "ArrowRight" ? (currentCol + 1) % numCols : (currentCol - 1 + numCols) % numCols;

				const currentCenterY = currentTile.getBoundingClientRect().top;
				let closest: HTMLElement | null = null;
				let minDiff = Infinity;

				for (let i = 0; i < allTiles.length; i++) {
					const tile = allTiles[i];
					if (Number(tile.dataset.col) === targetColNum) {
						const diff = Math.abs(tile.getBoundingClientRect().top - currentCenterY);
						if (diff < minDiff) {
							minDiff = diff;
							closest = tile;
						}
					}
				}
				nextTile = closest;
			}

			if (nextTile) {
				e.preventDefault();
				nextTile.focus({ preventScroll: true });
				activate(nextTile.dataset.tileId || "", Number(nextTile.dataset.col), nextTile);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [activate, columnMeta]);

	const cssVars = useMemo(
		() =>
			({
				"--dw-tile-w": `${effectiveTileWidth}px`,
				"--dw-tile-h": `${effectiveTileHeight}px`,
				"--dw-gap": `${gap}px`,
				"--dw-radius": typeof radius === "number" ? `${radius}px` : radius,
				"--dw-perspective": `${perspective}px`,
				"--dw-lift": `${lift}px`,
				"--dw-dim": dim,
				"--dw-gray": grayscale ? 1 : 0,
				"--dw-overlay": overlayColor,
				"--dw-edge": `${Math.max(0, (1 - fade) * 100)}%`,
				...style,
			}) as CSSProperties,
		[
			effectiveTileWidth,
			effectiveTileHeight,
			gap,
			radius,
			perspective,
			lift,
			dim,
			grayscale,
			overlayColor,
			fade,
			style,
		],
	);

	const itemIndexMap = useMemo(() => {
		const map = new Map<DriftWallItem, number>();
		for (let i = 0; i < items.length; i++) {
			map.set(items[i], i);
		}
		return map;
	}, [items]);

	const handleTileClick = useCallback(
		(item: DriftWallItem, originalIndex: number) => {
			if (item.onClick) {
				item.onClick();
			}
			if (onItemClick) {
				onItemClick(item, originalIndex);
			}
		},
		[onItemClick],
	);

	const handleTileClickDelegated = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const target = e.target as HTMLElement | null;
			const tile =
				target && typeof target.closest === "function"
					? (target.closest("[data-tile-id]") as HTMLElement | null)
					: null;
			if (!tile) {
				return;
			}
			const originalIndex = Number(tile.dataset.originalIndex);
			const item = items[originalIndex];
			if (item) {
				handleTileClick(item, originalIndex);
			}
		},
		[items, handleTileClick],
	);

	const handleFocusCapture = useCallback(
		(e: React.FocusEvent<HTMLDivElement>) => {
			const target = e.target as HTMLElement | null;
			const tile =
				target && typeof target.closest === "function"
					? (target.closest("[data-tile-id]") as HTMLElement | null)
					: null;
			if (tile?.dataset.tileId) {
				activate(tile.dataset.tileId, Number(tile.dataset.col), tile);
			}
		},
		[activate],
	);

	const handleBlurCapture = useCallback(
		(e: React.FocusEvent<HTMLDivElement>) => {
			if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
				release();
			}
		},
		[release],
	);

	const rootClass = ["drift-wall", reduced ? "drift-wall--reduced" : "", className]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			ref={containerRef}
			className={rootClass}
			style={cssVars}
			onClick={handleTileClickDelegated}
			onFocusCapture={handleFocusCapture}
			onBlurCapture={handleBlurCapture}
			onPointerMove={handlePointerMove}
			onWheel={handleWheel}
			onPointerEnter={handlePointerEnter}
			onPointerLeave={handlePointerLeaveWall}
			role="group"
			aria-label="Drifting wall of tiles"
		>
			<div ref={planeRef} className="drift-wall__plane">
				{columnItems.map((col, c) => {
					const meta = columnMeta[c];
					if (!meta) {
						return null;
					}
					return (
						<div className="drift-wall__col" key={`col-${c}`}>
							<div
								className="drift-wall__track"
								ref={(el) => {
									trackRefs.current[c] = el;
								}}
							>
								{meta.copyIndices.map((copyIndex) =>
									col.map((item, itemIndex) => {
										const tileId = `${c}-${copyIndex}-${itemIndex}`;
										const originalIndex = itemIndexMap.get(item) ?? itemIndex;
										return (
											<DriftWallTile
												key={tileId}
												tileId={tileId}
												col={c}
												width={effectiveTileWidth}
												height={effectiveTileHeight}
												name={item.title || item.name || "tile"}
												orbitText={item.subtitle || item.orbitText || ""}
												isSelected={Boolean(item.selected)}
												image={item.image}
												href={item.href}
												locked={item.locked}
												originalIndex={originalIndex}
												itemIndex={itemIndex}
												copyIndex={copyIndex}
												reduced={reduced}
												displace={item.displace ?? displace}
												distortionScale={item.distortionScale ?? distortionScale}
												redOffset={item.redOffset ?? redOffset}
												greenOffset={item.greenOffset ?? greenOffset}
												blueOffset={item.blueOffset ?? blueOffset}
												brightness={item.brightness ?? brightness}
												opacity={item.opacity ?? opacity}
												blur={item.blur ?? blur}
												borderWidth={item.borderWidth ?? borderWidth}
												mixBlendMode={item.mixBlendMode ?? mixBlendMode}
											/>
										);
									}),
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
});
