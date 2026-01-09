/**
 * @module TournamentButton
 * @description Specialized button component for tournament actions
 */

import { Plus } from "lucide-react";
import React from "react";
import Button from "./Button";

/**
 * PlusIcon component for tournament button - now using lucide-react
 */
const PlusIcon = () => <Plus className="w-4 h-4" />;

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

TournamentButton.displayName = "TournamentButton";

export default TournamentButton;
