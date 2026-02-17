import { cva } from "class-variance-authority";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import React, { memo, useId } from "react";
import { cn } from "@/shared/lib/basic";
import LiquidGlass, { DEFAULT_GLASS_CONFIG, resolveGlassConfig } from "../LiquidGlass";

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

// CVA variant for Card component
const cardVariants = cva(
	"relative flex flex-col overflow-hidden rounded-xl transition-all duration-300 backdrop-blur-md", // Base classes
	{
		variants: {
			variant: {
				default: "bg-white/5 border border-white/10",
				elevated: "bg-white/5 border-none shadow-md",
				outlined: "bg-transparent border border-white/20",
				filled: "bg-white/10 border-none",
				primary:
					"bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/30",
				success:
					"bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 hover:border-green-500/30",
				warning:
					"bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 hover:border-yellow-500/30",
				info: "bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/30",
				danger:
					"bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 hover:border-red-500/30",
				secondary:
					"bg-gradient-to-br from-gray-500/10 to-gray-500/5 border border-gray-500/20 hover:border-gray-500/30",
			},
			padding: {
				none: "p-0",
				small: "p-3",
				medium: "p-5",
				large: "p-8",
				xl: "p-10",
			},
			shadow: {
				none: "shadow-none",
				small: "shadow-sm",
				medium: "shadow-md",
				large: "shadow-lg",
				xl: "shadow-xl",
			},
			bordered: {
				true: "border border-white/10",
				false: "",
			},
			background: {
				solid: "bg-black/40",
				glass: "backdrop-blur-xl bg-white/5",
				gradient: "bg-gradient-to-br from-white/10 to-white/5",
				transparent: "bg-transparent",
			},
		},
		defaultVariants: {
			variant: "default",
			padding: "medium",
			shadow: "none",
			bordered: false,
			background: "solid",
		},
	},
);

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

const CardBase = memo(
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
				enableTilt = false,
				onClick,
				onMouseMove,
				onMouseLeave,
				style,
				...props
			},
			ref,
		) => {
			const mouseX = useMotionValue(0);
			const mouseY = useMotionValue(0);

			const mouseXSpring = useSpring(mouseX);
			const mouseYSpring = useSpring(mouseY);

			const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
			const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

			const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
				const rect = e.currentTarget.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;

				// Update CSS variables for the CSS-based glow effect
				e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
				e.currentTarget.style.setProperty("--mouse-y", `${y}px`);

				if (enableTilt) {
					const xPct = x / rect.width - 0.5;
					const yPct = y / rect.height - 0.5;
					mouseX.set(xPct);
					mouseY.set(yPct);
				}

				onMouseMove?.(e);
			};

			const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
				if (enableTilt) {
					mouseX.set(0);
					mouseY.set(0);
				}
				onMouseLeave?.(e);
			};

			const cardRefClasses = cardVariants({
				variant,
				padding,
				shadow,
				bordered: border,
				background:
					background !== "solid" && background !== "glass" && !liquidGlass ? background : "solid",
				className,
			});

			const finalClasses = cn(
				cardRefClasses,
				interactive &&
					"cursor-pointer hover:-translate-y-1 hover:shadow-lg active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-purple-500",
				interactive && onClick && "active:translate-y-0",
				// Glow effect helper
				"before:absolute before:inset-0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 before:pointer-events-none before:z-0",
				"before:bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),rgba(168,85,247,0.15),transparent_50%)]",
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

				const wrapperClasses = [className].filter(Boolean).join(" ");
				const contentClasses = cardVariants({
					variant,
					padding,
					shadow,
					bordered: border,
				});

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
						style={{
							width: "100%",
							height: "auto",
							...(props as React.HTMLAttributes<HTMLElement>).style,
						}}
						{...glassProps}
					>
						<Component ref={ref} className={contentClasses} onClick={onClick} {...props}>
							{children}
						</Component>
					</LiquidGlass>
				);
			}

			const motionProps = enableTilt
				? {
						style: {
							rotateX,
							rotateY,
							transformStyle: "preserve-3d" as const,
							...style,
						},
					}
				: { style };

			const CommonComponent = (enableTilt ? motion.div : Component) as any;

			return (
				<CommonComponent
					ref={ref}
					className={finalClasses}
					onClick={onClick}
					onMouseMove={handleMouseMove}
					onMouseLeave={handleMouseLeave}
					{...motionProps}
					{...props}
				>
					<div
						className="relative z-10" // Ensure content is above glow
						style={
							enableTilt
								? {
										transform: "translateZ(20px)",
										transformStyle: "preserve-3d",
									}
								: undefined
						}
					>
						{children}
					</div>
				</CommonComponent>
			);
		},
	),
);

CardBase.displayName = "Card";

export const Card = CardBase;


