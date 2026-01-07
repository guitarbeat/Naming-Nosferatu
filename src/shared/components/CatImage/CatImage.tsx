import PropTypes from "prop-types";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

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

				const rowEnergy = new Array(h).fill(0);
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
		const commonProps = {
			ref: imageRef,
			src,
			alt,
			className: imageClassName,
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

CatImage.propTypes = {
	src: PropTypes.string,
	alt: PropTypes.string,
	containerClassName: PropTypes.string,
	imageClassName: PropTypes.string,
	loading: PropTypes.oneOf(["lazy", "eager"]),
	decoding: PropTypes.oneOf(["async", "auto", "sync"]),
	containerStyle: PropTypes.object,
	onLoad: PropTypes.func,
	onError: PropTypes.func,
};

export default CatImage;
