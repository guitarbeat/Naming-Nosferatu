/**
 * @module EmptyState
 * @description A generic empty state component to provide feedback when no data is available.
 * Styles consolidated in src/shared/styles/components-primitives.css
 */

import type React from "react";

export interface EmptyStateProps {
	/**
	 * Main title of the empty state
	 */
	title: string;
	/**
	 * Detailed description or helpful hint
	 */
	description?: string;
	/**
	 * Icon or emoji to display
	 * @default "📭"
	 */
	icon?: React.ReactNode;
	/**
	 * Optional action button or link
	 */
	action?: React.ReactNode;
	className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
	title,
	description,
	icon = "📭",
	action,
	className = "",
}) => {
	return (
		<div className={`${styles.container} ${className}`}>
			<div className={styles.iconWrapper} aria-hidden="true">
				{icon}
			</div>
			<h3 className={styles.title}>{title}</h3>
			{description && <p className={styles.description}>{description}</p>}
			{action && <div className={styles.actions}>{action}</div>}
		</div>
	);
};
