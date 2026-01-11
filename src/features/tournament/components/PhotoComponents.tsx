/**
 * @module TournamentSetup/components/PhotoComponents
 * @description Consolidated photo gallery components
 * Includes PhotoGallery and PhotoThumbnail components
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { imagesAPI } from "../../gallery/services/imageService";
import { compressImageFile, devError } from "../../../shared/utils";
import styles from "../styles/PhotoGallery.module.css";
import { GALLERY_IMAGE_SIZES } from "../utils/tournamentUtils";

// ============================================================================
// PhotoThumbnail Component
// ============================================================================

interface PhotoThumbnailProps {
	image: string;
	index: number;
	onImageOpen: (image: string) => void;
}

const PhotoThumbnail = memo(({ image, index, onImageOpen }: PhotoThumbnailProps) => {
	const elementRef = useRef<HTMLButtonElement>(null);

	const [imageError, setImageError] = useState(false);
	const [imageLoading, setImageLoading] = useState(true);
	const [tiltStyle, setTiltStyle] = useState({});

	const handleImageLoad = useCallback(() => {
		setImageLoading(false);
		setImageError(false);
	}, []);

	const handleImageError = useCallback(() => {
		setImageError(true);
		setImageLoading(false);
	}, []);

	// * 3D tilt effect that follows mouse
	useEffect(() => {
		const element = elementRef.current;
		if (!element || imageError) {
			return;
		}

		const handleMouseMove = (e: MouseEvent) => {
			const rect = element.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			const centerX = rect.width / 2;
			const centerY = rect.height / 2;

			const rotateX = ((y - centerY) / centerY) * -5; // * Max 5 degrees
			const rotateY = ((x - centerX) / centerX) * 5; // * Max 5 degrees

			setTiltStyle({
				transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
				transition: "transform 0.1s ease-out",
			});
		};

		const handleMouseLeave = () => {
			setTiltStyle({
				transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)",
				transition: "transform 0.3s ease-out",
			});
		};

		element.addEventListener("mousemove", handleMouseMove);
		element.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			element.removeEventListener("mousemove", handleMouseMove);
			element.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [imageError]);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			// * Prevent event propagation to avoid triggering parent handlers
			e.preventDefault();
			e.stopPropagation();

			// * Validate image before opening
			if (!image || typeof image !== "string") {
				if (process.env.NODE_ENV === "development") {
					console.warn("PhotoThumbnail: Invalid image provided:", image);
				}
				return;
			}

			onImageOpen(image);
		},
		[image, onImageOpen],
	);

	// * Validate image prop
	if (!image || typeof image !== "string") {
		return null;
	}

	const isLocalAsset = image.startsWith("/assets/images/");
	const isGif = image.toLowerCase().endsWith(".gif");
	// * GIF files typically don't have .avif/.webp versions, so skip picture element
	const shouldUsePicture = isLocalAsset && !isGif;
	const base = shouldUsePicture ? image.substring(0, image.lastIndexOf(".")) : null;

	return (
		<button
			ref={elementRef}
			type="button"
			className={`${styles.photoThumbnail} ${styles.photoThumbButton} ${imageLoading ? styles.imageLoading : ""} ${imageError ? styles.imageError : ""}`}
			onClick={handleClick}
			aria-label={`Open cat photo ${index + 1}`}
			disabled={imageError}
			style={tiltStyle}
		>
			{imageError ? (
				<div className={styles.imageErrorPlaceholder}>
					<span className={styles.errorIcon}>📷</span>
					<span className={styles.errorText}>Unable to load image</span>
				</div>
			) : (
				<>
					{shouldUsePicture && base ? (
						<picture>
							<source type="image/avif" srcSet={`${base}.avif`} sizes={GALLERY_IMAGE_SIZES} />
							<source type="image/webp" srcSet={`${base}.webp`} sizes={GALLERY_IMAGE_SIZES} />
							<img
								src={image}
								alt={`Cat photo ${index + 1}`}
								loading="lazy"
								decoding="async"
								width="200"
								height="200"
								sizes={GALLERY_IMAGE_SIZES}
								onLoad={handleImageLoad}
								onError={handleImageError}
							/>
						</picture>
					) : (
						<img
							src={image}
							alt={`Cat photo ${index + 1}`}
							loading="lazy"
							decoding="async"
							width="200"
							height="200"
							sizes={GALLERY_IMAGE_SIZES}
							onLoad={handleImageLoad}
							onError={handleImageError}
						/>
					)}
					{imageLoading && (
						<div className={styles.imageLoadingPlaceholder}>
							<div className={styles.loadingSpinner} />
						</div>
					)}
				</>
			)}
			{!imageError && (
				<div className={styles.photoOverlay}>
					<span className={styles.photoIcon}>👁️</span>
				</div>
			)}
		</button>
	);
});

PhotoThumbnail.displayName = "PhotoThumbnail";

// ============================================================================
// PhotoGallery Component
// ============================================================================

interface PhotoGalleryProps {
	galleryImages?: string[];
	showAllPhotos: boolean;
	onShowAllPhotosToggle: () => void;
	onImageOpen: (image: string) => void;
	isAdmin: boolean;
	userName?: string;
	onImagesUploaded: (images: string[]) => void;
}

// ts-prune-ignore-next (used in TournamentSetup)
export function PhotoGallery({
	galleryImages = [],
	showAllPhotos,
	onShowAllPhotosToggle,
	onImageOpen,
	isAdmin,
	userName,
	onImagesUploaded,
}: PhotoGalleryProps) {
	// * Ensure galleryImages is always an array
	const safeGalleryImages = useMemo(
		() => (Array.isArray(galleryImages) ? galleryImages : []),
		[galleryImages],
	);

	const displayImages = useMemo(
		() => (showAllPhotos ? safeGalleryImages : safeGalleryImages.slice(0, 8)),
		[safeGalleryImages, showAllPhotos],
	);

	const handleFileUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files || []);
			if (!files.length) {
				return;
			}

			try {
				const uploaded: string[] = [];
				const uploadPromises = files.map(async (f) => {
					try {
						const compressed = await compressImageFile(f, {
							maxWidth: 1600,
							maxHeight: 1600,
							quality: 0.8,
						});
						const data = await imagesAPI.upload(compressed, userName || "anonymous");
						if (data?.path) {
							uploaded.push(data.path);
						}
					} catch (err) {
						devError("PhotoGallery: Failed to upload image", err);
					}
				});

				await Promise.all(uploadPromises);
				if (uploaded.length > 0) {
					onImagesUploaded(uploaded);
				}
			} catch (err) {
				devError("PhotoGallery: Upload error", err);
			}
		},
		[userName, onImagesUploaded],
	);

	return (
		<div className={styles.photoGallery}>
			<div className={styles.photoGalleryHeader}>
				<h3 className={styles.photoGalleryTitle}>Cat Photos</h3>
				{isAdmin && (
					<label className={styles.photoUploadButton}>
						<input
							type="file"
							accept="image/*"
							multiple={true}
							onChange={handleFileUpload}
							style={{ display: "none" }}
						/>
						📤 Upload
					</label>
				)}
			</div>
			<div className={styles.photoGrid}>
				{displayImages.map((image, index) => (
					<PhotoThumbnail
						key={`${image}-${index}`}
						image={image}
						index={index}
						onImageOpen={onImageOpen}
					/>
				))}
			</div>
			{safeGalleryImages.length > 8 && (
				<button
					type="button"
					className={styles.showAllPhotosButton}
					onClick={onShowAllPhotosToggle}
					aria-expanded={showAllPhotos}
				>
					{showAllPhotos ? "Show Less" : `Show All ${safeGalleryImages.length} Photos`}
				</button>
			)}
		</div>
	);
}
