/**
 * @module NameGrid
 * @description Responsive Grid of name cards.
 * Optimized for layout stability and performance.
 */

import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { memo, useMemo } from "react";
import type { NameItem } from "@/types/components";
// Removed useMasonryLayout - using CSS Grid masonry instead
import {
	applyNameFilters,
	isNameHidden,
	mapFilterStatusToVisibility,
	selectedNamesToSet,
} from "../../utils/core";
import CardName from "../Card/components/CardName";
import { EmptyState } from "../EmptyState/EmptyState";
import { CatSpinner } from "../Loading";
import styles from "./NameGrid.module.css";

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
		index: number;
	}) => {
		const nameId = nameObj.id as string | number;
		const isHidden = isNameHidden(nameObj);

		// * Deterministic image selection
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
				className={styles.gridItem}
				initial={{
					opacity: 0,
					y: 20,
					scale: 0.9,
				}}
				animate={{
					opacity: 1,
					y: 0,
					scale: isSelected ? 1.05 : 1,
					boxShadow: isSelected
						? "0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 15px rgba(0, 0, 0, 0.1)"
						: "0 2px 8px rgba(0, 0, 0, 0.08)",
				}}
				transition={{
					duration: 0.4,
					delay: Math.min(index * 0.05, 1.5), // Staggered entrance, max 1.5s delay
					type: "spring",
					stiffness: 200,
					damping: 20,
					boxShadow: { duration: 0.3, ease: "easeOut" },
					scale: { duration: 0.3, type: "spring", stiffness: 300, damping: 25 },
				}}
				whileHover={{
					y: -8,
					scale: isSelected ? 1.07 : 1.02,
					boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2), 0 6px 20px rgba(0, 0, 0, 0.15)",
					transition: {
						duration: 0.2,
						type: "spring",
						stiffness: 300,
						damping: 25,
					},
				}}
				whileTap={{
					scale: 0.95,
					transition: { duration: 0.1 },
				}}
				layout={true}
				key={`grid-item-${nameId}-${isSelected ? "selected" : "unselected"}`}
			>
				<CardName
					name={nameObj.name || ""}
					description={nameObj.description}
					isSelected={isSelected}
					onClick={() => onToggleName?.(nameObj)}
					image={cardImage}
					metadata={
						isAdmin
							? {
									rating: nameObj.avg_rating || 1500,
									popularity: nameObj.popularity_score,
								}
							: undefined
					}
					className={isHidden ? styles.hiddenCard : ""}
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
	const selectedSet = useMemo(() => selectedNamesToSet(selectedNames as any), [selectedNames]);

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

	// Simplified to use CSS Grid instead of complex masonry positioning

	if (isLoading) {
		return (
			<div className={`${styles.gridContainer} ${className}`}>
				<div className={styles.namesGrid}>
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={`spinner-${i}`} className={styles.gridItem}>
							<CatSpinner
								variant="cat"
								size="medium"
								catVariant={
									["paw", "tail", "bounce", "spin", "heartbeat", "orbit"][i % 6] as
										| "paw"
										| "tail"
										| "bounce"
										| "spin"
										| "heartbeat"
										| "orbit"
								}
								catColor={["neon", "pastel", "warm"][i % 3] as "neon" | "pastel" | "warm"}
								text="Loading cat names..."
							/>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (processedNames.length === 0) {
		return (
			<div className={`${styles.gridContainer} ${className}`}>
				<EmptyState
					title="No names found"
					description={
						showSelectedOnly
							? "You haven't selected any names yet. Switch back to browse mode to pick some favorites!"
							: "No names match your search or filters. Try adjusting your filters or search terms to find what you're looking for."
					}
					icon={showSelectedOnly ? "🕸️" : "🔍"}
					action={
						showSelectedOnly ? (
							<button
								type="button"
								className={styles.resetButton}
								onClick={() => {
									// This relies on the parent checking 'showSelectedOnly' and providing a reset
									// or we can just guide the user textually
								}}
							>
								{/* Action handled by description hint for now */}
							</button>
						) : undefined
					}
				/>
			</div>
		);
	}

	return (
		<div className={`${styles.gridContainer} ${className}`}>
			<div className={styles.namesGrid} role="list">
				{processedNames.map((name) => {
					const isSelected = selectedSet.has(name.id as string | number);
					return (
						<motion.div
							key={name.id}
							role="listitem"
							className={styles.gridItemWrapper}
							layout={true}
							transition={{
								layout: { duration: 0.3, ease: "easeOut" },
							}}
						>
							<GridItem
								nameObj={name}
								isSelected={isSelected}
								onToggleName={onToggleName}
								isAdmin={isAdmin}
								showCatPictures={showCatPictures}
								imageList={imageList}
								onToggleVisibility={onToggleVisibility}
								onDelete={onDelete}
								index={index}
							/>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}

NameGrid.propTypes = {
	names: PropTypes.array.isRequired,
	selectedNames: PropTypes.oneOfType([PropTypes.array, PropTypes.instanceOf(Set)]),
	onToggleName: PropTypes.func,
	filters: PropTypes.shape({
		searchTerm: PropTypes.string,
		category: PropTypes.string,
		sortBy: PropTypes.string,
		sortOrder: PropTypes.oneOf(["asc", "desc"]),
		filterStatus: PropTypes.oneOf(["visible", "hidden", "all"]),
	}),
	isAdmin: PropTypes.bool,
	showSelectedOnly: PropTypes.bool,
	showCatPictures: PropTypes.bool,
	imageList: PropTypes.array,
	onToggleVisibility: PropTypes.func,
	onDelete: PropTypes.func,
	isLoading: PropTypes.bool,
	className: PropTypes.string,
};
