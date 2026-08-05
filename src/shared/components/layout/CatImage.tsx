import type React from "react";
import { useEffect, useState } from "react";
import { CAT_IMAGES } from "@/shared/lib/constants";

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

function buildSources(src: string) {
	if (!src.startsWith("/assets/images/")) {
		return null;
	}
	const extension = src.split(".").pop()?.toLowerCase();
	if (
		!extension ||
		extension === "gif" ||
		extension === "avif" ||
		extension === "webp"
	) {
		return null;
	}
	const base = src.replace(/\.[^.]+$/, "");
	return {
		avif: `${base}.avif`,
		webp: `${base}.webp`,
	};
}

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
	const [hasError, setHasError] = useState(false);
	const fallbackUrl = CAT_IMAGES[0] ?? "/assets/images/bby-cat.GIF";

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset error state when src prop changes
	useEffect(() => {
		setHasError(false);
	}, []);

	if (!src && !hasError) {
		return null;
	}

	const currentSrc = hasError ? fallbackUrl : (src ?? fallbackUrl);
	const sources = buildSources(currentSrc);
	const isLocalAsset = currentSrc.startsWith("/");
	const image = (
		<img
			src={currentSrc}
			alt={hasError ? "Fallback cat picture" : alt}
			className={imageClassName}
			loading={loading}
			decoding={decoding}
			onLoad={onLoad}
			onError={(event) => {
				setHasError(true);
				onError?.(event);
			}}
			{...(isLocalAsset ? {} : { crossOrigin: "anonymous" as const })}
		/>
	);

	return (
		<div
			className={containerClassName}
			style={
				{
					...containerStyle,
					"--bg-image": `url(${currentSrc})`,
				} as React.CSSProperties
			}
		>
			{sources ? (
				<picture className="block h-full w-full">
					<source type="image/avif" srcSet={sources.avif} />
					<source type="image/webp" srcSet={sources.webp} />
					{image}
				</picture>
			) : (
				image
			)}
		</div>
	);
}

export default CatImage;
