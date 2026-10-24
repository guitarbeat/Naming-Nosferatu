import type React from "react";
import { memo, useEffect, useMemo, useRef } from "react";
import { handleImgError } from "@/lib/utils";

/* ==========================================================================
   LIQUID GLASS SURFACE COMPONENT
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

export const GlassSurface = memo(function GlassSurface({
	children,
	width = "100%",
	height = "100%",
	borderRadius = 24,
	backgroundOpacity = 0.16,
	saturation = 1.65,
	blur = 14,
	className = "",
	style = {},
}: GlassSurfaceProps) {
	const containerStyle: React.CSSProperties = {
		...style,
		width: typeof width === "number" ? `${width}px` : width,
		height: typeof height === "number" ? `${height}px` : height,
		borderRadius: `${borderRadius}px`,
		// @ts-expect-error custom css variables
		"--glass-frost": backgroundOpacity,
		"--glass-saturation": saturation,
		"--glass-blur": `${blur}px`,
	};

	return (
		<div className={`glass-surface glass-surface--fallback ${className}`} style={containerStyle}>
			<div className="glass-surface__refraction-lens" aria-hidden="true" />
			<div className="glass-surface__caustic-ring" aria-hidden="true" />
			<div className="glass-surface__specular-dome" aria-hidden="true" />
			<div className="glass-surface__content">{children}</div>
		</div>
	);
});

/* ==========================================================================
   IRIDESCENCE AMBIENT BACKDROP COMPONENT
   ========================================================================== */

export interface IridescenceProps {
	color?: [number, number, number] | number[];
	speed?: number;
	amplitude?: number;
	mouseReact?: boolean;
	className?: string;
}

export const Iridescence = memo(function Iridescence({
	mouseReact = true,
	className = "",
}: IridescenceProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!mouseReact || typeof window === "undefined") {
			return;
		}
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
			return;
		}

		let rafId = 0;
		const handlePointerMove = (e: MouseEvent) => {
			if (rafId) {
				return;
			}
			rafId = window.requestAnimationFrame(() => {
				rafId = 0;
				const el = containerRef.current;
				if (!el) {
					return;
				}
				const x = Math.round((e.clientX / (window.innerWidth || 1)) * 100);
				const y = Math.round((e.clientY / (window.innerHeight || 1)) * 100);
				el.style.setProperty("--iridescence-x", `${x}%`);
				el.style.setProperty("--iridescence-y", `${y}%`);
			});
		};

		window.addEventListener("mousemove", handlePointerMove, { passive: true });
		return () => {
			window.removeEventListener("mousemove", handlePointerMove);
			if (rafId) {
				window.cancelAnimationFrame(rafId);
			}
		};
	}, [mouseReact]);

	return (
		<div ref={containerRef} className={`iridescence-container ${className}`} aria-hidden="true">
			<div className="iridescence-mesh" />
		</div>
	);
});

/* ==========================================================================
   DRIFT WALL GLASS TILE
   ========================================================================== */

export interface DriftWallTileProps {
	tileId: string;
	col: number;
	name: string;
	width?: number;
	height?: number;
	orbitText?: string;
	isSelected?: boolean;
	duelSide?: "left" | "right" | null;
	isChampion?: boolean;
	isQueuedSurvivor?: boolean;
	isJustVotedWinner?: boolean;
	image?: string;
	href?: string;
	originalIndex?: number;
	brightness?: number;
	opacity?: number;
	blur?: number;
	borderWidth?: number;
	borderRadius?: number;
}

function getDescTypography(len: number) {
	if (len > 55) {
		return { fontSize: 10.5, letterSpacing: 0.35 };
	}
	if (len > 40) {
		return { fontSize: 11.5, letterSpacing: 0.45 };
	}
	if (len > 25) {
		return { fontSize: 12.5, letterSpacing: 0.6 };
	}
	return { fontSize: 13.5, letterSpacing: 0.75 };
}

function getTitleFontSize(len: number) {
	if (len > 11) {
		return 16;
	}
	if (len > 8) {
		return 18.5;
	}
	if (len > 5) {
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
	duelSide = null,
	isChampion = false,
	isQueuedSurvivor = false,
	isJustVotedWinner = false,
	image,
	href,
	originalIndex,
	brightness = 60,
	opacity = 0.85,
	blur = 11,
	borderWidth = 0.16,
	borderRadius = 9999,
}: DriftWallTileProps) {
	const sanitizedId = tileId.replace(/[^a-zA-Z0-9_-]/g, "_");
	const arcPathId = `textpath-top-${sanitizedId}`;
	const desc = orbitText ? String(orbitText).trim() : "";
	const title = name ? String(name).trim() : "";
	const descStyle = getDescTypography(desc.length);
	const titleFontSize = getTitleFontSize(title.length);
	const fullLabel = title ? (desc ? `${title} - ${desc}` : title) : "tile";

	const arcGroupStyle = useMemo(() => {
		let h = 0;
		const str = `${sanitizedId}-${title}`;
		for (let i = 0; i < str.length; i++) {
			h = ((h << 5) - h + str.charCodeAt(i)) | 0;
		}
		const seed = Math.abs(h);
		const duration = 22 + (seed % 14);
		return {
			"--orbit-duration": `${duration}s`,
			"--orbit-delay": `${-(((seed % 1000) / 1000) * duration)}s`,
			"--orbit-direction": seed % 3 === 0 ? "reverse" : "normal",
		} as React.CSSProperties;
	}, [sanitizedId, title]);

	const badgeConfig = useMemo(() => {
		if (isChampion) {
			return {
				label: "\u265B CHAMPION",
				bg: "var(--primary)",
				fg: "var(--primary-foreground)",
				ringStroke: "var(--primary)",
				ringWidth: 6.5,
				pillWidth: 82,
			};
		}
		if (isJustVotedWinner) {
			return {
				label: "\u2605 WINNER!",
				bg: "var(--secondary)",
				fg: "var(--secondary-foreground)",
				ringStroke: "var(--secondary)",
				ringWidth: 6.5,
				pillWidth: 74,
			};
		}
		if (duelSide === "left") {
			return {
				label: "\u2190 VOTE LEFT",
				bg: "var(--primary)",
				fg: "var(--primary-foreground)",
				ringStroke: "var(--primary)",
				ringWidth: 6,
				pillWidth: 84,
			};
		}
		if (duelSide === "right") {
			return {
				label: "VOTE RIGHT \u2192",
				bg: "var(--secondary)",
				fg: "var(--secondary-foreground)",
				ringStroke: "var(--secondary)",
				ringWidth: 6,
				pillWidth: 88,
			};
		}
		if (isQueuedSurvivor) {
			return {
				label: "IN BRACKET",
				bg: "var(--primary)",
				fg: "var(--primary-foreground)",
				ringStroke: "var(--primary)",
				ringWidth: 4.5,
				pillWidth: 74,
			};
		}
		if (isSelected) {
			return {
				label: "\u2713 SELECTED",
				bg: "var(--primary)",
				fg: "var(--primary-foreground)",
				ringStroke: "var(--primary)",
				ringWidth: 5.5,
				pillWidth: 68,
			};
		}
		return null;
	}, [isChampion, isJustVotedWinner, duelSide, isQueuedSurvivor, isSelected]);

	const inner = (
		<GlassSurface
			className="drift-wall__inner"
			width={width ?? "100%"}
			height={height ?? "100%"}
			borderRadius={borderRadius}
			borderWidth={borderWidth}
			brightness={brightness}
			opacity={opacity}
			blur={blur}
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
						<path
							id={arcPathId}
							d="M 100, 176 a 76,76 0 1,1 0,-152 a 76,76 0 1,1 0,152"
							fill="none"
						/>
					</defs>
					{badgeConfig && (
						<circle
							cx="100"
							cy="100"
							r="93"
							className="drift-wall__selected-ring"
							fill="none"
							stroke={badgeConfig.ringStroke}
							strokeWidth={badgeConfig.ringWidth}
						/>
					)}
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
						y={badgeConfig ? 93 : desc ? 104 : 100}
						className="drift-wall__center-name"
						dominantBaseline="central"
						textAnchor="middle"
						style={{ fontSize: `${titleFontSize}px` }}
					>
						{title}
					</text>
					{badgeConfig && (
						<g transform="translate(100, 131)">
							<rect
								x={-badgeConfig.pillWidth / 2}
								y="-10"
								width={badgeConfig.pillWidth}
								height="20"
								rx="10"
								fill={badgeConfig.bg}
							/>
							<text
								x="0"
								y="0.5"
								textAnchor="middle"
								dominantBaseline="central"
								fill={badgeConfig.fg}
								style={{
									fontSize: "9.2px",
									fontWeight: 800,
									letterSpacing: "0.07em",
									fontFamily: "var(--font-sans)",
								}}
							>
								{badgeConfig.label}
							</text>
						</g>
					)}
				</svg>
			)}
			{Boolean(image) && <span className="drift-wall__overlay" aria-hidden="true" />}
		</GlassSurface>
	);

	const stateClasses = [
		"drift-wall__tile",
		isSelected ? "is-selected" : "",
		duelSide ? `is-dueling is-dueling-${duelSide}` : "",
		isChampion ? "is-champion" : "",
		isQueuedSurvivor ? "is-queued-survivor" : "",
		isJustVotedWinner ? "is-voted-winner" : "",
	]
		.filter(Boolean)
		.join(" ");

	const commonProps = {
		className: stateClasses,
		"data-tile-id": tileId,
		"data-col": col,
		"data-original-index": originalIndex,
		"data-duel-side": duelSide ?? undefined,
		"aria-pressed": isSelected,
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
		<div role="button" tabIndex={0} aria-label={fullLabel} {...commonProps}>
			{inner}
		</div>
	);
});

export interface NameOrbProps {
	orbId: string;
	name: string;
	orbitText?: string;
	size?: number;
	className?: string;
}

export const NameOrb = memo(function NameOrb({
	orbId,
	name,
	orbitText,
	size = 152,
	className = "",
}: NameOrbProps) {
	const sanitizedId = `orb-${orbId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
	const arcPathId = `textpath-orb-${sanitizedId}`;
	const desc = orbitText ? String(orbitText).trim() : "";
	const title = name ? String(name).trim() : "";
	const descStyle = getDescTypography(desc.length);
	const titleFontSize = getTitleFontSize(title.length);

	const arcGroupStyle = useMemo(() => {
		let h = 0;
		const str = `${sanitizedId}-${title}`;
		for (let i = 0; i < str.length; i++) {
			h = ((h << 5) - h + str.charCodeAt(i)) | 0;
		}
		const seed = Math.abs(h);
		const duration = 22 + (seed % 14);
		return {
			"--orbit-duration": `${duration}s`,
			"--orbit-delay": `${-(((seed % 1000) / 1000) * duration)}s`,
			"--orbit-direction": seed % 3 === 0 ? "reverse" : "normal",
		} as React.CSSProperties;
	}, [sanitizedId, title]);

	return (
		<div
			className={`relative shrink-0 select-none pointer-events-none ${className}`}
			style={{ width: `${size}px`, height: `${size}px` }}
			aria-hidden="true"
		>
			<GlassSurface
				className="w-full h-full rounded-full"
				width={size}
				height={size}
				borderRadius={9999}
				blur={12}
			>
				<svg
					className="drift-wall__svg-face"
					viewBox="0 0 200 200"
					aria-hidden="true"
					focusable="false"
				>
					<defs>
						<path
							id={arcPathId}
							d="M 100, 176 a 76,76 0 1,1 0,-152 a 76,76 0 1,1 0,152"
							fill="none"
						/>
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
			</GlassSurface>
		</div>
	);
});
