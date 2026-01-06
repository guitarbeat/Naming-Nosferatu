/**
 * @module CollapsibleHeader
 * @description Simple, reusable collapsible header component.
 * KISS principle: minimal props, clear structure, consistent behavior.
 */

import PropTypes from "prop-types";
import { useId } from "react";
import { useCollapsible } from "../../../core/hooks/useStorage";
import LiquidGlass, {
	HEADER_GLASS_CONFIG,
	resolveGlassConfig,
} from "../LiquidGlass/LiquidGlass";
import "./CollapsibleHeader.css";

/**
 * Chevron icon component - simple SVG for better control
 */
const ChevronIcon = ({ isCollapsed }: { isCollapsed: boolean }) => (
	<svg
		className={`collapsible-chevron ${isCollapsed ? "collapsed" : ""}`}
		width="12"
		height="12"
		viewBox="0 0 12 12"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<path
			d="M3 4.5L6 7.5L9 4.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

ChevronIcon.propTypes = {
	isCollapsed: PropTypes.bool.isRequired,
};

/**
 * Collapsible Header Component
 * @param {Object} props
 * @param {string} props.title - Header title (required)
 * @param {string} props.icon - Emoji icon (optional)
 * @param {boolean} props.isCollapsed - Current collapsed state
 * @param {Function} props.onToggle - Toggle handler
 * @param {React.ReactNode} props.summary - Content to show when collapsed
 * @param {React.ReactNode} props.actions - Action buttons (optional)
 * @param {string} props.contentId - ID of the controlled content for a11y
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Style variant: 'default' | 'compact'
 * @param {React.ReactNode} props.toolbar - Optional toolbar to show below header when expanded
 * @param {boolean|Object} props.liquidGlass - Enable liquid glass effect (boolean or config object)
 */
interface CollapsibleHeaderProps {
	title: string;
	icon?: string;
	isCollapsed?: boolean;
	onToggle?: () => void;
	summary?: React.ReactNode;
	actions?: React.ReactNode;
	contentId?: string;
	className?: string;
	variant?: "default" | "compact";
	toolbar?: React.ReactNode;
	liquidGlass?: boolean | Record<string, unknown>;
}

export function CollapsibleHeader({
	title,
	icon,
	isCollapsed = false,
	onToggle,
	summary,
	actions,
	contentId,
	className = "",
	variant = "default",
	toolbar,
	liquidGlass,
}: CollapsibleHeaderProps) {
	const shouldUseLiquidGlass = !!liquidGlass;
	const isCollapsible = !!onToggle;
	const headerGlassId = useId();
	const resolvedContentId =
		contentId || `collapsible-content-${headerGlassId.replace(/:/g, "-")}`;

	const headerContent = (
		<>
			<header
				className={`collapsible-header collapsible-header--${variant} ${isCollapsed ? "collapsible-header--collapsed" : ""} ${isCollapsible ? "collapsible-header--sortable" : ""} ${className}`}
			>
				{isCollapsible ? (
					<button
						type="button"
						className="collapsible-toggle"
						onClick={onToggle}
						aria-expanded={!isCollapsed}
						aria-controls={resolvedContentId}
						aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
						title={isCollapsed ? title : undefined}
					>
						<ChevronIcon isCollapsed={isCollapsed} />
						{icon && (
							<span
								className={
									isCollapsed
										? "collapsible-icon-collapsed"
										: "collapsible-icon"
								}
								aria-hidden="true"
							>
								{icon}
							</span>
						)}
						{!isCollapsed && <span className="collapsible-title">{title}</span>}
						{isCollapsed && summary && (
							<span className="collapsible-summary">{summary}</span>
						)}
					</button>
				) : (
					<div className="collapsible-toggle static">
						{icon && (
							<span className="collapsible-icon" aria-hidden="true">
								{icon}
							</span>
						)}
						<span className="collapsible-title">{title}</span>
					</div>
				)}
				{(isCollapsible ? !isCollapsed : true) && actions && (
					<div className="collapsible-header-controls">
						<div className="collapsible-actions">{actions}</div>
					</div>
				)}
			</header>
			{(isCollapsible ? !isCollapsed : true) && toolbar && (
				<div className="collapsible-header-toolbar">{toolbar}</div>
			)}
		</>
	);

	if (shouldUseLiquidGlass) {
		type GlassConfigType = {
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
		};
		const glassConfig = resolveGlassConfig(
			liquidGlass,
			HEADER_GLASS_CONFIG,
		) as GlassConfigType;
		const {
			width = 800,
			height = 60,
			radius = 12,
			scale = -90,
			saturation = 1.05,
			frost = 0.06,
			inputBlur = 10,
			outputBlur = 0.6,
			id,
			...glassProps
		} = glassConfig;

		return (
			<LiquidGlass
				id={id || `header-glass-${headerGlassId.replace(/:/g, "-")}`}
				width={width}
				height={height}
				radius={radius}
				scale={scale}
				saturation={saturation}
				frost={frost}
				inputBlur={inputBlur}
				outputBlur={outputBlur}
				className={className}
				style={{ width: "100%", height: "auto" }}
				{...glassProps}
			>
				{headerContent}
			</LiquidGlass>
		);
	}

	return headerContent;
}

CollapsibleHeader.propTypes = {
	title: PropTypes.string.isRequired,
	icon: PropTypes.string,
	isCollapsed: PropTypes.bool.isRequired,
	onToggle: PropTypes.func.isRequired,
	summary: PropTypes.node,
	actions: PropTypes.node,
	contentId: PropTypes.string,
	className: PropTypes.string,
	variant: PropTypes.oneOf(["default", "compact"]),
	toolbar: PropTypes.node,
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

/**
 * Collapsible Content wrapper with animation
 * @param {Object} props
 * @param {string} props.id - Content ID for a11y
 * @param {boolean} props.isCollapsed - Current collapsed state
 * @param {React.ReactNode} props.children - Content
 * @param {string} props.className - Additional CSS classes
 */
interface CollapsibleContentProps {
	id?: string;
	isCollapsed: boolean;
	children: React.ReactNode;
	className?: string;
}

export function CollapsibleContent({
	id,
	isCollapsed,
	children,
	className = "",
}: CollapsibleContentProps) {
	const contentId = id;
	return (
		<div
			id={contentId}
			className={`collapsible-content ${isCollapsed ? "collapsed" : ""} ${className}`}
		>
			<div className="collapsible-content-inner">{children}</div>
		</div>
	);
}

CollapsibleContent.propTypes = {
	id: PropTypes.string,
	isCollapsed: PropTypes.bool.isRequired,
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
};

/**
 * Collapsible Section Component
 * A convenience wrapper that combines CollapsibleHeader and CollapsibleContent
 * with built-in state management.
 *
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.icon - Emoji icon for the title
 * @param {React.ReactNode} props.summary - Content to show when collapsed
 * @param {React.ReactNode} props.actions - Action buttons in header
 * @param {React.ReactNode} props.children - Section content
 * @param {string} props.storageKey - localStorage key for persistence
 * @param {boolean} props.defaultCollapsed - Default collapsed state
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Style variant: 'default' | 'compact'
 * @param {React.ReactNode} props.toolbar - Optional toolbar to show below header when expanded
 * @param {boolean|Object} props.liquidGlass - Enable liquid glass effect (boolean or config object)
 */
interface CollapsibleSectionProps {
	title: string;
	icon?: string;
	summary?: React.ReactNode;
	actions?: React.ReactNode;
	children: React.ReactNode;
	storageKey?: string | null;
	defaultCollapsed?: boolean;
	className?: string;
	variant?: "default" | "compact";
	toolbar?: React.ReactNode;
	liquidGlass?: boolean | Record<string, unknown>;
}

export function CollapsibleSection({
	title,
	icon,
	summary,
	actions,
	children,
	storageKey = null,
	defaultCollapsed = false,
	className = "",
	variant = "default",
	toolbar,
	liquidGlass,
}: CollapsibleSectionProps) {
	const { isCollapsed, toggleCollapsed } = useCollapsible(
		storageKey,
		defaultCollapsed,
	);

	const contentId = `collapsible-${title?.toLowerCase().replace(/\s+/g, "-") || "section"}-content`;

	return (
		<div className={className}>
			<CollapsibleHeader
				title={title}
				icon={icon}
				isCollapsed={isCollapsed}
				onToggle={toggleCollapsed}
				summary={summary}
				actions={actions}
				contentId={contentId}
				variant={variant}
				toolbar={toolbar}
				liquidGlass={liquidGlass}
			/>
			<CollapsibleContent id={contentId} isCollapsed={isCollapsed}>
				{children}
			</CollapsibleContent>
		</div>
	);
}

CollapsibleSection.propTypes = {
	title: PropTypes.string.isRequired,
	icon: PropTypes.string,
	summary: PropTypes.node,
	actions: PropTypes.node,
	children: PropTypes.node.isRequired,
	storageKey: PropTypes.string,
	defaultCollapsed: PropTypes.bool,
	className: PropTypes.string,
	variant: PropTypes.oneOf(["default", "compact"]),
	toolbar: PropTypes.node,
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
