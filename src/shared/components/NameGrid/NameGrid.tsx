/**
 * @module NameGrid
 * @description Responsive Grid of name cards.
 * Optimized for layout stability and performance.
 */

import PropTypes from "prop-types";
import { memo, useMemo } from "react";
import { useMasonryLayout } from "../../hooks/useMasonryLayout";
import type { NameItem } from "../../propTypes";
import {
	applyNameFilters,
	isNameHidden,
	mapFilterStatusToVisibility,
	selectedNamesToSet,
} from "../../utils/core";
import CardName from "../Card/components/CardName";
import EmptyState from "../EmptyState/EmptyState";
import SkeletonLoader from "../Loading/SkeletonLoader";
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
const GridItem = memo(({
	nameObj,
	isSelected,
	onToggleName,
	isAdmin,
	showCatPictures,
	imageList,
	onToggleVisibility,
	onDelete,
}: {
	nameObj: NameItem;
	isSelected: boolean;
	onToggleName?: (name: NameItem) => void;
	isAdmin: boolean;
	showCatPictures: boolean;
	imageList: string[];
	onToggleVisibility?: (id: string | number) => void;
	onDelete?: (name: NameItem) => void;
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
		<div className={styles.gridItem}>
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
		</div>
	);
});

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

	const { containerRef, setItemRef, positions, columnHeights } = useMasonryLayout<HTMLDivElement>(
		processedNames.length,
		{
			minColumnWidth: 280,
			gap: 24,
		},
	);

	if (isLoading) {
		return (
			<div className={`${styles.gridContainer} ${className}`}>
				<div className={styles.namesGrid}>
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={`skeleton-${i}`} className={styles.gridItem}>
							<SkeletonLoader variant="card" height={260} />
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
			<div
				ref={containerRef}
				className={styles.namesGrid}
				role="list"
				style={{
					minHeight: columnHeights.length > 0 ? `${Math.max(...columnHeights)}px` : "auto",
				}}
			>
				{processedNames.map((name, index) => {
					const position = positions[index];
					const isSelected = selectedSet.has(name.id as string | number);
					return (
						<div
							key={name.id}
							ref={setItemRef(index)}
							role="listitem"
							className={styles.gridItemWrapper}
							style={
								position
									? {
											position: "absolute",
											top: `${position.top}px`,
											left: `${position.left}px`,
										}
									: { position: "relative" }
							}
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
							/>
						</div>
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
