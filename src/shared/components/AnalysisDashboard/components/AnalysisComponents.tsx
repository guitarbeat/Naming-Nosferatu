/**
 * @module AnalysisPanel/components/AnalysisComponents
 * @description Consolidated Analysis Panel UI components
 * Includes Badge, Button, Toolbar, and Header components
 */

import PropTypes from "prop-types";

// ============================================================================
// AnalysisButton Component
// ============================================================================

/**
 * Button component for Analysis Mode
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant: 'default' | 'primary' | 'danger' | 'ghost'
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.ariaLabel - Accessibility label
 * @param {string} props.className - Additional CSS classes
 */
export function AnalysisButton({
	children,
	variant = "default",
	onClick,
	disabled = false,
	ariaLabel,
	className = "",
	...props
}: {
	children: React.ReactNode;
	variant?: "default" | "primary" | "danger" | "ghost";
	onClick?: (e: React.MouseEvent) => void;
	disabled?: boolean;
	ariaLabel?: string;
	className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			className={`analysis-btn ${variant !== "default" ? `analysis-btn--${variant}` : ""} ${className}`}
			onClick={onClick}
			disabled={disabled}
			aria-label={ariaLabel}
			{...props}
		>
			{children}
		</button>
	);
}

AnalysisButton.propTypes = {
	children: PropTypes.node.isRequired,
	variant: PropTypes.oneOf(["default", "primary", "danger", "ghost"]),
	onClick: PropTypes.func,
	disabled: PropTypes.bool,
	ariaLabel: PropTypes.string,
	className: PropTypes.string,
};

// ============================================================================
// AnalysisToolbar Component
// ============================================================================

/**
 * Toolbar for Analysis Mode actions
 * @param {Object} props
 * @param {React.ReactNode} props.children - Toolbar content
 * @param {number} props.selectedCount - Number of selected items
 * @param {React.ReactNode} props.actions - Action buttons
 */
export function AnalysisToolbar({
	children,
	selectedCount = 0,
	actions,
}: {
	children?: React.ReactNode;
	selectedCount?: number;
	actions?: React.ReactNode;
}) {
	return (
		<div className="analysis-toolbar">
			{selectedCount > 0 && (
				<div className="analysis-selection-badge">
					<span className="analysis-selection-count">{selectedCount}</span>
					<span className="analysis-selection-label">selected</span>
				</div>
			)}
			{children && <div className="analysis-toolbar-content">{children}</div>}
			{actions && <div className="analysis-toolbar-actions">{actions}</div>}
		</div>
	);
}

AnalysisToolbar.propTypes = {
	children: PropTypes.node,
	selectedCount: PropTypes.number,
	actions: PropTypes.node,
};
