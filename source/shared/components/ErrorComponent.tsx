/**
 * @module ErrorComponent
 * @description Error display components with multiple variants.
 * Uses the consolidated ErrorBoundary from ./ErrorBoundary as the single source of truth.
 */

import { cn } from "@utils/cn";
import type React from "react";
import { ErrorBoundary, type ErrorFallbackProps } from "./ErrorBoundary";

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
		<div className={cn("flex flex-col gap-2 w-full", className)}>
			{onClearAll && (
				<button
					onClick={onClearAll}
					className="self-end text-xs font-medium text-red-300 hover:text-red-100 hover:scale-105 transition-all outline-none focus:ring-2 focus:ring-red-500/50 rounded px-1"
				>
					Clear All
				</button>
			)}
			<div className="flex flex-col gap-2">
				{errors.map((err, i) => (
					<div
						key={i}
						className="relative flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-in fade-in slide-in-from-top-1 shadow-sm backdrop-blur-sm"
					>
						<div className="flex-1 break-words font-medium">
							{/* biome-ignore lint/suspicious/noExplicitAny: Simple display */}
							{(err as any).message || String(err)}
						</div>
						{onDismiss && (
							<button
								onClick={() => onDismiss(i)}
								className="ml-3 p-1 text-red-400 hover:text-red-100 rounded-full hover:bg-red-500/20 transition-colors"
								aria-label="Dismiss error"
							>
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
		<div
			className={cn(
				"flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-100 text-sm shadow-sm backdrop-blur-sm",
				className,
			)}
			role="alert"
		>
			<span className="text-lg leading-none select-none">⚠️</span>
			<span className="font-medium pt-0.5 leading-tight">{msg}</span>
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
