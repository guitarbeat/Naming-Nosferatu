/**
 * @module Card
 * @description Reusable card component with flexible styling options and specialized sub-components
 */

import React, { memo, useEffect, useId, useState } from "react";
import { TIMING } from "../../../core/constants";
import { cn } from "../../utils";
import CatImage from "../CatImage";
import LiquidGlass, { DEFAULT_GLASS_CONFIG, resolveGlassConfig } from "../LiquidGlass/LiquidGlass";

import styles from "./Card.module.css";

// Force refresh

type CardVariant =
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

type CardPadding = "none" | "small" | "medium" | "large" | "xl";
type CardShadow = "none" | "small" | "medium" | "large" | "xl";
type CardBackground = "solid" | "glass" | "gradient" | "transparent";

interface GlassConfig {
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

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	variant?: CardVariant;
	padding?: CardPadding;
	shadow?: CardShadow;
	border?: boolean;
	background?: CardBackground;
	as?: React.ElementType;
	liquidGlass?: boolean | GlassConfig;
	interactive?: boolean;
}

const buildCardClasses = (
	variant: CardVariant,
	padding: CardPadding,
	shadow: CardShadow,
	border: boolean,
	background: CardBackground,
	liquidGlass: boolean | GlassConfig | undefined,
	className: string,
) => {
	return [
		styles.card,
		styles[variant],
		styles[`padding-${padding}`],
		styles[`shadow-${shadow}`],
		border ? styles.bordered : "",
		background !== "solid" && background !== "glass" && !liquidGlass
			? styles[`background-${background}`]
			: "",
		// Add color variant support
		styles[variant], // This will pick up primary, success, etc. if defined
		className,
	]
		.filter(Boolean)
		.join(" ");
};

const buildContentClasses = (
	variant: CardVariant,
	padding: CardPadding,
	shadow: CardShadow,
	border: boolean,
) => {
	return [
		styles.card,
		styles[variant],
		styles[`padding-${padding}`],
		styles[`shadow-${shadow}`],
		border ? styles.bordered : "",
	]
		.filter(Boolean)
		.join(" ");
};

export const Card = memo(
	React.forwardRef<HTMLDivElement, CardProps>(
		(
			{
				children,
				className = "",
				variant = "default",
				padding = "medium",
				shadow = "medium",
				border = false,
				background = "solid",
				as: Component = "div",
				liquidGlass,
				interactive = false,
				onClick,
				...props
			},
			ref,
		) => {
			const cardClasses = buildCardClasses(
				variant,
				padding,
				shadow,
				border,
				background,
				liquidGlass,
				className,
			);

			const finalClasses = cn(
				cardClasses,
				interactive && styles.interactive,
				onClick && styles.interactive,
			);

			// * If liquidGlass is enabled OR background is "glass", wrap content in LiquidGlass
			const shouldUseLiquidGlass = liquidGlass || background === "glass";
			// * Generate unique ID for this LiquidGlass instance
			const glassId = useId();

			if (shouldUseLiquidGlass) {
				const glassConfig = resolveGlassConfig(liquidGlass, DEFAULT_GLASS_CONFIG) as GlassConfig;
				const {
					width = 240,
					height = 110,
					radius = 42,
					scale = -110,
					saturation = 1.08,
					frost = 0.12,
					inputBlur = 14,
					outputBlur = 0.9,
					id,
					...glassProps
				} = glassConfig;

				// * Separate wrapper classes (for LiquidGlass) from content classes
				const wrapperClasses = [className].filter(Boolean).join(" ");
				const contentClasses = buildContentClasses(variant, padding, shadow, border);

				return (
					<LiquidGlass
						id={id || `card-glass-${glassId.replace(/:/g, "-")}`}
						width={width}
						height={height}
						radius={radius}
						scale={scale}
						saturation={saturation}
						frost={frost}
						inputBlur={inputBlur}
						outputBlur={outputBlur}
						className={wrapperClasses}
						style={{ width: "100%", height: "auto", ...props.style }}
						{...glassProps}
					>
						<Component ref={ref} className={contentClasses} onClick={onClick} {...props}>
							{children}
						</Component>
					</LiquidGlass>
				);
			}

			return (
				<Component ref={ref} className={finalClasses} onClick={onClick} {...props}>
					{children}
				</Component>
			);
		},
	),
);

Card.displayName = "Card";

interface CardStatsProps extends CardProps {
	title?: string;
	label?: string;
	value: string | number | React.ReactNode;
	emoji?: React.ReactNode;
	labelClassName?: string;
	valueClassName?: string;
	emojiClassName?: string;
}

/**
 * Stats sub-component for displaying statistics
 */
const CardStats: React.FC<CardStatsProps> = ({
	title,
	label,
	value,
	emoji,
	className = "",
	labelClassName = "",
	valueClassName = "",
	emojiClassName = "",
	...props
}) => {
	const labelText = title || label || "Statistic";
	const valueText = typeof value === "string" || typeof value === "number" ? value : "";
	const ariaLabel = valueText ? `${labelText}: ${valueText}` : labelText;

	return (
		<Card
			className={cn(styles.statsCard, className)}
			role="status"
			aria-label={ariaLabel}
			{...props}
		>
			{title ? (
				<h3 className={cn(styles.statsLabel, labelClassName)}>{title}</h3>
			) : (
				<span className={cn(styles.statsLabel, labelClassName)}>{label}</span>
			)}
			<span className={cn(styles.statsValue, valueClassName)}>{value}</span>
			{emoji && <span className={cn(styles.statsEmoji, emojiClassName)}>{emoji}</span>}
		</Card>
	);
};


/* ========================================= */
/*              CardName Component             */
/* ========================================= */

interface NameMetadata {
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
}

const CardNameBase = memo(function CardName({
	name,
	description,
	isSelected,
	onClick,
	disabled = false,
	shortcutHint,
	className = "",
	size = "medium",
	metadata,
	isAdmin = false,
	isHidden = false,
	onSelectionChange,
	image,
}: CardNameProps) {
	const [rippleStyle, setRippleStyle] = useState({});
	const [isRippling, setIsRippling] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);
	const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
	const cardRef = React.useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isRippling) {
			const timer = setTimeout(() => setIsRippling(false), TIMING.RIPPLE_ANIMATION_DURATION_MS);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [isRippling]);

	const hasMetadata =
		metadata &&
		(metadata.rating ||
			metadata.wins !== undefined ||
			metadata.losses !== undefined ||
			metadata.popularity ||
			metadata.tournaments ||
			(metadata.categories && metadata.categories.length > 0));

	useEffect(() => {
		const card = cardRef.current;
		if (!card || disabled || !hasMetadata) {
			return undefined;
		}

		const handleMouseMove = (e: MouseEvent) => {
			if (typeof e.clientX === "number" && typeof e.clientY === "number") {
				setTooltipPosition({ x: e.clientX, y: e.clientY });
				setShowTooltip(true);
			}
		};

		const handleMouseLeave = () => {
			setShowTooltip(false);
		};

		card.addEventListener("mousemove", handleMouseMove);
		card.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			card.removeEventListener("mousemove", handleMouseMove);
			card.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [disabled, hasMetadata]);

	const handleFocus = () => {
		if (!cardRef.current || disabled || !hasMetadata) {
			return;
		}

		const rect = cardRef.current.getBoundingClientRect();
		setTooltipPosition({
			x: rect.right > 0 ? rect.right - 20 : 100,
			y: rect.top > 0 ? rect.top + 20 : 100,
		});
		setShowTooltip(true);
	};

	const handleBlur = () => {
		setShowTooltip(false);
	};

	const handleInteraction = (event: React.MouseEvent | React.KeyboardEvent) => {
		if (disabled) {
			return;
		}

		if (
			event.type === "click" ||
			(event.type === "keydown" &&
				((event as React.KeyboardEvent).key === "Enter" ||
					(event as React.KeyboardEvent).key === " "))
		) {
			event.preventDefault();

			const rect = event.currentTarget.getBoundingClientRect();
			const { clientX, clientY } = event as React.MouseEvent;

			const x = clientX ? clientX - rect.left : rect.width / 2;
			const y = clientY ? clientY - rect.top : rect.height / 2;

			setRippleStyle({
				left: `${x}px`,
				top: `${y}px`,
			});

			setIsRippling(true);

			if (isAdmin && onSelectionChange) {
				onSelectionChange(!isSelected);
			}

			onClick?.();
		}
	};

	const getAriaLabel = () => {
		let label = name;
		if (description) {
			label += ` - ${description}`;
		}
		if (isSelected) {
			label += " - selected";
		}
		if (disabled) {
			label += " - disabled";
		}
		if (isHidden) {
			label += " - hidden";
		}
		return label;
	};

	const getSafeId = (text: string) => {
		return text.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
	};

	// Use updated class names from Card.module.css (formerly CardName.module.css)
	const cardClasses = [
		styles.nameCard,
		styles[size === "small" ? "nameCardSmall" : "medium"], // Map small to nameCardSmall
		isSelected && styles.nameCardSelected,
		disabled && styles.nameCardDisabled,
		isHidden && styles.nameCardHidden,
		image && styles.hasImage,
		className,
	]
		.filter(Boolean)
		.join(" ");

	const isInteractive = !disabled && (!!onClick || (isAdmin && !!onSelectionChange));
	const Component = isInteractive ? "button" : "div";

	return (
		<div className={styles.nameCardContainer}>
			<Card
				as={Component}
				ref={cardRef}
				className={`${cardClasses} ${isInteractive ? "" : styles.nonInteractive}`}
				onClick={
					isInteractive ? (handleInteraction as unknown as React.MouseEventHandler) : undefined
				}
				onKeyDown={
					isInteractive ? (handleInteraction as unknown as React.KeyboardEventHandler) : undefined
				}
				onFocus={handleFocus}
				onBlur={handleBlur}
				// @ts-expect-error - Card props might not fully match HTML attributes
				disabled={isInteractive ? disabled : undefined}
				aria-pressed={isInteractive ? isSelected : undefined}
				aria-label={getAriaLabel()}
				aria-describedby={description ? `${getSafeId(name)}-description` : undefined}
				aria-labelledby={`${getSafeId(name)}-title`}
				type={isInteractive ? "button" : undefined}
				role={isInteractive ? undefined : "article"}
				variant={isSelected ? "primary" : "default"}
				padding={size === "small" ? "small" : "medium"}
				interactive={isInteractive}
			>
				{image && (
					<CatImage
						src={image}
						containerClassName={styles.nameCardImageContainer}
						imageClassName={styles.nameCardImage}
					/>
				)}

				<h3 className={styles.name} id={`${getSafeId(name)}-title`}>
					{name}
				</h3>
				{description && (
					<p id={`${getSafeId(name)}-description`} className={styles.description}>
						{description}
					</p>
				)}

				{metadata && (
					<div className={styles.metadata}>
						{metadata.rating && (
							<span className={styles.metaItem} title="Average Rating">
								⭐ {metadata.rating}
							</span>
						)}
						{metadata.popularity && (
							<span className={styles.metaItem} title="Popularity Score">
								🔥 {metadata.popularity}
							</span>
						)}
						{metadata.tournaments && (
							<span className={styles.metaItem} title="Tournament Appearances">
								🏆 {metadata.tournaments}
							</span>
						)}
						{metadata.categories && metadata.categories.length > 0 && (
							<div className={styles.categories}>
								{metadata.categories.slice(0, 2).map((category, index) => (
									<span key={index} className={styles.categoryTag}>
										{category}
									</span>
								))}
								{metadata.categories.length > 2 && (
									<span className={styles.categoryMore}>+{metadata.categories.length - 2}</span>
								)}
							</div>
						)}
					</div>
				)}

				{shortcutHint && (
					<span className={styles.shortcutHint} aria-hidden="true">
						{shortcutHint}
					</span>
				)}
				{isSelected && (
					<span className={styles.checkMark} aria-hidden="true">
						✓
					</span>
				)}
				{isRippling && isInteractive && (
					<span className={styles.rippleEffect} style={rippleStyle} aria-hidden="true" />
				)}
			</Card>

			{showTooltip && metadata && tooltipPosition.x > 0 && tooltipPosition.y > 0 && (
				<div
					className={styles.tooltip}
					style={{
						left: Math.min(
							tooltipPosition.x + 10,
							typeof window !== "undefined" ? window.innerWidth - 320 : tooltipPosition.x + 10,
						),
						top: Math.max(tooltipPosition.y - 10, 10),
						zIndex: 1000,
					}}
				>
					<div className={styles.tooltipContent}>
						<div className={styles.tooltipHeader}>
							<h3 className={styles.tooltipName}>{name}</h3>
							{metadata.rank && <span className={styles.tooltipRank}>#{metadata.rank}</span>}
						</div>

						{metadata.description && (
							<p className={styles.tooltipDescription}>{metadata.description}</p>
						)}

						<div className={styles.tooltipStats}>
							{[
								{ key: "rating", label: "Rating" },
								{ key: "wins", label: "Wins" },
								{ key: "losses", label: "Losses" },
								{ key: "totalMatches", label: "Total Matches" },
								{ key: "winRate", label: "Win Rate", suffix: "%" },
							].map(({ key, label, suffix }) => {
								const value = metadata[key];
								return value !== undefined && value !== null ? (
									<div key={key} className={styles.tooltipStat}>
										<span className={styles.tooltipLabel}>{label}</span>
										<span className={styles.tooltipValue}>
											{String(value)}
											{suffix}
										</span>
									</div>
								) : null;
							})}
						</div>

						{metadata.categories && metadata.categories.length > 0 && (
							<div className={styles.tooltipCategories}>
								<span className={styles.tooltipCategoriesLabel}>Categories:</span>
								<div className={styles.tooltipCategoryTags}>
									{metadata.categories.map((category, index) => (
										<span key={index} className={styles.tooltipCategoryTag}>
											{category}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
});

CardNameBase.displayName = "CardName";

export const CardName = CardNameBase;

// Add sub-component to Card
const CardWithStats = Object.assign(Card, { Stats: CardStats, Name: CardName });

export default CardWithStats;
