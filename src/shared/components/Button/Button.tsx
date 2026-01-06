/**
 * @module Button
 * @description Unified button component system using shadcn/ui.
 * Provides consistent styling, accessibility, and behavior across the app.
 * This component wraps the shadcn Button and provides a consistent API.
 */

import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import PropTypes from "prop-types";
import React, { forwardRef, memo } from "react";
import { cn } from "../../utils/core";

// Shadcn button variants (inlined from ui/button.tsx)
const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90",
				outline:
					"border border-input bg-background shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80",
				ghost: "transition-colors hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 transition-colors hover:underline",
				login:
					"relative font-bold tracking-wide bg-[linear-gradient(135deg,var(--button-primary-bg,var(--primary-600)),var(--button-primary-hover,var(--primary-700)))] text-primary-foreground shadow-[0_4px_16px_var(--overlay-dark),0_2px_8px_var(--overlay-medium),0_0_20px_color-mix(in_srgb,var(--primary-600)_30%,transparent)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_8px_24px_var(--overlay-darker),0_4px_12px_var(--overlay-dark),0_0_30px_color-mix(in_srgb,var(--primary-600)_40%,transparent)] hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-100 active:shadow-[0_2px_8px_var(--overlay-dark),0_0_15px_color-mix(in_srgb,var(--primary-600)_25%,transparent)] before:absolute before:inset-0 before:content-[''] before:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-neutral-50)_10%,transparent),transparent_50%,color-mix(in_srgb,var(--color-neutral-50)_5%,transparent))] before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300 before:pointer-events-none hover:before:opacity-100 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-[0_2px_4px_var(--overlay-light)]",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 rounded-md px-3 text-xs",
				lg: "h-10 rounded-md px-8",
				icon: "h-9 w-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

interface ShadcnButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "login";
	size?: "default" | "sm" | "lg" | "icon";
	asChild?: boolean;
}

const ShadcnButton = forwardRef<HTMLButtonElement, ShadcnButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
		);
	},
);
ShadcnButton.displayName = "ShadcnButton";

const variantMapping = {
	primary: "default",
	secondary: "secondary",
	danger: "destructive",
	ghost: "ghost",
	login: "login",
};

const sizeMapping = {
	small: "sm",
	medium: "default",
	large: "lg",
};

const BUTTON_VARIANTS = ["primary", "secondary", "danger", "ghost", "login"];
const BUTTON_SIZES = ["small", "medium", "large"];

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
	children: React.ReactNode;
	variant?: "primary" | "secondary" | "danger" | "ghost" | "login";
	size?: "small" | "medium" | "large";
	disabled?: boolean;
	loading?: boolean;
	type?: "button" | "submit" | "reset";
	className?: string;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	startIcon?: React.ReactNode | null;
	endIcon?: React.ReactNode | null;
	iconOnly?: boolean;
}

const Button = ({
	children,
	variant = "primary",
	size = "medium",
	disabled = false,
	loading = false,
	type = "button" as const,
	className = "",
	onClick,
	startIcon = null,
	endIcon = null,
	iconOnly = false,
	...rest
}: ButtonProps) => {
	const shadcnVariant = (variantMapping[variant] || "default") as
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link"
		| "login";
	let shadcnSize = (sizeMapping[size] || "default") as "default" | "sm" | "lg" | "icon";

	if (iconOnly) {
		shadcnSize = "icon";
	}

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (disabled || loading) {
			event.preventDefault();
			return;
		}
		onClick?.(event);
	};

	return (
		<ShadcnButton
			type={type}
			variant={shadcnVariant}
			size={shadcnSize}
			disabled={disabled || loading}
			className={className}
			onClick={handleClick}
			{...rest}
		>
			{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
			{startIcon && !loading && <span className="mr-2">{startIcon}</span>}
			{!iconOnly && children}
			{iconOnly && !startIcon && !loading && children}
			{endIcon && !loading && <span className="ml-2">{endIcon}</span>}
		</ShadcnButton>
	);
};

Button.propTypes = {
	children: PropTypes.node.isRequired,
	variant: PropTypes.oneOf(BUTTON_VARIANTS),
	size: PropTypes.oneOf(BUTTON_SIZES),
	disabled: PropTypes.bool,
	loading: PropTypes.bool,
	type: PropTypes.oneOf(["button", "submit", "reset"]),
	className: PropTypes.string,
	onClick: PropTypes.func,
	startIcon: PropTypes.node,
	endIcon: PropTypes.node,
	iconOnly: PropTypes.bool,
};

Button.displayName = "Button";

/**
 * IconButton component for icon-only buttons
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Icon element to display
 * @param {string} props.variant - Button variant
 * @param {string} props.size - Button size
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaLabel - Accessibility label (required for icon buttons)
 * @param {Object} props.rest - Additional props
 * @returns {JSX.Element} IconButton component
 */
interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
	icon: React.ReactNode;
	variant?: "primary" | "secondary" | "danger" | "ghost" | "login";
	size?: "small" | "medium" | "large";
	disabled?: boolean;
	loading?: boolean;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	className?: string;
	ariaLabel: string;
}

const IconButton = ({
	icon,
	variant = "ghost",
	size = "medium",
	disabled = false,
	loading = false,
	onClick,
	className = "",
	ariaLabel,
	...rest
}: IconButtonProps) => {
	return (
		<Button
			variant={variant}
			size={size}
			disabled={disabled}
			loading={loading}
			onClick={onClick}
			className={className}
			iconOnly={true}
			aria-label={ariaLabel}
			{...rest}
		>
			{icon}
		</Button>
	);
};

IconButton.propTypes = {
	icon: PropTypes.node.isRequired,
	variant: PropTypes.oneOf(BUTTON_VARIANTS),
	size: PropTypes.oneOf(BUTTON_SIZES),
	disabled: PropTypes.bool,
	loading: PropTypes.bool,
	onClick: PropTypes.func,
	className: PropTypes.string,
	ariaLabel: PropTypes.string.isRequired,
};

IconButton.displayName = "IconButton";

/**
 * PlusIcon component for tournament button
 */
const PlusIcon = () => (
	<svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false" className="w-4 h-4">
		<path
			d="M12 4v16m8-8H4"
			stroke="currentColor"
			strokeWidth="2"
			fill="none"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * TournamentButton component - specialized button for starting tournaments
 * Consolidates the functionality of StartTournamentButton
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button text (default: "Start New Tournament")
 * @param {string} props.variant - Button variant (default: "primary")
 * @param {string} props.size - Button size (default: "medium")
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.startIcon - Custom start icon (null to hide, undefined for default plus)
 * @param {React.ReactNode} props.endIcon - End icon
 * @param {string} props.ariaLabel - Accessibility label
 * @param {Object} props.rest - Additional props
 * @returns {JSX.Element} TournamentButton component
 */
interface TournamentButtonProps {
	children?: React.ReactNode;
	variant?: "primary" | "secondary" | "danger" | "ghost" | "login";
	size?: "small" | "medium" | "large";
	disabled?: boolean;
	loading?: boolean;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	className?: string;
	startIcon?: React.ReactNode | null;
	endIcon?: React.ReactNode;
	ariaLabel?: string;
}

const TournamentButton = ({
	children = "Start New Tournament",
	variant = "primary",
	size = "medium",
	disabled = false,
	loading = false,
	onClick,
	className = "",
	startIcon,
	endIcon,
	ariaLabel,
	...rest
}: TournamentButtonProps) => {
	const { "aria-label": ariaLabelFromRest, ...buttonProps } = rest as {
		"aria-label"?: string;
		[key: string]: unknown;
	};
	const computedLabel =
		ariaLabel ??
		ariaLabelFromRest ??
		(typeof children === "string" ? children : "Start New Tournament");

	const resolvedStartIcon =
		startIcon === null ? null : startIcon !== undefined ? startIcon : <PlusIcon />;

	return (
		<Button
			variant={variant}
			size={size}
			disabled={disabled}
			loading={loading}
			onClick={onClick}
			className={className}
			startIcon={resolvedStartIcon}
			endIcon={endIcon}
			aria-label={computedLabel}
			{...buttonProps}
		>
			{children}
		</Button>
	);
};

TournamentButton.propTypes = {
	children: PropTypes.node,
	variant: PropTypes.oneOf(BUTTON_VARIANTS),
	size: PropTypes.oneOf(BUTTON_SIZES),
	disabled: PropTypes.bool,
	loading: PropTypes.bool,
	onClick: PropTypes.func,
	className: PropTypes.string,
	startIcon: PropTypes.node,
	endIcon: PropTypes.node,
	ariaLabel: PropTypes.string,
};

TournamentButton.displayName = "TournamentButton";

/**
 * CalendarButton component - exports tournament results to Google Calendar
 * @param {Object} props - Component props
 * @param {Array} props.rankings - Array of name rankings
 * @param {string} props.userName - User name for calendar event
 * @param {string} props.variant - Button variant (default: "secondary")
 * @param {string} props.size - Button size (default: "medium")
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Optional external click handler
 * @param {Object} props.rest - Additional props
 * @returns {JSX.Element} CalendarButton component
 */
interface CalendarButtonProps {
	rankings: Array<{
		id: string | number;
		name: string;
		rating?: number;
		// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
		is_hidden?: boolean;
	}>;
	userName: string;
	className?: string;
	variant?: "primary" | "secondary" | "danger" | "ghost" | "login";
	size?: "small" | "medium" | "large";
	disabled?: boolean;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const CalendarButton = ({
	rankings,
	userName,
	className = "",
	variant = "secondary",
	size = "medium",
	disabled = false,
	...rest
}: CalendarButtonProps) => {
	const { onClick: externalOnClick, ...buttonProps } = rest as {
		onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	};

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (typeof externalOnClick === "function") {
			externalOnClick(event);
		}

		if (event?.defaultPrevented) {
			return;
		}

		// Filter out hidden names and sort by rating
		const activeNames = rankings
			.filter((name) => !name.is_hidden)
			.sort((a, b) => (b.rating || 1500) - (a.rating || 1500));

		const winnerName = activeNames[0]?.name || "No winner yet";

		const today = new Date();
		const [startDateISO] = today.toISOString().split("T");
		const startDate = startDateISO.replace(/-/g, "");
		const endDate = new Date(today);
		endDate.setDate(endDate.getDate() + 1);
		const [endDateISO] = endDate.toISOString().split("T");
		const endDateStr = endDateISO.replace(/-/g, "");

		const text = `🐈‍⬛ ${winnerName}`;
		const details = `Cat name rankings for ${userName}:\n\n${activeNames
			.map(
				(name, index) => `${index + 1}. ${name.name} (Rating: ${Math.round(name.rating || 1500)})`,
			)
			.join("\n")}`;

		const baseUrl = "https://calendar.google.com/calendar/render";
		const params = new URLSearchParams({
			action: "TEMPLATE",
			text,
			details,
			dates: `${startDate}/${endDateStr}`,
			ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
		});

		window.open(`${baseUrl}?${params.toString()}`, "_blank");
	};

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleClick}
			className={className}
			disabled={disabled}
			startIcon={(<span>📅</span>) as React.ReactNode}
			aria-label="Add to Google Calendar"
			title="Add to Google Calendar"
			{...buttonProps}
		>
			Add to Calendar
		</Button>
	);
};

CalendarButton.propTypes = {
	rankings: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
			name: PropTypes.string.isRequired,
			rating: PropTypes.number,
			// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
			is_hidden: PropTypes.bool,
		}),
	).isRequired,
	userName: PropTypes.string.isRequired,
	className: PropTypes.string,
	variant: PropTypes.oneOf(BUTTON_VARIANTS),
	size: PropTypes.oneOf(BUTTON_SIZES),
	disabled: PropTypes.bool,
	onClick: PropTypes.func,
};

CalendarButton.displayName = "CalendarButton";

/**
 * ScrollToTopButton component - floating button that scrolls to top of page
 * @param {Object} props - Component props
 * @param {boolean} props.isLoggedIn - Whether user is logged in
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element|null} ScrollToTopButton component or null
 */
const ScrollToTopButton = ({
	isLoggedIn,
	className = "",
}: {
	isLoggedIn: boolean;
	className?: string;
}) => {
	const [showScrollTop, setShowScrollTop] = React.useState(false);

	React.useEffect(() => {
		if (!isLoggedIn) {
			setShowScrollTop(false);
			return undefined;
		}

		let scrollTimeout: number | null = null;

		const checkScroll = () => {
			const threshold = window.innerHeight <= 768 ? window.innerHeight * 1.5 : window.innerHeight;
			setShowScrollTop(window.scrollY > threshold);
		};

		const throttledCheckScroll = () => {
			if (scrollTimeout) {
				return;
			}

			scrollTimeout = requestAnimationFrame(() => {
				checkScroll();
				scrollTimeout = null;
			});
		};

		checkScroll();

		window.addEventListener("scroll", throttledCheckScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", throttledCheckScroll);
			if (scrollTimeout) {
				cancelAnimationFrame(scrollTimeout);
			}
		};
	}, [isLoggedIn]);

	if (!isLoggedIn || !showScrollTop) {
		return null;
	}

	return (
		<button
			type="button"
			className={`scroll-to-top visible ${className}`.trim()}
			onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
			aria-label="Scroll to top"
			tabIndex={0}
		>
			↑
		</button>
	);
};

ScrollToTopButton.propTypes = {
	isLoggedIn: PropTypes.bool.isRequired,
	className: PropTypes.string,
};

ScrollToTopButton.displayName = "ScrollToTopButton";

export default memo(Button);
export { IconButton, TournamentButton, ScrollToTopButton };
// CalendarButton moved to Dashboard.jsx as local component (only used there)
