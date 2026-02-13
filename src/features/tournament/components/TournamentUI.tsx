/**
 * @module TournamentUI
 * @description UI components for tournament display and interaction
 * Includes: CatImage, NameGrid, NameGridItem, SwipeableCards
 */

import { Button, Chip, Progress } from "@heroui/react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMasonryLayout } from "@/hooks/useHooks";
import { Card, CardName } from "@/layout/Card";
import { EmptyState } from "@/layout/EmptyState";
import { Loading } from "@/layout/FeedbackComponents";
import { Lightbox } from "@/layout/Lightbox";
import { getRandomCatImage } from "@/services/tournament";
import type { NameItem } from "@/types/appTypes";
import {
	applyNameFilters,
	cn,
	isNameHidden,
	mapFilterStatusToVisibility,
	playSound,
	selectedNamesToSet,
} from "@/utils/basic";
import { CAT_IMAGES } from "@/utils/constants";
import { Check, ChevronLeft, ChevronRight, Heart, X } from "@/utils/icons";

/* =========================================================================
   CAT IMAGE COMPONENT
   ========================================================================= */

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

export function CatImage({
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
	const [hasError, setHasError] = useState(false);

	const fallbackUrl =
		CAT_IMAGES && CAT_IMAGES.length > 0 ? (CAT_IMAGES[0] as string) : "/assets/images/bby-cat.GIF";

	useEffect(() => {
		setHasError(false);
	}, []);

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

				let totalR = 0,
					totalG = 0,
					totalB = 0;

				for (let y = 0; y < h; y += 1) {
					let sum = 0;
					for (let x = 0; x < w; x += 1) {
						const base = idx(x, y);
						const r = data[base] ?? 0,
							g = data[base + 1] ?? 0,
							b = data[base + 2] ?? 0;
						totalR += r;
						totalG += g;
						totalB += b;

						if (y > 0 && y < h - 1) {
							const i1 = idx(x, y - 1),
								i2 = idx(x, y + 1);
							const g1 = toGray(data[i1] ?? 0, data[i1 + 1] ?? 0, data[i1 + 2] ?? 0);
							const g2 = toGray(data[i2] ?? 0, data[i2 + 1] ?? 0, data[i2 + 2] ?? 0);
							sum += Math.abs(g2 - g1);
						}
					}
					if (y > 0 && y < h - 1) {
						rowEnergy[y] = sum / w;
					}
				}

				const start = Math.floor(h * 0.08),
					end = Math.floor(h * 0.7);
				let bestY = start,
					bestVal = -Infinity;

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
					? `${Math.round(totalR / pixelCount)} ${Math.round(totalG / pixelCount)} ${Math.round(totalB / pixelCount)}`
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

				return { focal: pct, accent, orientation };
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
				const steps = ratio <= 0.85 || ratio >= 1.9 ? "contain" : "cover";
				container.style.setProperty("--cat-image-fit", steps);
				container.style.setProperty("--cat-image-ratio", ratio.toFixed(3));
			}
			container.dataset.loaded = "true";
		},
		[analyseImage],
	);

	const handleLoad = useCallback(
		(event: React.SyntheticEvent<HTMLImageElement, Event>) => {
			const imgEl = event.currentTarget;
			const cb = () => applyImageEnhancements(imgEl);
			if ("requestIdleCallback" in window) {
				window.requestIdleCallback(cb);
			} else {
				setTimeout(cb, 50);
			}
			onLoad?.(event);
		},
		[applyImageEnhancements, onLoad],
	);

	const handleError = useCallback(
		(event: React.SyntheticEvent<HTMLImageElement, Event>) => {
			console.error("Image failed to load:", event.currentTarget.src);
			setHasError(true);
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
		container.style.removeProperty("--cat-image-accent-rgb");

		const imgEl = imageRef.current;
		if (imgEl?.complete) {
			applyImageEnhancements(imgEl);
		}
	}, [applyImageEnhancements]);

	if (!src && !hasError) {
		return null;
	}

	const currentSrc = hasError ? fallbackUrl : src;
	const containerClasses = [containerClassName].filter(Boolean).join(" ");
	const mergedStyle = {
		...containerStyle,
		...(currentSrc ? { "--bg-image": `url(${currentSrc})` } : {}),
	} as React.CSSProperties;

	const renderImage = () => {
		const imageStyle: React.CSSProperties = {
			objectPosition: "center var(--image-pos-y, 50%)",
			objectFit: "var(--cat-image-fit, cover)" as React.CSSProperties["objectFit"],
		};

		const commonProps = {
			ref: imageRef,
			src: currentSrc || fallbackUrl,
			alt: hasError ? "Fallback cat picture" : alt,
			className: imageClassName,
			style: imageStyle,
			loading,
			decoding,
			onLoad: handleLoad,
			onError: handleError,
			crossOrigin: "anonymous" as const,
		};

		if (currentSrc && typeof currentSrc === "string" && currentSrc.startsWith("/assets/images/")) {
			const extension = currentSrc.split(".").pop()?.toLowerCase();
			if (!extension || extension === "gif" || extension === "avif" || extension === "webp") {
				return <img {...commonProps} />;
			}
			const base = currentSrc.replace(/\.[^.]+$/, "");
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

/* =========================================================================
   NAME GRID ITEM COMPONENT
   ========================================================================= */

interface NameGridItemProps {
	nameObj: NameItem;
	isSelected: boolean;
	onToggleName?: (name: NameItem) => void;
	isAdmin: boolean;
	showCatPictures: boolean;
	imageList: string[];
	onToggleVisibility?: (id: string | number) => void;
	onDelete?: (name: NameItem) => void;
	onImageClick: (image: string) => void;
	index: number;
}

export const NameGridItem = memo(function NameGridItem({
	nameObj,
	isSelected,
	onToggleName,
	isAdmin,
	showCatPictures,
	imageList,
	onToggleVisibility,
	onDelete,
	onImageClick,
	index,
}: NameGridItemProps) {
	const nameId = nameObj.id as string | number;
	const isHidden = isNameHidden(nameObj);

	const cardImage = useMemo(() => {
		if (!nameObj || !showCatPictures || !imageList.length) {
			return undefined;
		}
		return getRandomCatImage(nameObj.id, imageList);
	}, [nameObj, showCatPictures, imageList]);

	const handleCardClick = useCallback(() => {
		if (cardImage) {
			onImageClick(cardImage);
		}
	}, [cardImage, onImageClick]);

	return (
		<motion.div
			className="w-full h-full"
			initial={index < 12 ? { opacity: 0, y: 10 } : false}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.25,
				delay: index < 12 ? Math.min(index * 0.02, 0.3) : 0,
			}}
		>
			<CardName
				name={nameObj.name || ""}
				description={nameObj.description}
				isSelected={isSelected}
				onClick={() => onToggleName?.(nameObj)}
				image={cardImage}
				onImageClick={cardImage ? handleCardClick : undefined}
				metadata={
					isAdmin
						? {
								rating: nameObj.avg_rating || 1500,
								popularity: nameObj.popularity_score,
							}
						: undefined
				}
				className={cn(isHidden && "opacity-50 grayscale")}
				isAdmin={isAdmin}
				isHidden={isHidden}
				_onToggleVisibility={isAdmin ? () => onToggleVisibility?.(nameId) : undefined}
				_onDelete={isAdmin ? () => onDelete?.(nameObj) : undefined}
				onSelectionChange={undefined}
				size="medium"
			/>
		</motion.div>
	);
});

/* =========================================================================
   NAME GRID COMPONENT
   ========================================================================= */

interface NameGridProps {
	names: NameItem[];
	selectedNames?: NameItem[] | Set<string | number>;
	onToggleName?: (name: NameItem) => void;
	filters?: {
		category?: string;
		filterStatus?: "visible" | "hidden" | "all";
	};
	isAdmin?: boolean;
	showSelectedOnly?: boolean;
	showCatPictures?: boolean;
	onNamesUpdate?: (updater: NameItem[] | ((prev: NameItem[]) => NameItem[])) => void;
	imageList?: string[];
	onToggleVisibility?: (id: string | number) => void;
	onDelete?: (name: NameItem) => void;
	isLoading?: boolean;
	className?: string;
	onImagesUploaded?: (uploadedPaths: string[]) => void;
}

export function NameGrid({
	names = [],
	selectedNames = [],
	onToggleName,
	filters = {},
	isAdmin = false,
	showSelectedOnly = false,
	showCatPictures = false,
	imageList = [],
	onToggleVisibility,
	onDelete,
	isLoading = false,
	className = "",
	onImagesUploaded,
}: NameGridProps) {
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
	const [suppImages, setSuppImages] = useState<string[]>([]);

	const finalImageList = useMemo(() => {
		const base = Array.isArray(imageList) ? imageList : [];
		return [...suppImages, ...base];
	}, [suppImages, imageList]);

	const handleImageClick = useCallback(
		(imageUrl: string) => {
			const idx = finalImageList.indexOf(imageUrl);
			if (idx !== -1) {
				setLightboxIndex(idx);
			}
		},
		[finalImageList],
	);

	const selectedSet = useMemo(
		() => selectedNamesToSet(selectedNames as NameItem[] | Set<string | number>),
		[selectedNames],
	);

	const processedNames = useMemo(() => {
		const visibility = mapFilterStatusToVisibility(filters.filterStatus || "visible");

		let result = applyNameFilters(names, {
			visibility,
			isAdmin,
		});

		if (showSelectedOnly && selectedSet.size > 0) {
			result = result.filter((name) => {
				const nameId = name.id as string | number;
				return selectedSet.has(nameId);
			});
		}

		return result;
	}, [names, filters.filterStatus, isAdmin, showSelectedOnly, selectedSet]);

	const { containerRef, setItemRef, positions, totalHeight, columnWidth } =
		useMasonryLayout<HTMLDivElement>(processedNames.length, {
			minColumnWidth: 280,
			gap: 16,
		});

	const _handleImagesUploaded = useCallback(
		(uploaded: string[]) => {
			setSuppImages((prev) => [...uploaded, ...prev]);
			onImagesUploaded?.(uploaded);
		},
		[onImagesUploaded],
	);

	if (isLoading) {
		return (
			<div className={cn("relative w-full mx-auto p-4 md:p-6 min-h-[50vh]", className)}>
				<div className="relative w-full max-w-[95%] mx-auto grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={`skeleton-${i}`} className="w-full h-40">
							<Loading variant="card-skeleton" cardSkeletonVariant="mosaic-card" size="medium" />
						</div>
					))}
					<div className="col-span-full flex justify-center py-8">
						<Loading
							variant="cat"
							catVariant="paw"
							catColor="neon"
							text="Loading cat names..."
							size="small"
						/>
					</div>
				</div>
			</div>
		);
	}

	if (processedNames.length === 0) {
		return (
			<div className={cn("relative w-full mx-auto p-4 md:p-6 min-h-[50vh]", className)}>
				<EmptyState
					title="No names found"
					description={
						showSelectedOnly
							? "You haven't selected any names yet. Switch back to browse mode to pick some favorites!"
							: "No names match your search or filters. Try adjusting your filters or search terms to find what you're looking for."
					}
					icon={showSelectedOnly ? "🕸️" : "🔍"}
				/>
			</div>
		);
	}

	return (
		<div className={cn("relative w-full mx-auto p-4 md:p-6", className)}>
			<div
				className="relative w-full max-w-[95%] mx-auto transition-height duration-300"
				role="list"
				ref={containerRef}
				style={{ height: totalHeight || "auto", position: "relative" }}
			>
				{processedNames.map((name, index) => {
					const isSelected = selectedSet.has(name.id as string | number);
					const position = positions[index];

					return (
						<div
							key={name.id}
							className="absolute top-0 left-0"
							ref={setItemRef(index)}
							style={{
								position: "absolute",
								top: position?.top || 0,
								left: position?.left || 0,
								width: columnWidth || 280,
								transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
							}}
						>
							<NameGridItem
								nameObj={name}
								isSelected={isSelected}
								onToggleName={onToggleName}
								isAdmin={isAdmin}
								showCatPictures={showCatPictures}
								imageList={finalImageList}
								onToggleVisibility={onToggleVisibility}
								onDelete={onDelete}
								onImageClick={handleImageClick}
								index={index}
							/>
						</div>
					);
				})}
			</div>

			{lightboxIndex !== null && (
				<Lightbox
					images={finalImageList}
					currentIndex={lightboxIndex}
					onClose={() => setLightboxIndex(null)}
					onNavigate={setLightboxIndex}
				/>
			)}
		</div>
	);
}

/* =========================================================================
   SWIPEABLE CARDS COMPONENT
   ========================================================================= */

export const SwipeableCards = memo(
	({
		names,
		selectedNames,
		onToggleName,
		showCatPictures,
		imageList = [],
		onStartTournament,
	}: {
		names: NameItem[];
		selectedNames: NameItem[];
		onToggleName: (name: NameItem) => void;
		showCatPictures: boolean;
		imageList?: string[];
		onStartTournament: (names: NameItem[]) => void;
	}) => {
		const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
		const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);
		const [dragOffset, setDragOffset] = useState(0);

		const visibleCards = useMemo(
			() => names.filter((n: NameItem) => !swipedIds.has(String(n.id))),
			[names, swipedIds],
		);
		const cardsToRender = visibleCards.slice(0, 3);
		const currentCard = cardsToRender[0];
		const isSelected = useCallback(
			(n: NameItem) => selectedNames.some((s: NameItem) => s.id === n.id),
			[selectedNames],
		);

		const handleDragEnd = useCallback(
			(card: NameItem, info: PanInfo) => {
				const offset = info.offset.x;
				const velocity = info.velocity.x;
				const threshold = 100;
				const velocityThreshold = 500;

				if (Math.abs(offset) < threshold && Math.abs(velocity) < velocityThreshold) {
					setDragOffset(0);
					return;
				}

				if (offset > threshold || velocity > velocityThreshold) {
					setDragDirection("right");
					playSound("gameboy-pluck");
					if (!isSelected(card)) {
						onToggleName(card);
					}
				} else {
					setDragDirection("left");
					playSound("wow");
					if (isSelected(card)) {
						onToggleName(card);
					}
				}
				setSwipedIds((prev) => new Set([...prev, String(card.id)]));
				setTimeout(() => {
					setDragDirection(null);
					setDragOffset(0);
				}, 300);
			},
			[isSelected, onToggleName],
		);

		const progressValue = (swipedIds.size / names.length) * 100;

		return (
			<div className="flex flex-col gap-6 w-full">
				<Card padding="small" variant="default">
					<div className="gap-3 flex flex-col">
						<div className="flex justify-between items-center">
							<span className="text-sm font-bold text-default-500 uppercase tracking-wider">
								Progress
							</span>
							<Chip size="sm" variant="flat" color="primary" className="font-bold">
								{swipedIds.size} / {names.length}
							</Chip>
						</div>
						<Progress
							value={progressValue}
							color="primary"
							className="h-2"
							classNames={{
								indicator: "bg-gradient-to-r from-primary to-secondary",
							}}
						/>
					</div>
				</Card>

				<div className="relative w-full" style={{ minHeight: "500px" }}>
					<AnimatePresence mode="popLayout">
						{visibleCards.length > 0 ? (
							cardsToRender.map((card: NameItem, index: number) => (
								<motion.div
									key={card.id}
									layout={true}
									layoutId={String(card.id)}
									className="absolute inset-0 flex items-center justify-center"
									style={{ zIndex: 10 - index }}
									exit={{
										opacity: 0,
										x: dragDirection === "right" ? 400 : -400,
										rotate: dragDirection === "right" ? 20 : -20,
										transition: { duration: 0.3 },
									}}
								>
									<motion.div
										drag={index === 0 ? "x" : false}
										dragConstraints={{ left: -200, right: 200 }}
										onDrag={(_, info) => {
											if (index === 0) {
												setDragOffset(info.offset.x);
											}
										}}
										onDragEnd={(_, info) => {
											if (index === 0) {
												handleDragEnd(card, info);
											}
										}}
										animate={{
											y: index * 12,
											scale: 1 - index * 0.04,
											opacity: 1 - index * 0.2,
											rotate: index === 0 ? dragOffset / 20 : 0,
										}}
										transition={{ type: "spring", stiffness: 300, damping: 30 }}
										className="w-full max-w-md"
									>
										<Card
											className={cn(
												"relative flex flex-col items-center justify-between overflow-hidden group transition-all duration-200 h-full",
												isSelected(card) ? "shadow-[0_0_30px_rgba(34,197,94,0.3)]" : "",
												index === 0 &&
													"cursor-grab active:cursor-grabbing shadow-2xl active:scale-95",
												index > 0 && "pointer-events-none",
											)}
											variant="default"
											padding="medium"
										>
											{index === 0 && (
												<>
													<motion.div
														className="absolute left-8 top-1/2 -translate-y-1/2 z-10"
														initial={{ opacity: 0, scale: 0.8 }}
														animate={{
															opacity: dragOffset < -50 ? 1 : 0,
															scale: dragOffset < -50 ? 1 : 0.8,
														}}
													>
														<div className="flex items-center gap-2 px-6 py-3 bg-danger/90 backdrop-blur-md rounded-full border-2 border-danger shadow-lg rotate-[-20deg]">
															<X size={24} className="text-white" />
															<span className="text-white font-black text-lg uppercase">Nope</span>
														</div>
													</motion.div>

													<motion.div
														className="absolute right-8 top-1/2 -translate-y-1/2 z-10"
														initial={{ opacity: 0, scale: 0.8 }}
														animate={{
															opacity: dragOffset > 50 ? 1 : 0,
															scale: dragOffset > 50 ? 1 : 0.8,
														}}
													>
														<div className="flex items-center gap-2 px-6 py-3 bg-success/90 backdrop-blur-md rounded-full border-2 border-success shadow-lg rotate-[20deg]">
															<Heart size={24} className="text-white fill-white" />
															<span className="text-white font-black text-lg uppercase">Like</span>
														</div>
													</motion.div>
												</>
											)}

											<div className="w-full aspect-square rounded-xl overflow-hidden border-0 mb-4 bg-white/10 backdrop-blur-md flex items-center justify-center">
												{showCatPictures && card.id && imageList.length > 0 ? (
													<div
														className="w-full h-full bg-cover bg-center opacity-80 group-hover:scale-110 transition-transform duration-700"
														style={{
															backgroundImage: `url('${getRandomCatImage(card.id, imageList)}')`,
														}}
													/>
												) : (
													<span className="text-white/20 text-6xl font-bold select-none">
														{card.name[0]?.toUpperCase() || "?"}
													</span>
												)}
											</div>

											<div className="text-center pb-4 z-10 w-full">
												<h3 className="font-whimsical text-2xl lg:text-3xl text-white tracking-wide drop-shadow-lg break-words w-full">
													{card.name}
												</h3>
												{card.description && (
													<p className="text-white/60 text-sm leading-relaxed max-w-md mt-2 mx-auto">
														{card.description}
													</p>
												)}
												{isSelected(card) && (
													<div className="flex justify-center mt-3">
														<div className="px-3 py-1 bg-success/20 backdrop-blur-md border border-success/30 rounded-full flex items-center gap-2">
															<Check size={14} className="text-success" />
															<span className="text-success font-bold text-xs tracking-widest uppercase">
																Selected
															</span>
														</div>
													</div>
												)}
											</div>
										</Card>
									</motion.div>
								</motion.div>
							))
						) : (
							<motion.div
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								className="flex flex-col items-center justify-center gap-6 p-12"
							>
								<Card variant="default" className="flex flex-col items-center text-center gap-6">
									<div className="text-6xl">🎉</div>
									<h2 className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
										All Clear!
									</h2>
									<p className="text-white/60 max-w-md">
										You've reviewed all {names.length} names. Ready to start the tournament?
									</p>
									{selectedNames.length >= 2 && (
										<Button
											size="lg"
											color="primary"
											variant="shadow"
											onClick={() => onStartTournament(selectedNames)}
											className="font-bold text-lg px-8 shadow-primary/40"
										>
											Start Tournament ({selectedNames.length} names)
										</Button>
									)}
								</Card>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{visibleCards.length > 0 && (
					<div className="flex gap-4 justify-center items-center">
						<Button
							isIconOnly={true}
							size="lg"
							variant="flat"
							className="w-16 h-16 bg-danger/10 hover:bg-danger/20 border-2 border-danger/30 text-danger"
							aria-label={currentCard ? `Discard ${currentCard.name}` : "Discard"}
							onClick={() => {
								if (currentCard) {
									setDragDirection("left");
									playSound("wow");
									setSwipedIds((prev) => new Set([...prev, String(currentCard.id)]));
									setTimeout(() => setDragDirection(null), 300);
								}
							}}
						>
							<X size={28} />
						</Button>

						<Button
							size="lg"
							color="primary"
							variant="shadow"
							onClick={() => onStartTournament(selectedNames)}
							disabled={selectedNames.length < 2}
							className="font-bold px-8 shadow-primary/40"
						>
							Start Tournament ({selectedNames.length})
						</Button>

						<Button
							isIconOnly={true}
							size="lg"
							variant="flat"
							className="w-16 h-16 bg-success/10 hover:bg-success/20 border-2 border-success/30 text-success"
							aria-label={currentCard ? `Keep ${currentCard.name}` : "Keep"}
							onClick={() => {
								if (currentCard) {
									setDragDirection("right");
									playSound("gameboy-pluck");
									if (!isSelected(currentCard)) {
										onToggleName(currentCard);
									}
									setSwipedIds((prev) => new Set([...prev, String(currentCard.id)]));
									setTimeout(() => setDragDirection(null), 300);
								}
							}}
						>
							<Heart size={28} className="fill-success" />
						</Button>
					</div>
				)}

				{visibleCards.length > 0 && swipedIds.size === 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
						className="flex items-center justify-center gap-3 text-default-400 text-sm"
					>
						<ChevronLeft size={16} className="animate-pulse" />
						<span className="font-medium">Swipe or tap buttons to review names</span>
						<ChevronRight size={16} className="animate-pulse" />
					</motion.div>
				)}
			</div>
		);
	},
);
SwipeableCards.displayName = "SwipeableCards";
