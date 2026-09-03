import { gsap } from "gsap";
import type React from "react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

const DEFAULT_VIEW_W = 1920;
const VIEW_H = 500;
const EDGE_PAD = 10;

export type TextLoopShape = "wave" | "circle" | "infinity" | "arch" | "line";
export type TextLoopDirection = "forward" | "reverse";

export interface TextLoopProps {
	text?: string;
	shape?: TextLoopShape;
	path?: string;
	speed?: number;
	direction?: TextLoopDirection;
	separator?: string;
	curviness?: number;
	fontSize?: number;
	fontWeight?: number | string;
	letterSpacing?: number;
	uppercase?: boolean;
	color?: string;
	ribbon?: boolean;
	ribbonColor?: string;
	ribbonWidth?: number;
	pauseOnHover?: boolean;
	className?: string;
	style?: React.CSSProperties;
}

const buildPath = (
	shape: TextLoopShape,
	curviness: number,
	ribbonWidth: number,
	viewWidth = DEFAULT_VIEW_W,
): string => {
	const c = Math.max(0, curviness);
	const cy = VIEW_H / 2;
	const cx = viewWidth / 2;
	const room = Math.max(20, cy - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);

	switch (shape) {
		case "circle": {
			const r = Math.min(130 + c * 0.95, room);
			return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
		}
		case "infinity": {
			const r = 240 + c * 1.4;
			const h = Math.min(90 + c * 0.95, room);
			return [
				`M ${cx} ${cy}`,
				`C ${cx + r * 0.55} ${cy - h} ${cx + r} ${cy - h} ${cx + r} ${cy}`,
				`C ${cx + r} ${cy + h} ${cx + r * 0.55} ${cy + h} ${cx} ${cy}`,
				`C ${cx - r * 0.55} ${cy - h} ${cx - r} ${cy - h} ${cx - r} ${cy}`,
				`C ${cx - r} ${cy + h} ${cx - r * 0.55} ${cy + h} ${cx} ${cy}`,
				"Z",
			].join(" ");
		}
		case "arch": {
			const rise = Math.min(130 + c * 1.1, room * 1.8);
			return `M -200 ${cy + rise / 2} Q ${cx} ${cy - rise * 1.5} ${viewWidth + 200} ${cy + rise / 2}`;
		}
		case "line":
			return `M -600 ${cy} L ${viewWidth + 600} ${cy}`;
		default: {
			const a = Math.min(c * 1.3, room);
			const step = 380;
			const startX = -600;
			const endX = viewWidth + 600;

			let pathStr = `M ${startX} ${cy} Q ${startX + step / 2} ${cy - a} ${startX + step} ${cy}`;
			let currentX = startX + step * 2;
			while (currentX <= endX) {
				pathStr += ` T ${currentX} ${cy}`;
				currentX += step;
			}
			return pathStr;
		}
	}
};

export const TextLoop = ({
	text = "React ✦ Bits",
	shape = "wave",
	path,
	speed = 90,
	direction = "forward",
	separator = "✦",
	curviness = 90,
	fontSize = 46,
	fontWeight = 800,
	letterSpacing = 2,
	uppercase = true,
	color = "#ffffff",
	ribbon = true,
	ribbonColor = "#5227FF",
	ribbonWidth = 86,
	pauseOnHover = true,
	className = "",
	style = {},
}: TextLoopProps) => {
	const rootRef = useRef<HTMLDivElement>(null);
	const pathRef = useRef<SVGPathElement>(null);
	const measureRef = useRef<SVGTextElement>(null);
	const headRef = useRef<SVGTextPathElement>(null);

	const [viewWidth, setViewWidth] = useState(DEFAULT_VIEW_W);

	const rawId = useId();
	const pathId = `text-loop-${rawId.replace(/:/g, "")}`;

	const isGlassRibbon = ribbon && ribbonColor === "glass";

	const resolvedRibbonColor = useMemo(() => {
		if (!ribbonColor) {
			return "currentColor";
		}
		if (ribbonColor === "glass") {
			return `url(#${pathId}-liquid-gradient)`;
		}
		// Guard against double hsl wrapping like `hsl(var(--primary))` when var already has hsl(...)
		if (ribbonColor.startsWith("hsl(var(") && ribbonColor.endsWith("))")) {
			return ribbonColor.slice(4, -1);
		}
		return ribbonColor;
	}, [ribbonColor, pathId]);

	useEffect(() => {
		const root = rootRef.current;
		if (!root || typeof ResizeObserver === "undefined") {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const width = entry.contentRect.width || root.clientWidth;
				if (width > 0) {
					setViewWidth(Math.round(width));
				}
			}
		});

		observer.observe(root);
		return () => observer.disconnect();
	}, []);

	const d = useMemo(
		() => path || buildPath(shape, curviness, ribbonWidth, viewWidth),
		[path, shape, curviness, ribbonWidth, viewWidth],
	);

	const unit = useMemo(() => {
		const base = uppercase ? String(text).toUpperCase() : String(text);
		const gap = separator ? `\u00A0${separator}\u00A0` : "\u00A0\u00A0\u00A0";
		return `${base}${gap}`;
	}, [text, separator, uppercase]);

	const textStyle = useMemo(
		() => ({
			fontSize: `${fontSize}px`,
			fontWeight,
			letterSpacing: `${letterSpacing}px`,
		}),
		[fontSize, fontWeight, letterSpacing],
	);

	const initialUnitWidth = useMemo(() => {
		return Math.max(120, Math.round(unit.length * (fontSize * 0.62 + letterSpacing)));
	}, [unit, fontSize, letterSpacing]);

	const [metrics, setMetrics] = useState(() => {
		const initialPathLength = DEFAULT_VIEW_W + 1200;
		return {
			length: initialPathLength,
			unitWidth: initialUnitWidth,
			reps: Math.max(
				2,
				Math.ceil((initialPathLength + 2 * initialUnitWidth) / initialUnitWidth) + 1,
			),
		};
	});

	useLayoutEffect(() => {
		const pathEl = pathRef.current;
		const measureEl = measureRef.current;
		if (!pathEl || !measureEl) {
			return undefined;
		}

		let cancelled = false;

		const measure = () => {
			if (cancelled) {
				return;
			}
			let measuredLength = 0;
			let measuredUnitWidth = 0;
			try {
				measuredLength = pathEl.getTotalLength();
				measuredUnitWidth = measureEl.getComputedTextLength();
			} catch {
				return;
			}

			const pathLength = measuredLength > 0 ? measuredLength : viewWidth + 1200;
			const unitWidth =
				measuredUnitWidth > 0
					? measuredUnitWidth
					: Math.max(120, Math.round(unit.length * (fontSize * 0.62 + letterSpacing)));

			const reps = Math.max(2, Math.ceil((pathLength + 2 * unitWidth) / unitWidth) + 1);

			setMetrics((prev) =>
				prev.length === pathLength && prev.unitWidth === unitWidth && prev.reps === reps
					? prev
					: { length: pathLength, unitWidth, reps },
			);
		};

		void d;
		measure();
		if (typeof document !== "undefined" && document.fonts?.ready) {
			document.fonts.ready.then(measure).catch(() => {
				// Ignore font loading errors
			});
		}

		return () => {
			cancelled = true;
		};
	}, [d, unit, fontSize, letterSpacing, viewWidth]);

	const { unitWidth } = metrics;
	useEffect(() => {
		const head = headRef.current;
		if (!head || !unitWidth) {
			return undefined;
		}

		let prefersReduced = false;
		try {
			prefersReduced =
				typeof window !== "undefined" &&
				typeof window.matchMedia === "function" &&
				window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		} catch {
			prefersReduced = false;
		}

		const initialOffset = direction === "reverse" ? 0 : -unitWidth;

		if (prefersReduced || speed <= 0) {
			head.setAttribute("startOffset", `${initialOffset}`);
			return undefined;
		}

		const targetOffset = direction === "reverse" ? -unitWidth : 0;
		const duration = unitWidth / Math.max(10, speed);

		const state = { offset: initialOffset };
		head.setAttribute("startOffset", `${initialOffset}`);

		const tween = gsap.fromTo(
			state,
			{ offset: initialOffset },
			{
				offset: targetOffset,
				duration,
				ease: "none",
				repeat: -1,
				onUpdate: () => {
					if (headRef.current) {
						headRef.current.setAttribute("startOffset", `${state.offset}`);
					}
				},
			},
		);

		const root = rootRef.current;
		const pause = () => tween.pause();
		const resume = () => tween.resume();

		if (pauseOnHover && root) {
			root.addEventListener("pointerenter", pause);
			root.addEventListener("pointerleave", resume);
		}

		return () => {
			tween.kill();
			if (pauseOnHover && root) {
				root.removeEventListener("pointerenter", pause);
				root.removeEventListener("pointerleave", resume);
			}
		};
	}, [unitWidth, speed, direction, pauseOnHover]);

	const loopText = unit.repeat(metrics.reps);

	return (
		<div ref={rootRef} className={`text-loop ${className}`.trim()} style={style}>
			<svg
				className="text-loop-svg"
				viewBox={`0 0 ${viewWidth} ${VIEW_H}`}
				preserveAspectRatio="xMidYMid meet"
				role="img"
				aria-label={text}
			>
				<defs>
					{isGlassRibbon && (
						<>
							{/* Ambient drop shadow for 3D floating glass ribbon */}
							<filter
								id={`${pathId}-shadow-filter`}
								x="-200"
								y="-200"
								width={viewWidth + 400}
								height={VIEW_H + 400}
								filterUnits="userSpaceOnUse"
							>
								<feGaussianBlur in="SourceAlpha" stdDeviation={10} result="shadowBlur" />
								<feOffset in="shadowBlur" dx={0} dy={10} result="shadowOffset" />
								<feComponentTransfer in="shadowOffset">
									<feFuncA type="linear" slope={0.35} />
								</feComponentTransfer>
								<feMerge>
									<feMergeNode />
								</feMerge>
							</filter>

							{/* Multi-tone glossy liquid gradient */}
							<linearGradient id={`${pathId}-liquid-gradient`} x1="0%" y1="0%" x2="100%" y2="80%">
								<stop offset="0%" stopColor="rgba(255, 255, 255, 0.22)">
									<animate
										attributeName="stop-color"
										values="rgba(255, 255, 255, 0.22);rgba(255, 255, 255, 0.32);rgba(255, 255, 255, 0.22)"
										dur="7s"
										repeatCount="indefinite"
									/>
								</stop>
								<stop offset="25%" stopColor="rgba(200, 225, 255, 0.12)">
									<animate
										attributeName="stop-color"
										values="rgba(200, 225, 255, 0.12);rgba(235, 215, 255, 0.20);rgba(200, 225, 255, 0.12)"
										dur="9s"
										repeatCount="indefinite"
									/>
								</stop>
								<stop offset="50%" stopColor="rgba(255, 255, 255, 0.28)">
									<animate
										attributeName="stop-color"
										values="rgba(255, 255, 255, 0.28);rgba(255, 255, 255, 0.16);rgba(255, 255, 255, 0.28)"
										dur="8s"
										repeatCount="indefinite"
									/>
								</stop>
								<stop offset="75%" stopColor="rgba(195, 225, 255, 0.13)">
									<animate
										attributeName="stop-color"
										values="rgba(195, 225, 255, 0.13);rgba(240, 220, 255, 0.22);rgba(195, 225, 255, 0.13)"
										dur="10s"
										repeatCount="indefinite"
									/>
								</stop>
								<stop offset="100%" stopColor="rgba(255, 255, 255, 0.24)" />
							</linearGradient>

							{/* High-gloss specular rim gradient */}
							<linearGradient id={`${pathId}-rim-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stopColor="rgba(255, 255, 255, 0.35)" />
								<stop offset="20%" stopColor="rgba(255, 255, 255, 0.85)" />
								<stop offset="40%" stopColor="rgba(200, 230, 255, 0.70)" />
								<stop offset="60%" stopColor="rgba(255, 255, 255, 0.90)" />
								<stop offset="80%" stopColor="rgba(235, 220, 255, 0.70)" />
								<stop offset="100%" stopColor="rgba(255, 255, 255, 0.40)" />
							</linearGradient>
						</>
					)}
				</defs>

				{/* Liquid glass physical layers (when glass mode) */}
				{isGlassRibbon && (
					<>
						{/* 1. Ambient shadow underneath curved ribbon */}
						<path
							d={d}
							fill="none"
							stroke="rgba(0, 0, 0, 0.5)"
							strokeWidth={ribbonWidth + 10}
							strokeLinecap="round"
							strokeLinejoin="round"
							filter={`url(#${pathId}-shadow-filter)`}
							opacity={0.65}
							aria-hidden="true"
						/>
						{/* 2. Pristine mathematical glass rim highlight (follows exact normal at every point) */}
						<path
							d={d}
							fill="none"
							stroke={`url(#${pathId}-rim-gradient)`}
							strokeWidth={ribbonWidth}
							strokeLinecap="round"
							strokeLinejoin="round"
							opacity={0.85}
							aria-hidden="true"
						/>
					</>
				)}

				<path
					ref={pathRef}
					id={pathId}
					d={d}
					fill="none"
					stroke={ribbon ? resolvedRibbonColor : "none"}
					strokeWidth={ribbon ? (isGlassRibbon ? Math.max(2, ribbonWidth - 3) : ribbonWidth) : 0}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>

				{/* Internal specular core & volume for glass mode */}
				{isGlassRibbon && (
					<>
						<path
							d={d}
							fill="none"
							stroke="rgba(255, 255, 255, 0.10)"
							strokeWidth={Math.max(8, ribbonWidth * 0.55)}
							strokeLinecap="round"
							strokeLinejoin="round"
							opacity={0.8}
							aria-hidden="true"
						/>
						<path
							d={d}
							fill="none"
							stroke="rgba(255, 255, 255, 0.06)"
							strokeWidth={Math.max(4, ribbonWidth * 0.25)}
							strokeLinecap="round"
							strokeLinejoin="round"
							opacity={0.9}
							aria-hidden="true"
						/>
					</>
				)}

				<text ref={measureRef} className="text-loop-measure" style={textStyle} aria-hidden="true">
					{unit}
				</text>

				<text
					className="text-loop-text"
					style={{
						...textStyle,
						filter: isGlassRibbon
							? "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.3))"
							: undefined,
					}}
					fill={color}
					dominantBaseline="central"
					aria-hidden="true"
				>
					<textPath
						ref={headRef}
						href={`#${pathId}`}
						startOffset={direction === "reverse" ? 0 : -metrics.unitWidth}
					>
						{loopText}
					</textPath>
				</text>
			</svg>
		</div>
	);
};

export default TextLoop;
