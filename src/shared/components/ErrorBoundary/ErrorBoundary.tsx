import type React from "react";
import { Component, type ReactNode } from "react";
import { ErrorManager } from "../../services/errorManager";
import styles from "./ErrorBoundary.module.css";

interface Props {
	children: ReactNode;
	fallback?: React.ComponentType<ErrorFallbackProps>;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
	context?: string;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorId: string | null;
}

export interface ErrorFallbackProps {
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
}) => (
	<div className={styles.errorBoundary}>
		<div className={styles.errorContent}>
			<h2>Something went wrong</h2>
			<p>We encountered an unexpected error in {context}.</p>
			<details className={styles.errorDetails}>
				<summary>Error Details</summary>
				<p>
					<strong>ID:</strong> {errorId}
				</p>
				<p>
					<strong>Message:</strong> {error?.message}
				</p>
			</details>
			<button onClick={resetError} className={styles.retryButton}>
				Try Again
			</button>
		</div>
	</div>
);

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null, errorId: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error, errorId: null };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
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

	render() {
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
