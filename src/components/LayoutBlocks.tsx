import { motion } from "framer-motion";

import {
	Award,
	Check,
	Crown,
	Flame,
	Loader2,
	LogOut,
	Pencil,
	Shield,
	Trophy,
	User,
	X,
	XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import React, {
	Component,
	forwardRef,
	memo,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { CAT_IMAGES, FALLBACK_CAT_IMAGE, FALLBACK_CAT_SVG } from "@/lib/constants";
import { cn, ErrorManager, handleImgError, hapticNavTap } from "@/lib/utils";
import useAppStore from "@/store";

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

interface BaseFieldProps {
	label?: string;
	error?: string | null;
	required?: boolean;
	className?: string;
}

const inputBaseStyles =
	"flex h-12 w-full rounded-full border border-white/30 dark:border-white/15 bg-white/50 dark:bg-black/40 backdrop-blur-md px-5 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-bold placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 text-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.06),0_2px_8px_rgba(31,38,135,0.04)] transition-[background-color,border-color,box-shadow,transform] duration-[300ms] ease-spring relative z-10 hover:border-primary/40 hover:bg-white/65 dark:hover:bg-black/50";

const errorStyles = "border-destructive focus-visible:ring-destructive";

interface FormFieldProps extends BaseFieldProps {
	children: React.ReactNode;
	id?: string;
	name?: string;
	disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
	id,
	name,
	label,
	error,
	required = false,
	disabled = false,
	children,
	className = "",
}) => {
	const generatedId = useId();
	const fieldId = id || (name ? `${name}-field` : `field-${generatedId}`);
	const errorId = error ? `${fieldId}-error` : undefined;

	return (
		<div className={cn("flex flex-col gap-2 w-full", className)}>
			{label && (
				<label
					htmlFor={fieldId}
					className={cn(
						"text-sm font-medium leading-none text-foreground ml-1 transition-opacity",
						disabled && "cursor-not-allowed opacity-50",
					)}
				>
					{label}
					{required ? <span className="text-destructive ml-1">*</span> : null}
				</label>
			)}
			{children}
			{error && errorId && (
				<div
					id={errorId}
					className="ml-1 text-xs font-medium text-destructive motion-safe:animate-[fadeIn_140ms_ease-out]"
					role="alert"
				>
					{error}
				</div>
			)}
		</div>
	);
};

FormField.displayName = "FormField";

interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">,
		BaseFieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, required, className = "", ...props }, ref) => {
		const internalId = useId();
		const id = props.id || internalId;
		const hasError = Boolean(error);
		const [_isFocused, setIsFocused] = useState(false);

		return (
			<FormField id={id} label={label} error={error} required={required} disabled={props.disabled}>
				<div className="relative isolate group">
					<input
						{...props}
						id={id}
						ref={ref}
						onFocus={(e) => {
							setIsFocused(true);
							props.onFocus?.(e);
						}}
						onBlur={(e) => {
							setIsFocused(false);
							props.onBlur?.(e);
						}}
						className={cn(inputBaseStyles, hasError && errorStyles, className)}
						aria-invalid={hasError || undefined}
						aria-describedby={hasError ? `${id}-error` : undefined}
					/>
					{hasError && (
						<span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-destructive pointer-events-none motion-safe:animate-[fadeIn_160ms_ease-out] z-20">
							<XCircle size={16} />
						</span>
					)}
				</div>
			</FormField>
		);
	},
);

Input.displayName = "Input";

interface TextareaProps
	extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">,
		BaseFieldProps {
	showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ label, error, required, value, showCount = false, className = "", ...props }, ref) => {
		const internalId = useId();
		const id = props.id || internalId;
		const hasError = Boolean(error);
		const [_isFocused, setIsFocused] = useState(false);

		const currentLength = String(value || "").length;
		const maxLength = props.maxLength;
		const countId = `${id}-count`;

		const describedBy = [
			hasError ? `${id}-error` : undefined,
			showCount && maxLength ? countId : undefined,
		]
			.filter(Boolean)
			.join(" ");

		return (
			<FormField id={id} label={label} error={error} required={required} disabled={props.disabled}>
				<div className="relative isolate group">
					<textarea
						{...props}
						id={id}
						ref={ref}
						value={value}
						onFocus={(e) => {
							setIsFocused(true);
							props.onFocus?.(e);
						}}
						onBlur={(e) => {
							setIsFocused(false);
							props.onBlur?.(e);
						}}
						className={cn(
							inputBaseStyles,
							"min-h-[80px] py-4 rounded-3xl",
							hasError && errorStyles,
							className,
						)}
						aria-invalid={hasError || undefined}
						aria-describedby={describedBy || undefined}
					/>
					{hasError && (
						<span className="absolute right-3.5 top-3 text-destructive pointer-events-none motion-safe:animate-[fadeIn_160ms_ease-out] z-20">
							<XCircle size={16} />
						</span>
					)}
					{showCount && maxLength && (
						<div
							id={countId}
							className={cn(
								"absolute bottom-3 right-3 text-xs z-20 transition-colors",
								currentLength >= maxLength
									? "text-destructive font-medium"
									: "text-muted-foreground",
							)}
						>
							{currentLength}/{maxLength}
						</div>
					)}
				</div>
			</FormField>
		);
	},
);

Textarea.displayName = "Textarea";

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

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
	title: string;
	open?: boolean;
	onClose: () => void;
	children: React.ReactNode;
	closeDisabled?: boolean;
	description?: string;
	hideTitle?: boolean;
}

const EXIT_DURATION_MS = 220;

function useModalAnimation(isOpenResolved: boolean) {
	const [isClosing, setIsClosing] = useState(false);
	const [shouldRender, setShouldRender] = useState(isOpenResolved);

	useEffect(() => {
		if (isOpenResolved) {
			setShouldRender(true);
			setIsClosing(false);
			return;
		}
		if (!shouldRender) {
			return;
		}
		setIsClosing(true);
		const timer = window.setTimeout(() => {
			setShouldRender(false);
			setIsClosing(false);
		}, EXIT_DURATION_MS);
		return () => window.clearTimeout(timer);
	}, [isOpenResolved, shouldRender]);

	return { isClosing, shouldRender };
}

interface ModalHeaderProps {
	title: string;
	hideTitle: boolean;
	requestClose: () => void;
	closeDisabled: boolean;
}

function ModalHeader({ title, hideTitle, requestClose, closeDisabled }: ModalHeaderProps) {
	const headerContent = (
		<>
			<h2
				id="modal-title"
				className={
					hideTitle ? "sr-only" : "text-base sm:text-lg font-bold text-foreground tracking-tight"
				}
			>
				{title}
			</h2>
			<button
				type="button"
				onClick={requestClose}
				disabled={closeDisabled}
				className={`inline-flex items-center justify-center size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
					hideTitle ? "absolute top-3.5 right-3.5 z-10" : ""
				}`}
				aria-label={`Close ${title.toLowerCase()}`}
				title={`Close ${title.toLowerCase()}`}
			>
				<X className="size-4" />
			</button>
		</>
	);

	if (hideTitle) {
		return headerContent;
	}

	return (
		<div className="flex items-center justify-between pb-3 mb-4 border-b border-border/30">
			{headerContent}
		</div>
	);
}

export function Modal({
	title,
	open,
	onClose,
	children,
	closeDisabled = false,
	description,
	hideTitle = false,
}: ModalProps) {
	const isOpenResolved = open ?? true;
	const { isClosing, shouldRender } = useModalAnimation(isOpenResolved);
	const dialogRef = useRef<HTMLDivElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);
	const hasCapturedFocusRef = useRef(false);
	const onCloseRef = useRef(onClose);

	// Keep onCloseRef always pointing to the latest onClose callback
	useEffect(() => {
		onCloseRef.current = onClose;
	});

	const requestClose = useCallback(() => {
		if (closeDisabled) {
			return;
		}
		onCloseRef.current();
	}, [closeDisabled]);

	// Auto-focus the dialog on mount and restore focus on unmount
	useEffect(() => {
		if (shouldRender && !isClosing) {
			// Only capture the trigger element on the initial open, not on rapid re-opens
			if (!hasCapturedFocusRef.current) {
				previousFocusRef.current = document.activeElement as HTMLElement | null;
				hasCapturedFocusRef.current = true;
			}
			// Use a small delay so the DOM is ready
			const timer = window.setTimeout(() => {
				dialogRef.current?.focus();
			}, 0);
			return () => window.clearTimeout(timer);
		}

		if (!shouldRender) {
			if (previousFocusRef.current) {
				previousFocusRef.current.focus();
				previousFocusRef.current = null;
			}
			hasCapturedFocusRef.current = false;
		}
	}, [shouldRender, isClosing]);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>) => {
			if (event.key === "Escape" && !closeDisabled) {
				event.preventDefault();
				requestClose();
				return;
			}

			if (event.key !== "Tab") {
				return;
			}

			const dialog = dialogRef.current;
			if (!dialog) {
				return;
			}

			const focusableElements = Array.from(
				dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
			);
			if (focusableElements.length === 0) {
				event.preventDefault();
				return;
			}

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (event.shiftKey) {
				if (document.activeElement === firstElement || document.activeElement === dialog) {
					event.preventDefault();
					lastElement?.focus();
				}
			} else {
				if (document.activeElement === lastElement) {
					event.preventDefault();
					firstElement?.focus();
				}
			}
		},
		[closeDisabled, requestClose],
	);

	if (!shouldRender) {
		return null;
	}

	const surfaceAnimation = isClosing
		? "motion-safe:animate-[fadeIn_180ms_ease-out_reverse_forwards]"
		: "motion-safe:animate-[surface-enter_220ms_var(--ease-out-expo)]";
	const overlayAnimation = isClosing
		? "motion-safe:animate-[fadeIn_220ms_ease-out_reverse_forwards]"
		: "motion-safe:animate-[fadeIn_180ms_ease-out]";

	return (
		<div
			className={`fixed inset-0 z-modal-backdrop flex items-center justify-center px-4 pb-24 sm:pb-4 ${overlayAnimation}`}
		>
			<div
				className="absolute inset-0 bg-background/50 backdrop-blur-md transition-opacity"
				onClick={() => {
					if (!closeDisabled) {
						requestClose();
					}
				}}
				aria-hidden="true"
			/>

			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				aria-describedby={description ? "modal-description" : undefined}
				tabIndex={-1}
				onKeyDown={handleKeyDown}
				className={`relative z-modal-dialog w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/30 dark:border-white/15 bg-card/85 dark:bg-[#120f17]/85 backdrop-blur-2xl p-5 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),inset_0_1px_1px_0_rgba(255,255,255,0.35)] ${surfaceAnimation}`}
			>
				<ModalHeader
					title={title}
					hideTitle={hideTitle}
					requestClose={requestClose}
					closeDisabled={closeDisabled}
				/>

				{description && (
					<p id="modal-description" className="sr-only">
						{description}
					</p>
				)}

				{children}
			</div>
		</div>
	);
}

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

interface SectionProps {
	id?: string;
	children: ReactNode;
	maxWidth?: "md" | "xl" | "2xl" | "full";
	className?: string;
	separator?: boolean;
	fullpage?: boolean;
	ariaLabelledBy?: string;
	ariaLabel?: string;
}

const maxWidthClasses = {
	md: "app-section--max-md",
	xl: "app-section--max-xl",
	"2xl": "app-section--max-2xl",
	full: "w-full max-w-none px-0",
} as const;

export function Section({
	id,
	children,
	maxWidth = "2xl",
	className = "",
	separator = false,
	fullpage = false,
	ariaLabelledBy,
	ariaLabel,
}: SectionProps) {
	return (
		<section
			id={id}
			aria-labelledby={ariaLabelledBy}
			aria-label={ariaLabel}
			className={cn(
				"app-section",
				maxWidthClasses[maxWidth],
				separator && "app-section--separator",
				fullpage && "app-section--fullpage",
				className,
			)}
		>
			{children}
		</section>
	);
}

interface ProfileInnerProps {
	onLogin: (name: string) => Promise<boolean | undefined>;
	onLogout: () => Promise<void>;
}

export function ProfileInner({ onLogin, onLogout }: ProfileInnerProps) {
	const user = useAppStore((s) => s.user);
	const userActions = useAppStore((s) => s.userActions);
	const tournament = useAppStore((s) => s.tournament);
	const defaultAvatar = CAT_IMAGES[0] ?? FALLBACK_CAT_IMAGE;
	const nameInputRef = useRef<HTMLInputElement | null>(null);
	const [editedName, setEditedName] = useState(user.name || "");
	const [saveError, setSaveError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [isEditing, setIsEditing] = useState(!user.isLoggedIn);
	const [avatarSrc, setAvatarSrc] = useState(user.avatarUrl || defaultAvatar);
	const [showAvatarPicker, setShowAvatarPicker] = useState(false);
	const previousLoginStateRef = useRef(user.isLoggedIn);
	const previousEditingStateRef = useRef(isEditing);

	const ratingsCount = Object.keys(tournament.ratings || {}).length;
	const selectedCount = tournament.selectedNames?.length || 0;

	useEffect(() => {
		setEditedName(user.name || "");
		setAvatarSrc(user.avatarUrl || defaultAvatar);
	}, [user.name, user.avatarUrl, defaultAvatar]);

	useEffect(() => {
		const wasLoggedIn = previousLoginStateRef.current;
		if (!user.isLoggedIn) {
			setIsEditing(true);
		} else if (!wasLoggedIn) {
			setIsEditing(false);
		}
		previousLoginStateRef.current = user.isLoggedIn;
	}, [user.isLoggedIn]);

	useEffect(() => {
		const enteredEditingWhileLoggedIn =
			user.isLoggedIn && !previousEditingStateRef.current && isEditing;
		if (enteredEditingWhileLoggedIn) {
			nameInputRef.current?.focus();
		}
		previousEditingStateRef.current = isEditing;
	}, [isEditing, user.isLoggedIn]);

	const handleSelectAvatar = (url: string) => {
		setAvatarSrc(url);
		userActions.setUser({ avatarUrl: url });
		setShowAvatarPicker(false);
	};

	const handleSave = async () => {
		if (!editedName.trim()) {
			return;
		}
		setIsSaving(true);
		setSaveError(null);
		try {
			const didLogin = await onLogin(editedName.trim());
			if (didLogin === false) {
				setSaveError("We couldn't log you in with that name. Try again.");
				return;
			}
			setIsEditing(false);
		} catch (err) {
			ErrorManager.handleError(err, "ProfileInner.handleSave");
			setSaveError("We couldn't log you in right now. Try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await onLogout();
			setIsEditing(true);
		} catch (err) {
			ErrorManager.handleError(err, "ProfileInner.handleLogout");
		} finally {
			setIsLoggingOut(false);
		}
	};

	const handleNameChange = (val: string) => {
		setEditedName(val);
		if (saveError) {
			setSaveError(null);
		}
	};

	return (
		<div className="flex flex-col items-center gap-5 w-full p-2">
			{/* Avatar Showcase with interactive picker toggle */}
			<div className="flex flex-col items-center gap-2">
				<div className="relative group">
					<div
						className="absolute -inset-3 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"
						aria-hidden="true"
					/>
					<button
						type="button"
						onClick={() => setShowAvatarPicker((prev) => !prev)}
						className="relative size-24 rounded-full overflow-hidden ring-4 ring-primary/30 ring-offset-4 ring-offset-background bg-muted shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
						title="Click to choose avatar"
						aria-label="Change profile avatar"
						aria-expanded={showAvatarPicker}
						aria-controls="avatar-picker-tray"
					>
						<img
							src={avatarSrc}
							alt="Profile avatar"
							className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
							onError={() =>
								setAvatarSrc((prev) => (prev === defaultAvatar ? FALLBACK_CAT_SVG : defaultAvatar))
							}
						/>
						<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-bold tracking-wider uppercase">
							Change
						</div>
					</button>

					{user.isAdmin && (
						<div
							className="absolute -bottom-1 -right-1 size-7 rounded-full bg-chart-4 text-black flex items-center justify-center shadow-md ring-2 ring-background font-bold"
							title="Tournament Master Admin"
						>
							<Crown size={14} />
						</div>
					)}
				</div>

				<button
					type="button"
					onClick={() => setShowAvatarPicker((prev) => !prev)}
					className="text-xs text-primary/80 hover:text-primary font-medium transition-colors"
					aria-expanded={showAvatarPicker}
					aria-controls="avatar-picker-tray"
				>
					{showAvatarPicker ? "Hide Avatar Options" : "Choose Avatar"}
				</button>
			</div>

			{/* Avatar Selector Tray */}
			{showAvatarPicker && (
				<motion.div
					id="avatar-picker-tray"
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					className="w-full bg-card/75 border border-white/20 dark:border-white/10 rounded-[2rem] p-4 backdrop-blur-xl shadow-sm"
				>
					<p className="text-xs font-semibold text-muted-foreground tracking-wide text-center mb-3">
						Select Cat Persona
					</p>
					<div className="grid grid-cols-4 gap-3 sm:grid-cols-6 justify-items-center">
						{CAT_IMAGES.slice(0, 8).map((imgUrl, idx) => {
							const isSelected = avatarSrc === imgUrl;
							return (
								<button
									key={imgUrl || idx}
									type="button"
									onClick={() => handleSelectAvatar(imgUrl)}
									aria-pressed={isSelected}
									aria-label={`Select avatar ${idx + 1}`}
									className={cn(
										"relative size-12 rounded-full overflow-hidden border-2 transition-all duration-[300ms] ease-spring active:scale-95",
										isSelected
											? "border-primary ring-4 ring-primary/20 scale-105"
											: "border-border/60 opacity-70 hover:opacity-100 hover:scale-105",
									)}
								>
									<img
										src={imgUrl}
										alt={`Avatar option ${idx + 1}`}
										className="size-full object-cover"
										onError={handleImgError}
									/>
									{isSelected && (
										<div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
											<Check size={14} className="text-primary-foreground stroke-[3]" />
										</div>
									)}
								</button>
							);
						})}
					</div>
				</motion.div>
			)}

			{isEditing ? (
				<div className="w-full space-y-4">
					<div className="relative group">
						<User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-primary/60 pointer-events-none transition-colors group-focus-within:text-primary" />
						<Input
							ref={nameInputRef}
							type="text"
							value={editedName}
							onChange={(e) => handleNameChange(e.target.value)}
							placeholder="Enter your player handle..."
							aria-label="Player Handle"
							maxLength={32}
							onKeyDown={(e) => e.key === "Enter" && handleSave()}
							className="w-full h-12 pl-11 pr-4 text-sm"
						/>
					</div>
					{saveError && (
						<p role="alert" className="text-sm text-destructive text-center font-medium">
							{saveError}
						</p>
					)}
					<div className="flex gap-3">
						{user.isLoggedIn && (
							<Button
								type="button"
								variant="ghost"
								onClick={() => setIsEditing(false)}
								className="flex-1 rounded-full"
							>
								Cancel
							</Button>
						)}
						<Button
							type="submit"
							variant="primary"
							size="large"
							onClick={handleSave}
							disabled={!editedName.trim() || isSaving}
							loading={isSaving}
							className={`${user.isLoggedIn ? "flex-[2]" : "w-full"} rounded-full shadow-lg font-semibold`}
						>
							{user.isLoggedIn ? "Save Changes" : "Begin Battle Journey"}
						</Button>
					</div>
				</div>
			) : (
				<div className="w-full flex flex-col items-center gap-4">
					<div className="flex items-center justify-center gap-3 bg-card/85 dark:bg-black/40 py-3 px-6 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-xl w-full max-w-sm">
						<div className="flex flex-col items-center">
							<div className="flex items-center gap-2">
								<h3 className="text-2xl font-black tracking-tight text-foreground">{user.name}</h3>
								<button
									type="button"
									onClick={() => setIsEditing(true)}
									className="p-1.5 rounded-full text-primary hover:bg-primary/10 transition-colors"
									aria-label="Edit name"
									title="Edit name"
								>
									<Pencil size={15} />
								</button>
							</div>
							<div className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-primary tracking-wide uppercase">
								{user.isAdmin ? (
									<>
										<Shield size={12} className="text-chart-4" />
										<span className="text-chart-4">Arena Master</span>
									</>
								) : (
									<>
										<Award size={12} />
										<span>Feline Judge</span>
									</>
								)}
							</div>
						</div>
					</div>

					{/* Player Stats Snapshot */}
					<div className="grid grid-cols-2 gap-3 w-full max-w-sm">
						<div className="bg-card/85 dark:bg-black/40 border border-white/20 dark:border-white/10 rounded-[2rem] p-4 text-center backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform hover:-translate-y-1">
							<div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground mb-1">
								<Trophy size={13} className="text-primary" />
								<span>Selected Names</span>
							</div>
							<span className="text-2xl font-black text-foreground tabular-nums">
								{selectedCount}
							</span>
						</div>
						<div className="bg-card/85 dark:bg-black/40 border border-white/20 dark:border-white/10 rounded-[2rem] p-4 text-center backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform hover:-translate-y-1">
							<div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground mb-1">
								<Flame size={13} className="text-accent" />
								<span>Active Ratings</span>
							</div>
							<span className="text-2xl font-black text-foreground tabular-nums">
								{ratingsCount}
							</span>
						</div>
					</div>

					<button
						type="button"
						onClick={handleLogout}
						disabled={isLoggingOut}
						className="mt-2 flex items-center justify-center gap-2 w-full max-w-sm py-3 rounded-full text-sm font-semibold text-destructive border border-destructive/20 hover:bg-destructive/10 transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
					>
						<LogOut size={15} />
						{isLoggingOut ? "Logging out..." : "Log Out of Profile"}
					</button>
				</div>
			)}
		</div>
	);
}

interface MagicToggleOption<T extends string> {
	value: T;
	label: string;
	icon?: ReactNode;
}

interface MagicToggleProps<T extends string> {
	options: readonly MagicToggleOption<T>[];
	value: T;
	onChange: (value: T) => void;
	ariaLabel?: string;
	size?: "small" | "default";
}

export function MagicToggle<T extends string>({
	options,
	value,
	onChange,
	ariaLabel,
	size = "default",
}: MagicToggleProps<T>) {
	return (
		<div
			className={`relative inline-flex items-center w-full sm:w-auto ${size === "small" ? "p-1" : "p-1.5"} bg-card backdrop-blur-md rounded-full border border-border/60 shadow-sm`}
			role="tablist"
			aria-label={ariaLabel}
		>
			<motion.div
				className={`absolute ${size === "small" ? "inset-y-1" : "inset-y-1.5"} rounded-full bg-primary/20 border border-primary/30 pointer-events-none`}
				initial={false}
				animate={{
					x: `calc(${options.findIndex((o) => o.value === value) * 100}% + ${options.findIndex((o) => o.value === value) * (size === "small" ? 2 : 4)}px)`,
					width: `calc(${100 / options.length}% - ${size === "small" ? 2 : 4}px)`,
				}}
				transition={{
					type: "spring",
					stiffness: 500,
					damping: 20,
					mass: 0.8,
				}}
			/>
			{options.map((option) => {
				const isSelected = value === option.value;
				return (
					<button
						key={option.value}
						type="button"
						role="tab"
						aria-selected={isSelected}
						onClick={() => {
							hapticNavTap();
							onChange(option.value);
						}}
						className={`relative flex-1 ${size === "small" ? "px-3 py-1.5 text-xs" : "px-5 py-2 sm:px-8 sm:py-2.5 text-xs sm:text-sm"} font-bold tracking-wide transition-colors z-10 rounded-full ${
							isSelected
								? "text-primary"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/30"
						}`}
					>
						<div className="flex items-center justify-center gap-2">
							{option.icon && (
								<motion.span
									className="flex items-center justify-center"
									animate={{
										scale: isSelected ? [1, 1.15, 1] : 1,
									}}
									transition={{
										duration: 0.3,
										ease: "easeInOut",
									}}
								>
									{option.icon}
								</motion.span>
							)}
							<span>{option.label}</span>
						</div>
					</button>
				);
			})}
		</div>
	);
}

export function RouteFallback({ text }: { text: string }) {
	return <Loading variant="cat-gif" text={text} className="min-h-[82dvh]" />;
}
