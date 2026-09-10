import React, { memo } from "react";
import { handleImgError } from "@/lib/utils";

export interface DriftWallTileProps {
	tileId: string;
	col: number;
	name: string;
	orbitText?: string;
	isSelected?: boolean;
	image?: string;
	href?: string;
	locked?: boolean;
	originalIndex?: number;
	itemIndex?: number;
	copyIndex?: number;
	reduced?: boolean;
	onClick?: () => void;
	onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
	onBlur?: () => void;
}

/**
 * Reusable Drift Wall tile component with curved SVG orbit text and smooth animation.
 */
export const DriftWallTile = memo(function DriftWallTile({
	tileId,
	col,
	name,
	orbitText,
	isSelected = false,
	image,
	href,
	onClick,
	onFocus,
	onBlur,
}: DriftWallTileProps) {
	// Dynamic, unique SVG textpath IDs for top and bottom arcs
	const topPathId = `textpath-top-${tileId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
	const bottomPathId = `textpath-bottom-${tileId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

	const desc = orbitText ? String(orbitText).trim() : "";
	const title = name ? String(name).trim() : "";

	// Split description cleanly if it's long, or place on top/bottom arc
	const descLen = desc.length;
	const descFontSize = descLen > 55 ? 10.5 : descLen > 40 ? 11.5 : descLen > 25 ? 12.5 : 13.5;
	const descLetterSpacing = descLen > 55 ? 0.35 : descLen > 40 ? 0.45 : descLen > 25 ? 0.6 : 0.75;

	const titleLen = title.length;
	const titleFontSize = titleLen > 11 ? 16 : titleLen > 8 ? 18.5 : titleLen > 5 ? 21.5 : 24.5;

	const fullLabel = title ? (desc ? `${title} - ${desc}` : title) : "tile";

	// Arcs oriented so text is ALWAYS right-side-up
	// Top arc curves over the top rim from left to right (y=100 -> top y=24 -> y=100)
	const topArcPath = "M 24 100 A 76 76 0 0 1 176 100";
	// Bottom arc curves under the bottom rim from left to right (y=100 -> bottom y=176 -> y=100)
	const bottomArcPath = "M 24 100 A 76 76 0 0 0 176 100";

	const inner = (
		<span className="drift-wall__inner">
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
						<path id={topPathId} d={topArcPath} fill="none" />
						<path id={bottomPathId} d={bottomArcPath} fill="none" />
					</defs>
					{Boolean(desc) && (
						<g className="drift-wall__arc-group">
							<text
								className="drift-wall__arc-text"
								dominantBaseline="central"
								textAnchor="middle"
								style={{
									fontSize: `${descFontSize}px`,
									letterSpacing: `${descLetterSpacing}px`,
								}}
							>
								<textPath href={`#${topPathId}`} startOffset="50%" textAnchor="middle">
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
		</span>
	);

	const commonProps = {
		className: `drift-wall__tile${isSelected ? " is-selected" : ""}`,
		"data-tile-id": tileId,
		"data-col": col,
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
					onClick?.();
				}
			}}
			{...commonProps}
		>
			{inner}
		</div>
	);
});
