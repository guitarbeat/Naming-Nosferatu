/**
 * @module CatVisuals
 * @description Cat-related visual components: CatImage with smart focal detection, BongoCat animation
 */

import { motion } from "framer-motion";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";

/* ==========================================================================
   CAT IMAGE COMPONENT
   ========================================================================== */

interface CatImageProps {
	src?: string;
	alt?: string;
	containerClassName?: string;
	imageClassName?: string;
	loading?: "lazy" | "eager";
	decoding?: "async" | "auto" | "sync";
	containerStyle?: React.CSSProperties;
	onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
	onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Shared cat image renderer used by multiple card components.
 * Handles responsive sources, fallback logging, and automatic
 * focal point detection so cat faces stay centered.
 */
function CatImage({
	src,
	alt = "Cat picture",
	containerClassName = "",
	imageClassName = "",
	loading = "lazy",
	decoding = "async",
	containerStyle,
	onLoad,
	onError,
}: CatImageProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);

	const analyseImage = useMemo(
		() => (imgEl: HTMLImageElement) => {
			try {
				const naturalW = imgEl.naturalWidth || imgEl.width;
				const naturalH = imgEl.naturalHeight || imgEl.height;
				if (!naturalW || !naturalH) {
					return {};
				}

				const targetW = 144;
				const scale = targetW / naturalW;
				const w = Math.max(16, Math.min(targetW, naturalW));
				const h = Math.max(16, Math.floor(naturalH * scale));

				const canvas = document.createElement("canvas");
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				if (!ctx) {
					return {};
				}

				ctx.drawImage(imgEl, 0, 0, w, h);
				const { data } = ctx.getImageData(0, 0, w, h);

				const rowEnergy = Array(Number(h)).fill(0);
				const toGray = (r: number, g: number, b: number) => r * 0.299 + g * 0.587 + b * 0.114;
				const idx = (x: number, y: number) => (y * w + x) * 4;

				let totalR = 0;
				let totalG = 0;
				let totalB = 0;

				for (let y = 0; y < h; y += 1) {
					let sum = 0;
					for (let x = 0; x < w; x += 1) {
						const base = idx(x, y);
						const r = data[base] ?? 0;
						const g = data[base + 1] ?? 0;
						const b = data[base + 2] ?? 0;

						totalR += r;
						totalG += g;
						totalB += b;

						if (y > 0 && y < h - 1) {
							const i1 = idx(x, y - 1);
							const i2 = idx(x, y + 1);
							const g1 = toGray(data[i1] ?? 0, data[i1 + 1] ?? 0, data[i1 + 2] ?? 0);
							const g2 = toGray(data[i2] ?? 0, data[i2 + 1] ?? 0, data[i2 + 2] ?? 0);
							sum += Math.abs(g2 - g1);
						}
					}

					if (y > 0 && y < h - 1) {
						rowEnergy[y] = sum / w;
					}
				}

				const start = Math.floor(h * 0.08);
				const end = Math.floor(h * 0.7);
				let bestY = start;
				let bestVal = -Infinity;

				for (let y = start; y < end; y += 1) {
					const e = (rowEnergy[y - 1] || 0) + rowEnergy[y] + (rowEnergy[y + 1] || 0);
					if (e > bestVal) {
						bestVal = e;
						bestY = y;
					}
				}

				const pct = Math.min(60, Math.max(10, Math.round((bestY / h) * 100)));

				const pixelCount = w * h;
				const accent = pixelCount
					? `${Math.round(totalR / pixelCount)} ${Math.round(
							totalG / pixelCount,
						)} ${Math.round(totalB / pixelCount)}`
					: undefined;

				const orientation = (() => {
					const ratio = naturalW / naturalH;
					if (ratio >= 1.45) {
						return "landscape";
					}
					if (ratio <= 0.75) {
						return "portrait";
					}
					return "square";
				})();

				return {
					focal: pct,
					accent,
					orientation,
				};
			} catch (error) {
				console.error("Failed to analyse cat image metadata", error);
				return {};
			}
		},
		[],
	);

	const applyImageEnhancements = useCallback(
		(imgEl: HTMLImageElement | null) => {
			if (!imgEl) {
				return;
			}
			const container = containerRef.current;
			if (!container) {
				return;
			}

			const { focal, accent, orientation } = analyseImage(imgEl);

			if (focal != null) {
				container.style.setProperty("--image-pos-y", `${focal}%`);
			}

			if (accent) {
				container.style.setProperty("--cat-image-accent-rgb", accent);
			}

			if (orientation) {
				container.dataset.orientation = orientation;
			}

			if (imgEl.naturalWidth && imgEl.naturalHeight && imgEl.naturalHeight > 0) {
				const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
				const isPortrait = ratio <= 0.85;
				const isUltraWide = ratio >= 1.9;
				const fit = isPortrait || isUltraWide ? "contain" : "cover";

				container.style.setProperty("--cat-image-fit", fit);
				container.style.setProperty("--cat-image-ratio", ratio.toFixed(3));
			}

			container.dataset.loaded = "true";
		},
		[analyseImage],
	);

	const handleLoad = useCallback(
		(event: React.SyntheticEvent<HTMLImageElement, Event>) => {
			const target = event?.currentTarget || imageRef.current;
			applyImageEnhancements(target);
			onLoad?.(event);
		},
		[applyImageEnhancements, onLoad],
	);

	const handleError = useCallback(
		(event: React.SyntheticEvent<HTMLImageElement, Event>) => {
			if (event?.currentTarget?.src) {
				console.error("Image failed to load:", event.currentTarget.src);
			}
			onError?.(event);
		},
		[onError],
	);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		container.dataset.loaded = "false";
		delete container.dataset.orientation;
		container.style.removeProperty("--image-pos-y");
		container.style.removeProperty("--cat-image-fit");
		container.style.removeProperty("--cat-image-ratio");
		container.style.removeProperty("--cat-image-accent-rgb");

		const imgEl = imageRef.current;
		if (imgEl?.complete) {
			applyImageEnhancements(imgEl);
		}
	}, [applyImageEnhancements]);

	if (!src) {
		return null;
	}

	const containerClasses = [containerClassName].filter(Boolean).join(" ");
	const mergedStyle = {
		...containerStyle,
		...(src ? { "--bg-image": `url(${src})` } : {}),
	} as React.CSSProperties;

	const renderImage = () => {
		// Apply focal point positioning via inline style that reads CSS variables
		const imageStyle: React.CSSProperties = {
			objectPosition: "center var(--image-pos-y, 50%)",
			objectFit: "var(--cat-image-fit, cover)" as React.CSSProperties["objectFit"],
		};

		const commonProps = {
			ref: imageRef,
			src,
			alt,
			className: imageClassName,
			style: imageStyle,
			loading,
			decoding,
			onLoad: handleLoad,
			onError: handleError,
			crossOrigin: "anonymous" as const,
		};

		if (String(src).startsWith("/assets/images/")) {
			const base = src.includes(".") ? src.replace(/\.[^.]+$/, "") : src;
			return (
				<picture>
					<source type="image/avif" srcSet={`${base}.avif`} />
					<source type="image/webp" srcSet={`${base}.webp`} />
					<img {...commonProps} />
				</picture>
			);
		}

		return <img {...commonProps} />;
	};

	return (
		<div ref={containerRef} className={containerClasses} style={mergedStyle}>
			{renderImage()}
		</div>
	);
}

export default CatImage;

/* ==========================================================================
   BONGO CAT COMPONENT
   ========================================================================== */

export interface BongoCatProps {
	/** Optional text to display below the animation */
	text?: string;
	/** Size of the animation */
	size?: "small" | "medium" | "large";
	/** Additional CSS class */
	className?: string;
}

const sizeClasses = {
	small: "w-24 h-24 text-xs",
	medium: "w-48 h-48 text-sm",
	large: "w-64 h-64 text-base",
};

export const BongoCat = memo(function BongoCat({
	text,
	size = "medium",
	className = "",
}: BongoCatProps) {
	return (
		<div
			className={`flex flex-col items-center justify-center gap-2 ${sizeClasses[size]} ${className}`}
			role="status"
			aria-label="Loading"
		>
			<svg
				className="w-full h-full drop-shadow-xl"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 787.3 433.8"
			>
				<defs>
					<symbol id="bongo-eye" viewBox="0 0 19.2 18.7">
						<circle cx="9.4" cy="9.1" r="8" fill="none" stroke="#000" strokeWidth="2" />
						<circle cx="9.4" cy="9.1" r="3" fill="#000" />
					</symbol>
					<symbol id="bongo-paw-pads" viewBox="0 0 31.4 33.9">
						<path
							d="M6.8,16a3.7,3.7,0,0,1,1.1,2.8,3.2,3.2,0,0,1-1.6,2.6L5,21.8H4.4a2.8,2.8,0,0,1-1.8.3A4.2,4.2,0,0,1,.2,19.1,7.7,7.7,0,0,1,0,17.6a2.8,2.8,0,0,1,.6-2,3.2,3.2,0,0,1,2.1-.8H4A5,5,0,0,1,6.8,16Zm7.3-4.8a1.8,1.8,0,0,0,.7-.5l.7-.4a3.5,3.5,0,0,0,1.1-1,3.2,3.2,0,0,0,.3-1.4,1.4,1.4,0,0,0-.2-.6,3.4,3.4,0,0,0-.3-2.4,3.2,3.2,0,0,0-2.1-1.5H13.1a4.7,4.7,0,0,0-1.6.4,2,2,0,0,0-.9.9l-.4.6v.4a6.1,6.1,0,0,0-.5,1.2,4.3,4.3,0,0,0,0,1.6,3.5,3.5,0,0,0,.5,2l.7.6a3.3,3.3,0,0,0,1.7.7A3,3,0,0,0,14.1,11.2ZM22.7,7l.6.2h.3A2.3,2.3,0,0,0,25,6.8l.4-.3.6-.3a7.5,7.5,0,0,0,1.5-.9,4.2,4.2,0,0,0,.8-1.2,1.9,1.9,0,0,0,.1-1.5A2.6,2.6,0,0,0,27.5,1,3.5,3.5,0,0,0,23.6.3a3.8,3.8,0,0,0-2,1.5,4.8,4.8,0,0,0-.7,2,3.6,3.6,0,0,0,.9,2.6ZM31,24.1a13.5,13.5,0,0,0-2.2-4.7,36.6,36.6,0,0,0-3.2-3.9,5.3,5.3,0,0,0-5-1.9,10.5,10.5,0,0,0-4.5,2.2A5.6,5.6,0,0,0,13.5,20a15.1,15.1,0,0,0,1.2,6.3c.8,2,1.7,4,2.6,5.9a1.6,1.6,0,0,0,1.5.8,1.7,1.7,0,0,0,1.9.9,17.1,17.1,0,0,0,8.7-4.8,8.2,8.2,0,0,0,1.7-2C31.6,26.3,31.3,25,31,24.1Z"
							fill="#ef97b0"
						/>
					</symbol>
				</defs>

				<g id="bongo-head">
					<path
						d="M295,229.2c-18.2-78.5,35.1-156.4,119-174s166.4,35.3,184.6,113.8-35.1,156.4-119,174S313.2,307.7,295,229.2Z"
						fill="#fff"
						stroke="#000"
						strokeWidth="5"
					/>
					<path
						d="M294.4,145.3c-10.8-47.7-44.9-88.5-44.9-88.5s23.1,62.1,33.8,109.8"
						fill="#fff"
						stroke="#000"
						strokeWidth="5"
						strokeLinecap="round"
					/>
					<path
						d="M559.1,82.2c-10.8-47.7-44.9-88.5-44.9-88.5s70.9,17.7,81.7,65.4"
						fill="#fff"
						stroke="#000"
						strokeWidth="5"
						strokeLinecap="round"
					/>
					<path
						d="M280.8,110.2c-5.4-23.8-22.5-44.2-22.5-44.2s11.5,31.1,16.9,54.9"
						fill="#ffd4df"
						stroke="none"
					/>
					<path
						d="M537.9,52.5c-5.4-23.8-22.5-44.2-22.5-44.2s35.5,8.8,40.9,32.7"
						fill="#ffd4df"
						stroke="none"
					/>
					<g id="bongo-face">
						<use href="#bongo-eye" x="340" y="180" width="40" height="40" />
						<use href="#bongo-eye" x="460" y="160" width="40" height="40" />
						<ellipse cx="420" cy="240" rx="8" ry="6" fill="#ffa0b4" />
						<path
							d="M420,246c0,0-15,20-30,15"
							fill="none"
							stroke="#000"
							strokeWidth="3"
							strokeLinecap="round"
						/>
						<path
							d="M420,246c0,0,15,20,30,15"
							fill="none"
							stroke="#000"
							strokeWidth="3"
							strokeLinecap="round"
						/>
						<g>
							<line x1="300" y1="230" x2="350" y2="240" stroke="#000" strokeWidth="2" />
							<line x1="295" y1="250" x2="348" y2="255" stroke="#000" strokeWidth="2" />
							<line x1="300" y1="270" x2="350" y2="265" stroke="#000" strokeWidth="2" />
							<line x1="490" y1="220" x2="540" y2="210" stroke="#000" strokeWidth="2" />
							<line x1="492" y1="240" x2="545" y2="235" stroke="#000" strokeWidth="2" />
							<line x1="490" y1="260" x2="540" y2="255" stroke="#000" strokeWidth="2" />
						</g>
					</g>
				</g>

				<g id="bongo-table">
					<rect x="50" y="380" width="700" height="50" fill="#8b7355" rx="5" />
					<rect x="50" y="375" width="700" height="10" fill="#a08060" rx="3" />
				</g>

				<g id="bongo-laptop">
					<rect
						x="180"
						y="280"
						width="200"
						height="100"
						fill="#2d2d2d"
						stroke="#1a1a1a"
						strokeWidth="4"
						rx="5"
					/>
					<g>
						{[
							{ d: "M195,300 L330,300", color: "#3de0e8" },
							{ d: "M195,315 L290,315", color: "#3de0e8" },
							{ d: "M195,330 L360,330", color: "#3de0e8" },
							{ d: "M195,345 L270,345", color: "#f97583" },
							{ d: "M195,360 L320,360", color: "#b392f0" },
						].map((line, i) => (
							<motion.path
								key={i}
								d={line.d}
								stroke={line.color}
								strokeWidth="4"
								strokeLinecap="round"
								initial={{ opacity: 0.3 }}
								animate={{ opacity: [0.3, 1, 0.3] }}
								transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
							/>
						))}
					</g>
					<path
						d="M160,380 L220,380 L200,390 L180,390 Z"
						fill="#c0c0c0"
						stroke="#a0a0a0"
						strokeWidth="2"
					/>
					<path
						d="M340,380 L400,380 L380,390 L360,390 Z"
						fill="#c0c0c0"
						stroke="#a0a0a0"
						strokeWidth="2"
					/>
					<rect x="170" y="375" width="240" height="8" fill="#e0e0e0" rx="2" />
					<rect x="185" y="368" width="210" height="12" fill="#d0d0d0" rx="2" />
				</g>

				{/* Left Paw */}
				<motion.g
					animate={{ y: [0, 20, 0] }}
					transition={{ duration: 0.2, repeat: Infinity, repeatType: "reverse" }}
				>
					<ellipse cx="230" cy="320" rx="35" ry="25" fill="#fff" stroke="#000" strokeWidth="3" />
					<use href="#bongo-paw-pads" x="210" y="305" width="40" height="35" />
				</motion.g>

				{/* Right Paw - ALTERNATING */}
				<motion.g
					animate={{ y: [20, 0, 20] }}
					transition={{ duration: 0.2, repeat: Infinity, repeatType: "reverse" }}
				>
					<ellipse cx="350" cy="320" rx="35" ry="25" fill="#fff" stroke="#000" strokeWidth="3" />
					<use href="#bongo-paw-pads" x="330" y="305" width="40" height="35" />
				</motion.g>
			</svg>
			{text && <p className="font-mono text-white/70 animate-pulse">{text}</p>}
		</div>
	);
});

BongoCat.displayName = "BongoCat";
