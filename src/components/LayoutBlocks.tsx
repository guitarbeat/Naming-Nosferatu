import { Loader2, X } from "lucide-react";
import type { ReactNode } from "react";
import React, { Component, memo, useEffect, useState } from "react";
import { CAT_IMAGES, FALLBACK_CAT_IMAGE, FALLBACK_CAT_SVG } from "@/lib/constants";
import { cn, ErrorManager, handleImgError } from "@/lib/utils";

type ButtonVariant = "primary" | "danger" | "ghost" | "outline" | "flat" | "glass";
type ButtonSize = "small" | "medium" | "large" | "icon";

const baseButtonClass =
	"inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-medium tracking-wide rounded-full transition-transform transition-opacity duration-[300ms] ease-spring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 select-none";

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"bg-primary text-primary-foreground shadow-sm hover:brightness-110 motion-safe:hover:-translate-y-1 motion-safe:active:translate-y-0.5 motion-safe:active:scale-[0.93] border-b-4 border-primary/20",
	danger:
		"bg-destructive text-destructive-foreground shadow-sm hover:brightness-110 motion-safe:hover:-translate-y-1 motion-safe:active:translate-y-0.5 active:brightness-95 motion-safe:active:scale-[0.93] border-b-4 border-destructive/30",
	ghost: "text-foreground/80 hover:bg-accent/20 hover:text-accent-foreground active:bg-accent/30",
	outline:
		"border-2 border-border/80 bg-white/40 text-foreground shadow-sm hover:bg-accent/20 hover:border-accent hover:text-accent-foreground motion-safe:hover:-translate-y-1 motion-safe:active:translate-y-0.5 active:bg-accent/40 motion-safe:active:scale-[0.93] backdrop-blur-sm",
	flat: "text-foreground/80 hover:bg-accent/30 active:bg-accent/50",
	glass:
		"border-2 border-white/40 bg-white/20 text-foreground backdrop-blur-md hover:bg-white/40 hover:border-white/60 motion-safe:hover:-translate-y-1 motion-safe:active:translate-y-0.5 active:bg-white/30 motion-safe:active:scale-[0.93]",
};

const sizeClasses: Record<ButtonSize, string> = {
	small: "h-9 px-4 sm:px-5 text-xs [&_svg]:size-3.5 min-h-[44px] sm:min-h-0",
	medium: "h-11 px-6 sm:px-8 text-sm [&_svg]:size-4 min-h-[44px] sm:min-h-0",
	large: "h-14 px-8 sm:px-10 text-base font-bold [&_svg]:size-5 min-h-[44px]",
	icon: "h-11 w-11 p-0 [&_svg]:size-4 min-h-[44px] min-w-[44px]",
};

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
	children: React.ReactNode;
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	loading?: boolean;
	type?: "button" | "submit" | "reset";
	className?: string;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	iconOnly?: boolean;
}

const ButtonComponent = ({
	children,
	variant = "primary",
	size = "medium",
	disabled = false,
	loading = false,
	type = "button",
	className = "",
	onClick,
	iconOnly = false,
	title,
	"aria-label": ariaLabel,
	...rest
}: ButtonProps) => {
	const finalSize = iconOnly ? "icon" : size;

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (disabled || loading) {
			event.preventDefault();
			return;
		}
		onClick?.(event);
	};

	return (
		<button
			type={type}
			disabled={disabled || loading}
			className={cn(baseButtonClass, variantClasses[variant], sizeClasses[finalSize], className)}
			onClick={handleClick}
			title={iconOnly && !title && ariaLabel ? ariaLabel : title}
			aria-label={ariaLabel}
			{...rest}
		>
			{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
			{!iconOnly && children}
			{iconOnly && !loading && children}
		</button>
	);
};

ButtonComponent.displayName = "Button";

export const Button = memo(ButtonComponent);

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode;
	variant?: "default" | "filled" | "glass";
	padding?: "none" | "medium";
	shadow?: "medium" | "large";
}

const CardBase = memo(
	React.forwardRef<HTMLDivElement, CardProps>(
		(
			{
				children,
				className = "",
				variant = "default",
				padding = "medium",
				shadow = "medium",
				...props
			},
			ref,
		) => {
			const finalClasses = cn(
				"relative flex flex-col overflow-hidden rounded-[2rem] transition-all duration-300",
				variant === "filled"
					? "bg-primary/5 border-none"
					: variant === "glass"
						? "glass-surface glass-surface--fallback border border-white/25 shadow-lg"
						: "bg-card/85 backdrop-blur-xl border border-border/50 dark:border-white/10",
				padding === "none" ? "p-0" : "p-5",
				shadow === "large" ? "shadow-lg" : "shadow-sm",
				className,
			);

			return (
				<div ref={ref} className={finalClasses} {...props}>
					<div className="relative z-10 h-full">{children}</div>
				</div>
			);
		},
	),
);

CardBase.displayName = "Card";

export const Card = CardBase;

interface CatImageProps {
	src?: string;
	alt?: string;
	containerClassName?: string;
	imageClassName?: string;
	loading?: "lazy" | "eager";
	decoding?: "async" | "auto" | "sync";
	containerStyle?: React.CSSProperties;
	onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
	onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

function CatImage({
	src,
	alt = "Cat picture",
	containerClassName = "",
	imageClassName = "",
	loading = "lazy",
	decoding = "async",
	containerStyle,
	onLoad,
	onError,
}: CatImageProps) {
	const [hasError, setHasError] = useState(false);
	const [svgFallback, setSvgFallback] = useState(false);
	const fallbackUrl = CAT_IMAGES[0] ?? FALLBACK_CAT_IMAGE;

	const currentSrc = svgFallback ? FALLBACK_CAT_SVG : hasError || !src ? fallbackUrl : src;
	const isLocalAsset = currentSrc.startsWith("/");

	const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
		if (!hasError && src !== fallbackUrl) {
			setHasError(true);
		} else if (!svgFallback) {
			setSvgFallback(true);
		}
		onError?.(event);
	};

	const combinedStyle = {
		...containerStyle,
		"--bg-image": `url(${currentSrc})`,
	} as React.CSSProperties;

	return (
		<div className={containerClassName} style={combinedStyle}>
			<img
				src={currentSrc}
				alt={hasError || svgFallback ? "Fallback cat picture" : alt}
				className={imageClassName}
				loading={loading}
				decoding={decoding}
				onLoad={onLoad}
				onError={handleError}
				{...(isLocalAsset ? {} : { crossOrigin: "anonymous" as const })}
			/>
		</div>
	);
}

export { CatImage };

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

const handleGoHome = (resetError: () => void) => {
	resetError();
	if (window.location.pathname === "/") {
		window.location.reload();
		return;
	}
	window.location.assign("/");
};

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
	error,
	errorId,
	resetError,
	context,
}) => {
	return (
		<div className="mx-auto my-8 flex min-h-[40vh] w-full max-w-xl items-center justify-center px-4">
			<div className="w-full rounded-lg border border-destructive/30 bg-background/80 p-6 text-center shadow-xl backdrop-blur">
				<h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
				<p className="mt-2 text-sm text-muted-foreground">{context} could not finish loading.</p>
				<p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">
					{error?.message || "An unexpected error occurred."}
				</p>
				{errorId ? (
					<p className="mt-2 font-mono text-xs text-muted-foreground">ID: {errorId}</p>
				) : null}
				<div className="mt-5 flex flex-wrap justify-center gap-3">
					<button
						onClick={resetError}
						className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
						type="button"
					>
						Try again
					</button>
					<button
						onClick={() => handleGoHome(resetError)}
						className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						type="button"
					>
						Go home
					</button>
				</div>
			</div>
		</div>
	);
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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

		this.setState({ errorId: formattedError ? formattedError.id : null });
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

const ErrorInline: React.FC<ErrorInlineProps> = ({ error, onDismiss, className = "" }) => {
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
			<span className="text-lg leading-none select-none">!</span>
			<span className="flex-1 font-medium pt-0.5 leading-tight">{msg}</span>
			{onDismiss && (
				<button
					onClick={onDismiss}
					className="rounded-full p-1 text-yellow-100/70 transition-colors hover:bg-yellow-500/20 hover:text-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 cursor-pointer disabled:cursor-not-allowed"
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
		return <ErrorBoundary context={context || "Component Boundary"}>{children}</ErrorBoundary>;
	}
	return <ErrorInline error={error} onDismiss={onDismiss} className={className} />;
};

ErrorComponent.displayName = "ErrorComponent";

const LOADING_ASSET = "/assets/images/cats/cat.gif";

interface LoadingProps {
	variant?: "spinner" | "skeleton" | "card-skeleton" | "cat-gif";
	text?: string;
	className?: string;
	height?: string | number;
}

function SpinnerCircle({
	size = "medium",
	className,
}: {
	size?: "small" | "medium";
	className?: string;
}) {
	const dimensions = size === "small" ? "h-6 w-6 border-2" : "h-8 w-8 border-4";

	return (
		<div
			className={cn(
				"animate-spin rounded-full border-white/10 border-t-primary border-r-primary/60",
				dimensions,
				className,
			)}
			aria-hidden={true}
		/>
	);
}

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
	return (
		<div
			className={cn(
				"animate-pulse rounded-lg bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.12),rgba(255,255,255,0.04))] bg-[length:200%_100%]",
				className,
			)}
			style={style}
			aria-hidden={true}
		/>
	);
}

export const Loading: React.FC<LoadingProps> = memo(
	({ variant = "spinner", text, className = "", height = 20 }) => {
		const containerClasses = cn("flex flex-col items-center justify-center gap-3 p-4", className);

		if (variant === "skeleton") {
			return (
				<SkeletonBlock
					className={cn("rounded-lg", className)}
					style={{
						width: "100%",
						height: typeof height === "number" ? `${height}px` : height,
					}}
				/>
			);
		}

		if (variant === "card-skeleton") {
			return (
				<div
					className={cn(
						"flex flex-col gap-3 overflow-hidden rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm",
						className,
					)}
					style={{
						width: "100%",
						height: typeof height === "number" ? `${height}px` : height,
						minHeight: typeof height === "number" ? `${height}px` : "200px",
					}}
				>
					<div className="flex items-center gap-3">
						<SkeletonBlock className="h-10 w-10 rounded-full" />
						<div className="flex flex-1 flex-col gap-2">
							<SkeletonBlock className="h-4 w-3/4" />
							<SkeletonBlock className="h-3 w-1/2" />
						</div>
					</div>
					<SkeletonBlock className="min-h-[100px] w-full flex-1" />
					<div className="flex justify-end pt-2">
						<SkeletonBlock className="h-8 w-20" />
					</div>
					{text ? <div className="pt-2 text-center text-xs text-white/50">{text}</div> : null}
				</div>
			);
		}

		if (variant === "cat-gif") {
			return (
				<div className={containerClasses} role="status" aria-label="Loading">
					<img
						src={LOADING_ASSET}
						alt=""
						aria-hidden="true"
						className="h-44 w-auto select-none object-contain opacity-95 animate-bounce"
						onError={handleImgError}
					/>
					{text && <p className="text-[12px] font-bold tracking-wide text-foreground/50">{text}</p>}
				</div>
			);
		}

		return (
			<div className={containerClasses} role="status" aria-label="Loading">
				<SpinnerCircle />
				{text ? (
					<p className="mt-2 text-sm font-medium text-white/80">{text}</p>
				) : (
					<span className="sr-only">Loading...</span>
				)}
			</div>
		);
	},
);

Loading.displayName = "Loading";

export function OfflineIndicator() {
	const [isOnline, setIsOnline] = useState(
		typeof navigator === "undefined" ? true : navigator.onLine,
	);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	if (isOnline) {
		return null;
	}

	return (
		<div className="indicator" role="status" aria-live="polite">
			<div className="indicator-content">
				<span className="indicator-dot" />
				<span className="indicator-message">You are offline</span>
			</div>
		</div>
	);
}

export function RouteFallback({ text }: { text: string }) {
	return <Loading variant="cat-gif" text={text} className="min-h-[82dvh]" />;
}
