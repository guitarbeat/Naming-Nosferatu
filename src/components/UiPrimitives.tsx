import { Loader2, X } from "lucide-react";
import type { ReactNode } from "react";
import React, { Component, memo, useState } from "react";
import {
	CAT_IMAGES,
	cn,
	ErrorManager,
	FALLBACK_CAT_IMAGE,
	FALLBACK_CAT_SVG,
	handleImgError,
} from "@/lib/utils";

type ButtonVariant = "primary" | "danger" | "ghost" | "outline" | "flat" | "glass";
type ButtonSize = "small" | "medium" | "large" | "icon";

const baseButtonClass =
	"inline-flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0 font-medium tracking-wide rounded-full transition-transform transition-opacity duration-200 ease-spring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 select-none";

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"bg-primary text-primary-foreground shadow-sm hover:brightness-105 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.96] border-b-2 border-primary/25",
	danger:
		"bg-destructive text-destructive-foreground shadow-sm hover:brightness-105 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.96] border-b-2 border-destructive/30",
	ghost: "text-foreground/80 hover:bg-accent/20 hover:text-accent-foreground active:bg-accent/30",
	outline:
		"border border-border/80 bg-white/40 dark:bg-white/5 text-foreground shadow-xs hover:bg-accent/20 hover:border-accent hover:text-accent-foreground motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.96] backdrop-blur-sm",
	flat: "text-foreground/80 hover:bg-accent/30 active:bg-accent/50",
	glass:
		"border border-white/40 bg-white/25 dark:bg-white/10 text-foreground backdrop-blur-md hover:bg-white/40 hover:border-white/60 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.96]",
};

const sizeClasses: Record<ButtonSize, string> = {
	small: "h-9 px-4 text-xs [&_svg]:size-3.5 min-h-[40px]",
	medium: "h-11 px-6 text-sm [&_svg]:size-4 min-h-[44px]",
	large: "h-13 px-8 text-base font-bold [&_svg]:size-5 min-h-[48px]",
	icon: "h-10 w-10 p-0 [&_svg]:size-4 min-h-[40px] min-w-[40px]",
};

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	type?: "button" | "submit" | "reset";
	iconOnly?: boolean;
}

export const Button = memo(function Button({
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
}: ButtonProps) {
	const finalSize = iconOnly ? "icon" : size;
	return (
		<button
			type={type}
			disabled={disabled || loading}
			className={cn(baseButtonClass, variantClasses[variant], sizeClasses[finalSize], className)}
			onClick={(e) => {
				if (disabled || loading) e.preventDefault();
				else onClick?.(e);
			}}
			title={iconOnly && !title && ariaLabel ? ariaLabel : title}
			aria-label={ariaLabel}
			{...rest}
		>
			{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
			{(!iconOnly || !loading) && children}
		</button>
	);
});

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode;
	variant?: "default" | "filled" | "glass";
	padding?: "none" | "medium";
	shadow?: "medium" | "large";
}

export const Card = memo(
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
		) => (
			<div
				ref={ref}
				className={cn(
					"relative flex flex-col overflow-hidden rounded-[2rem] transition-all duration-200",
					variant === "filled"
						? "bg-primary/5 border-none"
						: variant === "glass"
							? "glass-surface glass-surface--fallback border border-white/25 shadow-lg"
							: "bg-card/85 backdrop-blur-xl border border-border/50 dark:border-white/10",
					padding === "none" ? "p-0" : "p-5",
					shadow === "large" ? "shadow-lg" : "shadow-sm",
					className,
				)}
				{...props}
			>
				<div className="relative z-10 h-full">{children}</div>
			</div>
		),
	),
);
Card.displayName = "Card";

export interface CatImageProps {
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

export function CatImage({
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

	return (
		<div
			className={containerClassName}
			style={{ ...containerStyle, "--bg-image": `url(${currentSrc})` } as React.CSSProperties}
		>
			<img
				src={currentSrc}
				alt={hasError || svgFallback ? "Fallback cat picture" : alt}
				className={imageClassName}
				loading={loading}
				decoding={decoding}
				onLoad={onLoad}
				onError={(e) => {
					if (!hasError && src !== fallbackUrl) setHasError(true);
					else if (!svgFallback) setSvgFallback(true);
					onError?.(e);
				}}
				{...(currentSrc.startsWith("/") ? {} : { crossOrigin: "anonymous" as const })}
			/>
		</div>
	);
}

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
	<div className="mx-auto my-8 flex min-h-[40vh] w-full max-w-xl items-center justify-center px-4">
		<div className="w-full rounded-2xl border border-destructive/30 bg-card/90 p-6 text-center shadow-xl backdrop-blur-md">
			<h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
			<p className="mt-2 text-sm text-muted-foreground">{context} could not finish loading.</p>
			<p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
				{error?.message || "An unexpected error occurred."}
			</p>
			{errorId ? (
				<p className="mt-2 font-mono text-xs text-muted-foreground">ID: {errorId}</p>
			) : null}
			<div className="mt-5 flex flex-wrap justify-center gap-3">
				<Button onClick={resetError} size="small" variant="primary">
					Try again
				</Button>
			</div>
		</div>
	</div>
);

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
		const formatted = ErrorManager.handleError(error, context, {
			componentStack: errorInfo.componentStack,
			isCritical: true,
		});
		this.setState({ errorId: formatted ? formatted.id : null });
		onError?.(error, errorInfo);
	}

	resetError = () => this.setState({ hasError: false, error: null, errorId: null });

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

export const ErrorInline: React.FC<{
	error: { message?: string } | string | unknown;
	onDismiss?: () => void;
	className?: string;
}> = ({ error, onDismiss, className = "" }) => {
	if (!error) return null;
	const msg =
		typeof error === "string"
			? error
			: (error as { message?: string })?.message || "An unexpected error occurred";
	return (
		<div
			className={cn(
				"flex items-start gap-3 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-foreground text-sm shadow-xs backdrop-blur-sm",
				className,
			)}
			role="alert"
		>
			<span className="font-bold text-destructive select-none">!</span>
			<span className="flex-1 font-medium leading-tight">{msg}</span>
			{onDismiss && (
				<button
					onClick={onDismiss}
					className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

interface LoadingProps {
	variant?: "spinner" | "skeleton" | "card-skeleton" | "cat-gif";
	text?: string;
	className?: string;
	height?: string | number;
}

export const Loading: React.FC<LoadingProps> = memo(
	({ variant = "spinner", text, className = "", height = 20 }) => {
		if (variant === "skeleton") {
			return (
				<div
					role="status"
					aria-label="Loading"
					aria-busy="true"
					aria-live="polite"
					className={cn(
						"animate-pulse rounded-2xl bg-foreground/5 border border-border/30",
						className,
					)}
					style={{ width: "100%", height: typeof height === "number" ? `${height}px` : height }}
				/>
			);
		}
		if (variant === "cat-gif") {
			return (
				<div
					className={cn("flex flex-col items-center justify-center gap-3 p-4", className)}
					role="status"
					aria-label="Loading"
					aria-busy="true"
					aria-live="polite"
				>
					<img
						src={FALLBACK_CAT_IMAGE}
						alt=""
						aria-hidden="true"
						className="h-24 w-auto select-none object-contain opacity-90 motion-safe:animate-pulse"
						onError={handleImgError}
					/>
					{text && <p className="text-xs font-bold tracking-wide text-muted-foreground">{text}</p>}
				</div>
			);
		}
		return (
			<div
				className={cn("flex flex-col items-center justify-center gap-3 p-4", className)}
				role="status"
				aria-label="Loading"
				aria-busy="true"
				aria-live="polite"
			>
				<div
					className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
					aria-hidden={true}
				/>
				{text ? (
					<p className="mt-1 text-sm font-medium text-muted-foreground">{text}</p>
				) : (
					<span className="sr-only">Loading...</span>
				)}
			</div>
		);
	},
);
Loading.displayName = "Loading";

export function RouteFallback({ text }: { text: string }) {
	return <Loading variant="spinner" text={text} className="min-h-[80dvh]" />;
}
