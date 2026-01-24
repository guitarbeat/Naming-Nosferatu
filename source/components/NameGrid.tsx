/**
 * @module NameGrid
 * @description Responsive Grid of name cards using CSS Grid.
 * Simplified from masonry layout for stability and performance.
 */

import { imagesAPI } from "@supabase/client";
import {
	applyNameFilters,
	isNameHidden,
	mapFilterStatusToVisibility,
	selectedNamesToSet,
} from "@utils";
import { cn } from "@utils/cn";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useMasonryLayout } from "@/hooks/useMasonryLayout";
import type { NameItem } from "@/types/components";
import { compressImageFile, devError } from "@/utils";
import { Lightbox } from "../shared/components/Lightbox";
import { Loading } from "../shared/components/Loading";
import { CardName } from "./Card";
import { EmptyState } from "./EmptyState";

interface NameGridProps {
	names: NameItem[];
	selectedNames?: NameItem[] | Set<string | number>;
	onToggleName?: (name: NameItem) => void;
	filters?: {
		searchTerm?: string;
		category?: string;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
		filterStatus?: "visible" | "hidden" | "all";
	};
	isAdmin?: boolean;
	showSelectedOnly?: boolean;
	showCatPictures?: boolean;
	imageList?: string[];
	onToggleVisibility?: (id: string | number) => void;
	onDelete?: (name: NameItem) => void;
	isLoading?: boolean;
	className?: string;
}

/**
 * Individual Card wrapper with grid-specific styling
 */
const GridItem = memo(
	({
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
	}: {
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
	}) => {
		const nameId = nameObj.id as string | number;
		const isHidden = isNameHidden(nameObj);

		// Deterministic image selection
		const cardImage = useMemo(() => {
			if (!nameObj || !showCatPictures || !imageList.length) {
				return undefined;
			}
			const idStr = String(nameObj.id);
			const hash = idStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
			return imageList[Math.abs(hash) % imageList.length];
		}, [nameObj, showCatPictures, imageList]);

		return (
			<motion.div
				className="w-full h-full"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{
					duration: 0.3,
					delay: Math.min(index * 0.03, 0.5),
				}}
			>
				<CardName
					name={nameObj.name || ""}
					description={nameObj.description}
					isSelected={isSelected}
					onClick={() => onToggleName?.(nameObj)}
					image={cardImage}
					onImageClick={cardImage ? () => onImageClick(cardImage) : undefined}
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
	},
);

GridItem.displayName = "GridItem";

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
}: NameGridProps) {
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
	const [suppImages, setSuppImages] = useState<string[]>([]);

	// Merge provided imageList with any newly uploaded images
	const finalImageList = useMemo(() => [...suppImages, ...imageList], [suppImages, imageList]);

	const { containerRef, setItemRef, positions, totalHeight, columnWidth } =
		useMasonryLayout<HTMLDivElement>(names.length, {
			minColumnWidth: 280,
			gap: 16,
		});

	const selectedSet = useMemo(
		() => selectedNamesToSet(selectedNames as NameItem[] | Set<string | number>),
		[selectedNames],
	);

	const processedNames = useMemo(() => {
		const visibility = mapFilterStatusToVisibility(filters.filterStatus || "visible");

		let result = applyNameFilters(names, {
			searchTerm: filters.searchTerm,
			category: filters.category,
			sortBy: filters.sortBy,
			sortOrder: filters.sortOrder || "desc",
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
	}, [names, filters, isAdmin, showSelectedOnly, selectedSet]);

	if (isLoading) {
		return (
			<div className={cn("relative w-full mx-auto p-4 md:p-6 min-h-[50vh]", className)}>
				<div className="relative w-full max-w-[1600px] mx-auto grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={`skeleton-${i}`} className="w-full h-40">
							<Loading variant="card-skeleton" cardSkeletonVariant="mosaic-card" size="medium" />
						</div>
					))}
					{/* Loading text below the grid */}
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
				className="relative w-full max-w-[1600px] mx-auto transition-height duration-300"
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
							<GridItem
								nameObj={name}
								isSelected={isSelected}
								onToggleName={onToggleName}
								isAdmin={isAdmin}
								showCatPictures={showCatPictures}
								imageList={finalImageList}
								onToggleVisibility={onToggleVisibility}
								onDelete={onDelete}
								onImageClick={(image) => {
									const idx = finalImageList.indexOf(image);
									if (idx !== -1) {
										setLightboxIndex(idx);
									}
								}}
								index={index}
							/>
						</div>
					);
				})}
			</div>

			{/* Admin Image Upload */}
			{isAdmin && (
				<div className="flex justify-center mt-12 mb-8">
					<label className="cursor-pointer flex items-center gap-3 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-all font-bold tracking-wider uppercase text-sm border border-purple-500/20 active:scale-95 shadow-xl shadow-purple-900/30">
						<input
							type="file"
							accept="image/*"
							multiple={true}
							onChange={async (e) => {
								const files = Array.from(e.target.files || []);
								if (!files.length) {
									return;
								}
								try {
									const uploaded: string[] = [];
									await Promise.all(
										files.map(async (f) => {
											const compressed = await compressImageFile(f, {
												maxWidth: 1600,
												maxHeight: 1600,
												quality: 0.8,
											});
											const result = await imagesAPI.upload(compressed, "admin");
											if (result?.path) {
												uploaded.push(result.path);
											}
										}),
									);
									if (uploaded.length > 0) {
										setSuppImages((prev) => [...uploaded, ...prev]);
									}
								} catch (err) {
									devError("Upload error", err);
								}
							}}
							style={{ display: "none" }}
						/>
						<Upload size={20} />
						<span>Upload New Cat Photos</span>
					</label>
				</div>
			)}

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
