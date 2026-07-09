import { X } from "lucide-react";
import React, { Component, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { ErrorManager } from "@/shared/services/errorManager";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: React.ComponentType<ErrorFallbackProps>;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
	context?: string;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorId: string | null;
}

interface ErrorFallbackProps {
	error: Error | null;
	errorId: string | null;
	resetError: () => void;
	context: string;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
	error,
	errorId,
	resetError,
	context,
}) => {
	const handleGoHome = () => {
		resetError();
		if (window.location.pathname === "/") {
			window.location.reload();
			return;
		}
		window.location.assign("/");
	};

	return (
		<div className="mx-auto my-8 flex min-h-[40vh] w-full max-w-xl items-center justify-center px-4">
			<div className="w-full rounded-lg border border-destructive/30 bg-background/80 p-6 text-center shadow-xl backdrop-blur">
				<h2 className="text-2xl font-bold text-foreground">
					Something went wrong
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					{context} could not finish loading.
				</p>
				<p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">
					{error?.message || "An unexpected error occurred."}
				</p>
				{errorId && (
					<p className="mt-2 font-mono text-xs text-muted-foreground">
						ID: {errorId}
					</p>
				)}
				<div className="mt-5 flex flex-wrap justify-center gap-3">
					<button
						onClick={resetError}
						className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
						type="button"
					>
						Try again
					</button>
					<button
						onClick={handleGoHome}
						className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
						type="button"
					>
						Go home
					</button>
				</div>
			</div>
		</div>
	);
};

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null, errorId: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error, errorId: null };
	}

	override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		const { onError, context = "React Component" } = this.props;

		const formattedError = ErrorManager.handleError(error, context, {
			componentStack: errorInfo.componentStack,
			isCritical: true,
		});

		this.setState({ errorId: formattedError.id });
		onError?.(error, errorInfo);
	}

	resetError = () => {
		this.setState({ hasError: false, error: null, errorId: null });
	};

	override render() {
		if (this.state.hasError) {
			const FallbackComponent = this.props.fallback || DefaultErrorFallback;
			return (
				<FallbackComponent
					error={this.state.error}
					errorId={this.state.errorId}
					resetError={this.resetError}
					context={this.props.context || "Application"}
				/>
			);
		}

		return this.props.children;
	}
}

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
	[key: string]: unknown;
}

interface ErrorProps {
	variant?: "boundary" | "inline";
	error?: AppError | string | unknown;
	onDismiss?: () => void;
	context?: string;
	className?: string;
	children?: React.ReactNode;
}

interface ErrorInlineProps {
	error: AppError | string | unknown;
	onDismiss?: () => void;
	className?: string;
}

const ErrorInline: React.FC<ErrorInlineProps> = ({
	error,
	onDismiss,
	className = "",
}) => {
	if (!error) {
		return null;
	}
	const msg =
		typeof error === "string" ? error : (error as AppError).message || "Error";
	return (
		<div
			className={cn(
				"flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-100 text-sm shadow-sm backdrop-blur-sm",
				className,
			)}
			role="alert"
		>
			<span className="text-lg leading-none select-none">!</span>
			<span className="flex-1 font-medium pt-0.5 leading-tight">{msg}</span>
			{onDismiss && (
				<button
					onClick={onDismiss}
					className="rounded-full p-1 text-yellow-100/70 transition-colors hover:bg-yellow-500/20 hover:text-yellow-50"
					aria-label="Dismiss error"
					title="Dismiss error"
					type="button"
				>
					<X size={14} />
				</button>
			)}
		</div>
	);
};

export const ErrorComponent: React.FC<ErrorProps> = ({
	variant = "inline",
	error,
	onDismiss,
	context,
	className = "",
	children,
}) => {
	if (variant === "boundary") {
		return (
			<ErrorBoundary context={context || "Component Boundary"}>
				{children}
			</ErrorBoundary>
		);
	}
	return (
		<ErrorInline error={error} onDismiss={onDismiss} className={className} />
	);
};

ErrorComponent.displayName = "ErrorComponent";
