/**
 * @module PerformanceBadge
 * @description Component to display achievement/status badges for names
 * Styles are consolidated in src/shared/styles/components-primitives.css
 */


// Insight category lookup - keys use snake_case to match insight tag strings
const INSIGHT_CATEGORIES: Record<string, { label: string; icon: string; description: string }> = {
	top_rated: {
		label: "Top Rated",
		icon: "⭐",
		description: "Among the highest rated names",
	},
	trending_up: {
		label: "Trending",
		icon: "📈",
		description: "Rising in popularity",
	},
	trending_down: {
		label: "Declining",
		icon: "📉",
		description: "Decreasing in popularity",
	},
	new: { label: "New", icon: "✨", description: "Recently added" },
	undefeated: {
		label: "Undefeated",
		icon: "🏆",
		description: "Has never lost a matchup",
	},
	popular: { label: "Popular", icon: "❤️", description: "Frequently selected" },
	underdog: {
		label: "Underdog",
		icon: "🐕",
		description: "Low rating but gaining traction",
	},
};

const getInsightCategory = (type: string) => INSIGHT_CATEGORIES[type] || null;

/**
 * PerformanceBadge Component
 * Displays visual badge indicating achievement or status
 *
 * @param {Object} props
 * @param {string} props.type - Badge type (e.g., 'top_rated', 'trending_up', 'new', 'undefeated', etc.)
 * @param {string} props.label - Custom label (overrides default from type)
 * @param {string} props.variant - Size variant: 'sm' (compact) or 'md' (default)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
interface PerformanceBadgeProps {
	type: string;
	label?: string;
	variant?: "sm" | "md";
	className?: string;
}

// Internal component - only used within PerformanceBadges
function PerformanceBadge({ type, label, variant = "md", className = "" }: PerformanceBadgeProps) {
	const category = getInsightCategory(type);

	if (!category && !label) {
		return null;
	}

	const badgeLabel = label || category?.label || type;
	const badgeIcon = category?.icon || "•";
	const badgeDescription = category?.description || "";
	const badgeClass =
		`performance-badge performance-badge-${type} performance-badge-${variant} ${className}`.trim();

	return (
		<span
			className={badgeClass}
			title={badgeDescription}
			aria-label={`${badgeLabel}: ${badgeDescription}`}
			role="status"
		>
			<span className="badge-icon" aria-hidden="true">
				{badgeIcon}
			</span>
			<span className="badge-label">{badgeLabel}</span>
		</span>
	);
}


PerformanceBadge.displayName = "PerformanceBadge";

interface PerformanceBadgesProps {
	types?: string[];
	className?: string;
}

/**
 * Multiple Performance Badges Component
 * Renders multiple badges in a container
 *
 * @param {Object} props
 * @param {string[]} props.types - Array of badge types
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function PerformanceBadges({ types = [], className = "" }: PerformanceBadgesProps) {
	if (!types || types.length === 0) {
		return null;
	}

	return (
		<div className={`performance-badges ${className}`.trim()}>
			{types.map((type) => (
				<PerformanceBadge key={type} type={type} variant="sm" />
			))}
		</div>
	);
}


PerformanceBadges.displayName = "PerformanceBadges";

/**
 * TrendIndicator Component
 * Shows visual indication of trend (up/down/stable) with percentage change
 *
 * @param {Object} props
 * @param {string} props.direction - Trend direction: 'up', 'down', or 'stable'
 * @param {number} props.percentChange - Percentage change value
 * @param {boolean} props.compact - If true, show compact version (icon only)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.animated - If true, add animation on mount
 * @returns {JSX.Element}
 */
export function TrendIndicator({
	direction = "stable",
	percentChange = 0,
	compact = false,
	className = "",
	animated = true,
}) {
	const trendClass =
		`trend-indicator trend-${direction} ${animated ? "trend-animated" : ""} ${className}`.trim();

	const renderIcon = () => {
		switch (direction) {
			case "up":
				return (
					<span className="trend-icon" aria-hidden="true">
						📈
					</span>
				);
			case "down":
				return (
					<span className="trend-icon" aria-hidden="true">
						📉
					</span>
				);
			default:
				return (
					<span className="trend-icon" aria-hidden="true">
						➡️
					</span>
				);
		}
	};

	const ariaLabel = `${direction === "up" ? "Trending up" : direction === "down" ? "Trending down" : "Stable"} ${percentChange ? `by ${percentChange}%` : ""}`;

	if (compact) {
		return (
			<span className={trendClass} title={ariaLabel} aria-label={ariaLabel}>
				{renderIcon()}
			</span>
		);
	}

	return (
		<span className={trendClass} title={ariaLabel} aria-label={ariaLabel}>
			{renderIcon()}
			{percentChange !== 0 && (
				<span className="trend-value">
					{direction === "up" ? "+" : direction === "down" ? "−" : ""}
					{percentChange}%
				</span>
			)}
		</span>
	);
}


TrendIndicator.displayName = "TrendIndicator";
