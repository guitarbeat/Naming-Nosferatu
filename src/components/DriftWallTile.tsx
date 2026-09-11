import React, { memo, useMemo } from "react";
import { GlassSurface } from "@/components/GlassSurface";
import { handleImgError } from "@/lib/utils";

export interface DriftWallTileProps {
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

/**
 * Reusable Drift Wall tile component with curved SVG orbit text and physical glass refraction.
 */
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

	// Full circular path centered at (100, 100) with radius 76
	const circleArcPath = "M 100, 176 a 76,76 0 1,1 0,-152 a 76,76 0 1,1 0,152";

	const { orbitDuration, orbitDelay, orbitDirection } = useMemo(() => {
		let h = 0;
		const str = `${sanitizedId}-${title}`;
		for (let i = 0; i < str.length; i++) {
			h = (h << 5) - h + str.charCodeAt(i);
			h |= 0;
		}
		const seed = Math.abs(h);
		const duration = 22 + (seed % 14); // 22s - 35s
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
