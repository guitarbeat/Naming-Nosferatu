import React from "react";
import { Select } from "@/layout/FormPrimitives";
import LiquidGlass from "@/layout/LiquidGlass";

export const TOOLBAR_GLASS_CONFIGS = {
	tournament: {
		width: 650,
		height: 80,
		radius: 20,
		scale: -180,
		saturation: 1.2,
		frost: 0.08,
		inputBlur: 12,
		outputBlur: 0.8,
	},
	filter: {
		width: 1200,
		height: 100,
		radius: 24,
		scale: -180,
		saturation: 1.2,
		frost: 0.08,
		inputBlur: 12,
		outputBlur: 0.8,
	},
};

export const styles = {
	unifiedContainer: "tournament-toolbar-unified-container",
	filtersContainer: "tournament-toolbar-filters-container",
	startButton: "tournament-toolbar-start-button",
	startButtonWrapper: "tournament-toolbar-start-button-wrapper",
	startButtonHint: "tournament-toolbar-start-button-hint",
	resultsCount: "tournament-toolbar-results-count",
	count: "tournament-toolbar-count",
	separator: "tournament-toolbar-separator",
	total: "tournament-toolbar-total",
	badge: "tournament-toolbar-badge",
	badgeTotal: "tournament-toolbar-badge-total",
	filtersGrid: "tournament-toolbar-filters-grid",
	filterRow: "tournament-toolbar-filter-row",
	filterGroup: "tournament-toolbar-filter-group",
	sortGroup: "tournament-toolbar-sort-group",
	filterLabel: "tournament-toolbar-filter-label",
	filterSelect: "tournament-toolbar-filter-select",
	sortControls: "tournament-toolbar-sort-controls",
	sortOrderButton: "tournament-toolbar-sort-order-button",
	sortIcon: "tournament-toolbar-sort-icon",
	// Consolidated Toggle Styles
	toolbarToggle: "toolbar-toggle",
	toolbarToggleActive: "toolbar-toggle--active",
	toolbarToggleAccent: "toolbar-toggle--accent",
	toolbarDivider: "toolbar-divider",
	searchInput: "tournament-toolbar-search-input",
};

interface SortOrderIconProps {
	direction?: "asc" | "desc";
	className?: string;
}

export function SortOrderIcon({ direction = "asc", className = "" }: SortOrderIconProps) {
	return (
		<svg
			className={className}
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			{direction === "asc" ? (
				<path
					d="M8 4L4 8H7V12H9V8H12L8 4Z"
					fill="currentColor"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			) : (
				<path
					d="M8 12L12 8H9V4H7V8H4L8 12Z"
					fill="currentColor"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			)}
		</svg>
	);
}

export interface SelectOption {
	value: string;
	label: string;
}

interface FilterSelectProps {
	id: string;
	label: string;
	value: string | null;
	options: SelectOption[];
	onChange: (value: string | null) => void;
}

export function FilterSelect({ id, label, value, options, onChange }: FilterSelectProps) {
	return (
		<div className={styles.filterGroup}>
			<label htmlFor={id} className={styles.filterLabel}>
				{label}
			</label>
			<Select
				name={id}
				value={value || ""}
				onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value || null)}
				options={options}
				className={styles.filterSelect}
			/>
		</div>
	);
}

interface ToolbarGlassProps {
	mode: "tournament" | "filter";
	id: string;
	className?: string;
	style?: React.CSSProperties;
	children: React.ReactNode;
}

export function ToolbarGlass({ mode, id, className, style, children }: ToolbarGlassProps) {
	const config =
		TOOLBAR_GLASS_CONFIGS[mode as keyof typeof TOOLBAR_GLASS_CONFIGS] ||
		TOOLBAR_GLASS_CONFIGS.filter;

	return (
		<LiquidGlass
			id={id}
			width={config.width}
			height={config.height}
			radius={config.radius}
			scale={config.scale}
			saturation={config.saturation}
			frost={config.frost}
			inputBlur={config.inputBlur}
			outputBlur={config.outputBlur}
			className={className}
			style={{ width: "100%", height: "auto", ...style }}
		>
			{children}
		</LiquidGlass>
	);
}
