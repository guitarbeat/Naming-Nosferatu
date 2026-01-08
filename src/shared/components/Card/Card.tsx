/**
 * @module Card
 * @description Reusable card component with flexible styling options
 */

import PropTypes from "prop-types";
import React, { memo, useId } from "react";
import { cn } from "../../utils";
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

const Card = memo(
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

// PropTypes for runtime validation (TypeScript handles compile-time)
const CardWithPropTypes = Card as typeof Card & {
	propTypes?: unknown;
};

(CardWithPropTypes as { propTypes: unknown }).propTypes = {
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
	variant: PropTypes.oneOf([
		"default",
		"elevated",
		"outlined",
		"filled",
		"primary",
		"success",
		"warning",
		"info",
		"danger",
		"secondary",
	]),
	padding: PropTypes.oneOf(["none", "small", "medium", "large", "xl"]),
	shadow: PropTypes.oneOf(["none", "small", "medium", "large", "xl"]),
	border: PropTypes.bool,
	background: PropTypes.oneOf(["solid", "glass", "gradient", "transparent"]),
	as: PropTypes.elementType,
	interactive: PropTypes.bool,
	onClick: PropTypes.func,
	liquidGlass: PropTypes.oneOfType([
		PropTypes.bool,
		PropTypes.shape({
			width: PropTypes.number,
			height: PropTypes.number,
			radius: PropTypes.number,
			scale: PropTypes.number,
			saturation: PropTypes.number,
			frost: PropTypes.number,
			inputBlur: PropTypes.number,
			outputBlur: PropTypes.number,
		}),
	]),
};

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

CardStats.propTypes = {
	title: PropTypes.string,
	label: PropTypes.string,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]).isRequired,
	emoji: PropTypes.node,
	className: PropTypes.string,
	labelClassName: PropTypes.string,
	valueClassName: PropTypes.string,
	emojiClassName: PropTypes.string,
};

// Add sub-component to Card
// biome-ignore lint/style/useNamingConvention: Component name, PascalCase is appropriate
const CardWithStats = Object.assign(Card, { Stats: CardStats });

export default CardWithStats;
