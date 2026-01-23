import { Copy } from "lucide-react";
import type React from "react";
import { Component, type ReactNode, useState } from "react";
import { ErrorManager } from "@/services/errorManager";
import { cn } from "@/utils/cn";

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
}) => {
	const [copySuccess, setCopySuccess] = useState(false);

	const copyErrorToClipboard = async () => {
		const errorDetails = `
Error ID: ${errorId}
Context: ${context}
Message: ${error?.message || "Unknown error"}
Stack: ${error?.stack || "No stack trace available"}
Timestamp: ${new Date().toISOString()}
		`.trim();

		try {
			await navigator.clipboard.writeText(errorDetails);
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		} catch (err) {
			console.error("Failed to copy error details:", err);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center p-8 bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/10 text-center min-h-[50vh] w-full max-w-2xl mx-auto my-8 shadow-2xl">
			<div className="flex flex-col gap-6 w-full text-white items-center">
				<div className="space-y-2">
					<h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-600 bg-clip-text text-transparent">Something went wrong</h2>
					<p className="text-white/60">We encountered an unexpected error in <span className="font-mono text-white/80">{context}</span>.</p>
				</div>

				<details className="mt-2 text-left bg-black/40 p-4 rounded-xl text-xs font-mono w-full border border-white/5 overflow-hidden group">
					<summary className="cursor-pointer flex items-center justify-between text-yellow-500 font-bold p-2 hover:bg-white/5 rounded-lg transition-colors select-none">
						<span>Error Details</span>
						<button
							onClick={(e) => {
								e.stopPropagation();
								copyErrorToClipboard();
							}}
							className="flex items-center gap-1.5 text-white/40 hover:text-white px-2 py-1 rounded transition-colors group-open:text-white/60"
							title="Copy error details to clipboard"
							aria-label="Copy error details"
						>
							<Copy size={14} />
							{copySuccess && <span className="text-green-400 font-bold ml-1 animate-in fade-in zoom-in">Copied!</span>}
						</button>
					</summary>
					<div className="mt-4 space-y-3 pt-2 border-t border-white/5">
						<p className="flex gap-2 text-white/70">
							<strong className="text-white/40 min-w-[60px]">ID:</strong>
							<span className="font-mono text-blue-300">{errorId}</span>
						</p>
						<p className="flex gap-2 text-white/70">
							<strong className="text-white/40 min-w-[60px]">Message:</strong>
							<span className="text-red-300">{error?.message}</span>
						</p>
						{error?.stack && (
							<div className="flex flex-col gap-1 text-white/70">
								<strong className="text-white/40">Stack Trace:</strong>
								<pre className="text-[10px] leading-relaxed text-white/50 overflow-x-auto p-2 bg-black/20 rounded border border-white/5 custom-scrollbar">
									{error.stack}
								</pre>
							</div>
						)}
					</div>
				</details>

				<button
					onClick={resetError}
					className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 active:scale-95 transition-all duration-200"
				>
					Try Again
				</button>
			</div>
		</div>
	);
};

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null, errorId: null };
	}

	static getDerivedStateFromError(error: Error): State {
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
