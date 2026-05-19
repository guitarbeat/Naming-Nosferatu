import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomOut } from "@/shared/lib/icons";

interface LightboxImageProps {
	src: string;
	alt: string;
	className?: string;
	onError?: () => void;
	onLoad?: () => void;
}

function LightboxImage({ src, alt, className, onError, onLoad }: LightboxImageProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const maxRetries = 3;

	const handleLoad = useCallback(() => {
		if (retryTimeoutRef.current) {
			clearTimeout(retryTimeoutRef.current);
			retryTimeoutRef.current = null;
		}
		setIsLoading(false);
		setHasError(false);
		onLoad?.();
	}, [onLoad]);

	const handleError = useCallback(() => {
		if (retryCount < maxRetries) {
			if (retryTimeoutRef.current) {
				clearTimeout(retryTimeoutRef.current);
			}
			retryTimeoutRef.current = setTimeout(
				() => {
					setRetryCount((prev) => prev + 1);
					retryTimeoutRef.current = null;
				},
				1000 * (retryCount + 1),
			);
		} else {
			setIsLoading(false);
			setHasError(true);
			onError?.();
		}
	}, [retryCount, onError]);

	useEffect(() => {
		if (retryTimeoutRef.current) {
			clearTimeout(retryTimeoutRef.current);
			retryTimeoutRef.current = null;
		}
		setIsLoading(true);
		setHasError(false);
		setRetryCount(0);
		if (!src) {
			setIsLoading(false);
		}
	}, [src]);

	useEffect(() => {
		return () => {
			if (retryTimeoutRef.current) {
				clearTimeout(retryTimeoutRef.current);
				retryTimeoutRef.current = null;
			}
		};
	}, []);

	if (hasError) {
		return (
			<div className={`flex items-center justify-center text-muted-foreground ${className}`}>
				<div className="text-center">
					<div className="text-6xl mb-4">🐱</div>
					<p className="text-sm mb-2">Image failed to load</p>
					{retryCount >= maxRetries && (
						<button
							type="button"
							onClick={() => {
								setRetryCount(0);
								setHasError(false);
								setIsLoading(true);
							}}
							className="px-3 py-1 text-xs bg-foreground/10 hover:bg-foreground/20 rounded-full transition-colors"
						>
							Retry
						</button>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="relative">
			{isLoading && (
				<div className={`absolute inset-0 flex items-center justify-center ${className}`}>
					<div className="animate-spin rounded-full h-12 w-12 border-4 border-foreground/20 border-t-foreground" />
				</div>
			)}
			<img
				src={src}
				alt={alt}
				className={`${className ?? ""} transition-[opacity,transform] duration-300 ease-out ${isLoading ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"}`.trim()}
				onLoad={handleLoad}
				onError={handleError}
				loading="eager"
				decoding="async"
			/>
		</div>
	);
}

interface LightboxProps {
	images: string[];
	currentIndex: number;
	onClose: () => void;
	onNavigate: (index: number) => void;
}

export function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {
	const lightboxRef = useRef<HTMLDivElement>(null);
	const [isZoomed, setIsZoomed] = useState(false);
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

	// Preload adjacent images for better performance with cleanup
	useEffect(() => {
		const preloadAdjacent = () => {
			const indices = [
				(currentIndex - 1 + images.length) % images.length,
				(currentIndex + 1) % images.length,
			];

			indices.forEach((index) => {
				const img = images[index];
				if (img && !preloadedImages.has(img)) {
					const preloadImg = new Image();
					preloadImg.src = img;
					// Add onload event to ensure image is actually loaded before adding to set
					preloadImg.onload = () => {
						setPreloadedImages((prev) => new Set([...prev, img]));
					};
				}
			});
		};

		preloadAdjacent();
	}, [currentIndex, images, preloadedImages]);

	// Cleanup preloaded images when component unmounts or images change
	// biome-ignore lint/correctness/useExhaustiveDependencies: images change triggers cleanup
	useEffect(() => {
		return () => {
			setPreloadedImages(new Set());
		};
	}, [images]);

	const resetZoom = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
		setIsZoomed(false);
	}, []);

	// Handle zoom reset when navigating
	// biome-ignore lint/correctness/useExhaustiveDependencies: resetZoom is stable
	useEffect(() => {
		resetZoom();
	}, [currentIndex, resetZoom]);

	const handleZoomIn = useCallback(() => {
		setScale((prev) => Math.min(prev + 0.5, 3));
		setIsZoomed(true);
	}, []);

	const handleZoomOut = useCallback(() => {
		if (scale <= 1.5) {
			resetZoom();
		} else {
			setScale((prev) => Math.max(prev - 0.5, 1));
		}
	}, [scale, resetZoom]);

	const handleImageClick = useCallback(() => {
		if (isZoomed) {
			resetZoom();
		} else {
			handleZoomIn();
		}
	}, [isZoomed, handleZoomIn, resetZoom]);

	const handlePan = useCallback(
		(info: PanInfo) => {
			if (isZoomed) {
				setPosition((prev) => ({
					x: prev.x + info.delta.x,
					y: prev.y + info.delta.y,
				}));
			}
		},
		[isZoomed],
	);

	const handlePrevious = useCallback(() => {
		onNavigate(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
	}, [currentIndex, images.length, onNavigate]);

	const handleNext = useCallback(() => {
		onNavigate(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
	}, [currentIndex, images.length, onNavigate]);

	const handleSwipe = useCallback(
		(offset: number, velocity: number) => {
			const threshold = 50;
			const velocityThreshold = 500;

			if (!isZoomed) {
				if (Math.abs(offset) > threshold || Math.abs(velocity) > velocityThreshold) {
					if (offset > 0 || velocity > 0) {
						handlePrevious();
					} else {
						handleNext();
					}
				}
			}
		},
		[isZoomed, handlePrevious, handleNext],
	);

	return (
		<AnimatePresence>
			<motion.div
				ref={lightboxRef}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
				onClick={onClose}
				role="dialog"
				tabIndex={-1}
				aria-modal="true"
				aria-labelledby={`lightbox-title-${currentIndex}`}
				aria-describedby={`lightbox-description-${currentIndex}`}
			>
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
					aria-label="Close lightbox and return to gallery"
					title="Close"
				>
					<X size={24} />
				</button>

				{isZoomed && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							handleZoomOut();
						}}
						className="absolute top-4 right-16 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
						aria-label="Zoom out image"
						title="Zoom out"
					>
						<ZoomOut size={24} />
					</button>
				)}

				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						handlePrevious();
					}}
					className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
					aria-label="View previous image"
					title="Previous image"
				>
					<ChevronLeft size={24} />
				</button>

				<motion.div
					className="relative max-w-[90vw] max-h-[90vh] cursor-pointer"
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.9, opacity: 0 }}
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
					whileTap={{ scale: 0.98 }}
					drag={isZoomed}
					dragMomentum={false}
					dragElastic={0}
					onDrag={(_, info) => handlePan(info)}
					onDragEnd={(_, info) => {
						if (!isZoomed) {
							handleSwipe(info.offset.x, info.velocity.x);
						}
					}}
					onClick={(e) => {
						e.stopPropagation();
						handleImageClick();
					}}
					style={{
						scale,
						x: position.x,
						y: position.y,
						transition: "transform 0.3s ease",
					}}
					role="img"
					aria-label={`Image ${currentIndex + 1} of ${images.length} - ${isZoomed ? "Zoomed in" : "Click to zoom"}`}
				>
					<LightboxImage
						src={images[currentIndex] || ""}
						alt={`Cat image ${currentIndex + 1} of ${images.length}`}
						className="max-w-[90vw] max-h-[90vh] object-contain select-none"
					/>
					{!isZoomed && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
							<div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm opacity-0 hover:opacity-100 transition-opacity">
								Click to zoom
							</div>
						</div>
					)}
				</motion.div>

				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						handleNext();
					}}
					className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
					aria-label="View next image"
					title="Next image"
				>
					<ChevronRight size={24} />
				</button>

				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
					<span id={`lightbox-description-${currentIndex}`} className="font-medium">
						Image {currentIndex + 1} of {images.length}
					</span>
					{isZoomed && (
						<span className="ml-2 text-xs text-white/70">({Math.round(scale * 100)}%)</span>
					)}
				</div>

				<div className="absolute bottom-4 right-4 text-white/60 text-xs bg-black/30 px-2 py-1 rounded">
					<span className="hidden sm:inline">Swipe to navigate • Tap to zoom</span>
					<span className="sm:hidden">Tap to zoom</span>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
