/**
 * @module Error
 * @description Error display components with multiple variants.
 */

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrowserState } from "../hooks/useBrowserState";
import styles from "./ErrorComponent.module.css";
import LiquidGlass from "./LiquidGlass/LiquidGlass";

const DEFAULT_MAX_RETRIES = 3;

/* ========================================= */
/*       ERROR BOUNDARY FALLBACK             */
/* ========================================= */

export interface ErrorBoundaryFallbackProps {
	error: Error;
	resetErrorBoundary: () => void;
	onRetry?: () => void;
}

export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({
	error,
	resetErrorBoundary,
	onRetry,
}) => {
	const [retryCount, setRetryCount] = useState(0);
	const [copied, setCopied] = useState(false);
	const [_isDetailsOpen, _setIsDetailsOpen] = useState(false);
	const navigate = useNavigate();
	const { prefersReducedMotion, ...screenSize } = useBrowserState();
	const mainContentRef = useRef<HTMLDivElement>(null);
	const retryButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (mainContentRef.current) {
			mainContentRef.current.focus();
		}
	}, []);

	useEffect(() => {
		const announcement = document.createElement("div");
		announcement.setAttribute("role", "alert");
		announcement.setAttribute("aria-live", "assertive");
		announcement.className = styles.srOnly || "sr-only";
		announcement.textContent = "An error has occurred.";
		document.body.appendChild(announcement);
		return () => {
			if (document.body.contains(announcement)) {
				document.body.removeChild(announcement);
			}
		};
	}, []);

	const canRetry = retryCount < DEFAULT_MAX_RETRIES;

	const handleRetry = () => {
		if (!canRetry) {
			window.location.reload();
			return;
		}
		setRetryCount((count) => count + 1);
		onRetry?.();
		resetErrorBoundary();
	};

	const handleCopyDiagnostics = async () => {
		const diagnosticText = `Error: ${error.message || "Unknown error"}\nStack: ${error.stack || "No stack trace"}`;
		try {
			await navigator.clipboard.writeText(diagnosticText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy", err);
		}
	};

	const boundaryContentClassName = [
		styles.boundaryContent,
		prefersReducedMotion ? styles.boundaryContentNoMotion : "",
		screenSize.isSmallMobile ? styles.boundaryContentSmallMobile : "",
		screenSize.isMobile ? styles.boundaryContentMobile : "",
		screenSize.isTablet ? styles.boundaryContentTablet : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			className={styles.boundary}
			role="alert"
			aria-labelledby="error-title"
			aria-describedby="error-message"
		>
			<LiquidGlass
				width={600}
				height={400}
				radius={24}
				scale={-180}
				saturation={1.2}
				frost={0.08}
				inputBlur={12}
				outputBlur={0.8}
				className={styles.boundaryGlass}
				id="error-boundary-glass-filter"
				style={{ width: "100%", maxWidth: "600px", height: "auto" }}
			>
				<div ref={mainContentRef} className={boundaryContentClassName} tabIndex={-1}>
					<div className={styles.boundaryIcon} aria-hidden="true">
						🐱
					</div>
					<h2 id="error-title" className={styles.boundaryTitle}>
						Something went wrong
					</h2>

					<div className={styles.boundaryActions}>
						<button
							ref={retryButtonRef}
							onClick={handleRetry}
							className={styles.boundaryRetryButton}
						>
							{canRetry ? "Try Again" : "Reload"}
						</button>
						<button
							onClick={() => navigate("/", { replace: true })}
							className={styles.boundaryHomeButton}
						>
							Home
						</button>
						<button onClick={handleCopyDiagnostics} className={styles.boundaryCopyButton}>
							{copied ? "Copied!" : "Copy Diagnostics"}
						</button>
					</div>

					{process.env.NODE_ENV === "development" && error && (
						<details className={styles.boundaryDetails}>
							<summary>Error Details</summary>
							<pre className={styles.boundaryErrorStack}>{error.toString()}</pre>
						</details>
					)}
				</div>
			</LiquidGlass>
		</div>
	);
};

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

// ErrorBoundary Wrapper Class
class ErrorBoundary extends React.Component<
	{
		FallbackComponent: React.ComponentType<ErrorBoundaryFallbackProps>;
		onReset?: () => void;
		children?: React.ReactNode;
	},
	{ error: Error | null }
> {
	override state: { error: Error | null } = { error: null };
	static getDerivedStateFromError(error: unknown) {
		// Use globalThis.Error to avoid conflict with exported Error alias
		const NativeError = globalThis.Error;
		return {
			error: error instanceof NativeError ? error : new NativeError(String(error)),
		};
	}
	reset = () => {
		this.setState({ error: null });
		this.props.onReset?.();
	};
	override render() {
		if (this.state.error) {
			const Fallback = this.props.FallbackComponent;
			return <Fallback error={this.state.error} resetErrorBoundary={this.reset} />;
		}
		return this.props.children;
	}
}

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
			<ErrorBoundary FallbackComponent={ErrorBoundaryFallback} onReset={onRetry as () => void}>
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
