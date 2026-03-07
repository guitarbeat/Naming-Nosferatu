import type React from "react";

export type CardVariant =
	| "default"
	| "elevated"
	| "outlined"
	| "filled"
	| "primary"
	| "success"
	| "warning"
	| "info"
	| "danger"
	| "secondary";

export type CardPadding = "none" | "small" | "medium" | "large" | "xl";
export type CardShadow = "none" | "small" | "medium" | "large" | "xl";
export type CardBackground = "solid" | "glass" | "gradient" | "transparent";

export interface GlassConfig {
	width?: number;
	height?: number;
	radius?: number;
	scale?: number;
	saturation?: number;
	frost?: number;
	inputBlur?: number;
	outputBlur?: number;
	id?: string;
	[key: string]: unknown;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode;
	variant?: CardVariant;
	padding?: CardPadding;
	shadow?: CardShadow;
	border?: boolean;
	background?: CardBackground;
	as?: React.ElementType;
	liquidGlass?: boolean | GlassConfig;
	interactive?: boolean;
	enableTilt?: boolean;
}

export interface CardStatsProps extends CardProps {
	title?: string;
	label?: string;
	value: string | number | React.ReactNode;
	emoji?: React.ReactNode;
	labelClassName?: string;
	valueClassName?: string;
	emojiClassName?: string;
}

export interface NameMetadata {
	rating?: number;
	popularity?: number;
	tournaments?: number;
	categories?: string[];
	wins?: number;
	losses?: number;
	totalMatches?: number;
	winRate?: number;
	rank?: number;
	description?: string;
	[key: string]: unknown;
}

export interface CardNameProps {
	name: string;
	description?: string;
	pronunciation?: string;
	isSelected?: boolean;
	onClick?: () => void;
	disabled?: boolean;
	shortcutHint?: string;
	className?: string;
	size?: "small" | "medium";
	metadata?: NameMetadata;
	isAdmin?: boolean;
	isHidden?: boolean;
	_onToggleVisibility?: (id: string) => void;
	_onDelete?: (name: unknown) => void;
	onSelectionChange?: (selected: boolean) => void;
	image?: string;
	onImageClick?: (e: React.MouseEvent) => void;
}
