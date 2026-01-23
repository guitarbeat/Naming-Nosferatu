/**
 * @module ImageGrid
 * @description Masonry-style image grid component reusing useMasonryLayout hook.
 * Provides responsive 2+ column layout on mobile, matching NameGrid patterns.
 */

import { cn, Skeleton } from "@heroui/react";
import { motion } from "framer-motion";
import { ImageIcon, ZoomIn } from "lucide-react";
import { memo, useMemo } from "react";
import { useMasonryLayout } from "@/hooks/useMasonryLayout";

interface ImageGridProps {
	images: string[];
	onImageOpen: (image: string) => void;
	isLoading?: boolean;
	className?: string;
}

interface ImageGridItemProps {
	src: string;
	index: number;
	onClick: () => void;
	style: React.CSSProperties;
	setRef: (el: HTMLDivElement | null) => void;
}

const itemVariants = {
	hidden: { opacity: 0, scale: 0.9 },
	visible: (i: number) => ({
		opacity: 1,
		scale: 1,
		transition: {
			delay: i * 0.03,
			duration: 0.25,
			ease: "easeOut" as const,
		},
	}),
};

const ImageGridItem = memo(function ImageGridItem({
	src,
	index,
	onClick,
	style,
	setRef,
}: ImageGridItemProps) {
	return (
		<motion.div
			ref={setRef}
			className="absolute top-0 left-0" // Masonry layout control
			style={style}
			custom={index}
			variants={itemVariants}
			initial="hidden"
			animate="visible"
			layout={true}
		>
			<button
				type="button"
				className="group relative w-full overflow-hidden rounded-xl bg-white/5 border border-white/10 transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
				onClick={onClick}
				aria-label={`View image ${index + 1}`}
			>
				<div className="relative w-full h-full">
					<img
						src={src}
						alt={`Gallery image ${index + 1}`}
						className="w-full h-auto object-cover block"
						loading="lazy"
						decoding="async"
					/>
					<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
						<ZoomIn className="text-white opacity-0 transform scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 drop-shadow-md" />
					</div>
				</div>
			</button>
		</motion.div>
	);
});

function LoadingSkeleton({
	count = 8,
	columnWidth,
	gap,
}: {
	count?: number;
	columnWidth: number;
	gap: number;
}) {
	// Generate skeleton positions in a simple grid pattern
	const skeletons = useMemo(() => {
		const cols = Math.max(2, Math.floor(300 / (columnWidth + gap)));
		return Array.from({ length: count }, (_, i) => ({
			left: (i % cols) * (columnWidth + gap),
			top: Math.floor(i / cols) * (columnWidth + gap),
			width: columnWidth,
			height: columnWidth,
		}));
	}, [count, columnWidth, gap]);

	return (
		<>
			{skeletons.map((pos, i) => (
				<div
					key={`skeleton-${i}`}
					className="absolute rounded-xl overflow-hidden bg-white/5 border border-white/5"
					style={{
						left: pos.left,
						top: pos.top,
						width: pos.width,
						height: pos.height,
					}}
				>
					<Skeleton className="w-full h-full rounded-xl" />
				</div>
			))}
		</>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-20 text-white/40">
			<ImageIcon className="w-16 h-16 mb-4 opacity-50" />
			<p className="text-lg font-medium">No images yet</p>
		</div>
	);
}

export const ImageGrid = memo(function ImageGrid({
	images,
	onImageOpen,
	isLoading = false,
	className = "",
}: ImageGridProps) {
	// Compact masonry config for gallery: smaller columns, tighter gaps
	const { containerRef, setItemRef, positions, totalHeight, columnWidth } =
		useMasonryLayout<HTMLDivElement>(images.length, {
			minColumnWidth: 140, // Smaller for mobile 2-col grid
			gap: 8, // Tighter gap
		});

	if (!isLoading && images.length === 0) {
		return <EmptyState />;
	}

	return (
		<div className={cn("w-full mb-8", className)}>
			<div
				ref={containerRef}
				className="relative w-full transition-[height] duration-200"
				style={{ height: totalHeight || "auto" }}
			>
				{isLoading && images.length === 0 ? (
					<LoadingSkeleton columnWidth={columnWidth || 140} gap={8} />
				) : (
					images.map((image, index) => {
						const position = positions[index];
						if (!position) {
							return null;
						}

						return (
							<ImageGridItem
								key={image}
								src={image}
								index={index}
								onClick={() => onImageOpen(image)}
								style={{
									left: position.left,
									top: position.top,
									width: columnWidth,
								}}
								setRef={setItemRef(index)}
							/>
						);
					})
				)}
			</div>
		</div>
	);
});
