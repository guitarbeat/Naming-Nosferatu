/**
 * @module ErrorComponent
 * @description Error display components with multiple variants.
 * Uses the consolidated ErrorBoundary from ./ErrorBoundary as the single source of truth.
 */

import type React from "react";
import { ErrorBoundary, type ErrorFallbackProps } from "./ErrorBoundary";
import styles from "./ErrorComponent.module.css";

/* ========================================= */
/*             ERROR COMPONENTS              */
/* ========================================= */

interface AppError {
	message?: string;
	severity?: string;
	isRetryable?: boolean;
	timestamp?: number | string;
	details?: string;
	suggestion?: string;
	errorType?: string;
	attempts?: number;
	originalError?: unknown;
	stack?: string;
	context?: string;
}

export interface ErrorProps {
	variant?: "boundary" | "list" | "inline";
	error?: AppError | string | unknown;
	onRetry?: (...args: unknown[]) => void;
	onDismiss?: (...args: unknown[]) => void;
	onClearAll?: () => void;
	context?: string;
	position?: "above" | "below" | "inline";
	showDetails?: boolean;
	showRetry?: boolean;
	showDismiss?: boolean;
	size?: "small" | "medium" | "large";
	className?: string;
	children?: React.ReactNode;
}

interface ErrorListProps {
	errors?: (AppError | string | unknown)[];
	onRetry?: (error: unknown, index: number) => void;
	onDismiss?: (index: number) => void;
	onClearAll?: () => void;
	showDetails?: boolean;
	className?: string;
}

const ErrorList: React.FC<ErrorListProps> = ({
	errors = [],
	onRetry: _onRetry,
	onDismiss,
	onClearAll,
	showDetails: _showDetails,
	className,
}) => {
	if (!errors.length) {
		return null;
	}
	return (
		<div className={`${styles.list} ${className}`}>
			{onClearAll && (
				<button onClick={onClearAll} className={styles.listClearAllButton}>
					Clear All
				</button>
			)}
			<div className={styles.listItems}>
				{errors.map((err, i) => (
					<div key={i} className={styles.listItem}>
						<div className={styles.listMessage}>
							{/* biome-ignore lint/suspicious/noExplicitAny: Simple display */}
							{(err as any).message || String(err)}
						</div>
						{onDismiss && (
							<button onClick={() => onDismiss(i)} className={styles.listDismissButton}>
								×
							</button>
						)}
					</div>
				))}
			</div>
		</div>
	);
};

interface ErrorInlineProps {
	error: AppError | string | unknown;
	context?: string;
	className?: string;
}

const ErrorInline: React.FC<ErrorInlineProps> = ({
	error,
	context: _context = "general",
	className = "",
}) => {
	if (!error) {
		return null;
	}
	const msg = typeof error === "string" ? error : (error as AppError).message || "Error";
	return (
		<div className={`${styles.inline} ${styles.inlineGeneral} ${className}`} role="alert">
			<div className={styles.inlineContent}>
				<span className={styles.inlineIcon}>⚠️</span>
				<span className={styles.inlineMessage}>{msg}</span>
			</div>
		</div>
	);
};

/**
 * Unified error component with boundary, list, and inline variants.
 * Uses the consolidated ErrorBoundary from ErrorBoundary/ErrorBoundary.tsx.
 */
export const ErrorComponent: React.FC<ErrorProps> = ({
	variant = "inline",
	error,
	onRetry,
	onDismiss,
	onClearAll,
	context,
	className = "",
	children,
}) => {
	if (variant === "boundary") {
		return (
			<ErrorBoundary
				context={context || "Component Boundary"}
				onError={(err) => {
					if (onRetry) {
						onRetry(err);
					}
				}}
			>
				{children}
			</ErrorBoundary>
		);
	}
	if (variant === "list") {
		const arr = Array.isArray(error) ? error : [error];
		return (
			<ErrorList
				errors={arr}
				onRetry={onRetry as (e: unknown, i: number) => void}
				onDismiss={onDismiss as (i: number) => void}
				onClearAll={onClearAll}
				className={className}
			/>
		);
	}
	return <ErrorInline error={error} context={context} className={className} />;
};

ErrorComponent.displayName = "ErrorComponent";

// Re-export ErrorBoundary and its types for convenience
export { ErrorBoundary, type ErrorFallbackProps };
