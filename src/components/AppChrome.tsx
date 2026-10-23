import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Info, Loader2, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import React, {
	Component,
	createContext,
	memo,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Iridescence } from "@/components/VisualEffects";
import {
	CAT_IMAGES,
	cn,
	ErrorManager,
	FALLBACK_CAT_IMAGE,
	FALLBACK_CAT_SVG,
	handleImgError,
	scaleFadeMotionPreset,
} from "@/lib/utils";
import useAppStore from "@/store";

/* ==========================================================================
   BUTTON COMPONENT
   ========================================================================== */

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

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	type?: "button" | "submit" | "reset";
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

/* ==========================================================================
   CARD COMPONENT
   ========================================================================== */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
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

/* ==========================================================================
   CAT IMAGE COMPONENT
   ========================================================================== */

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

/* ==========================================================================
   ERROR BOUNDARY & INLINE ERROR COMPONENTS
   ========================================================================== */

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

const ErrorInline: React.FC<{
	error: AppError | string | unknown;
	onDismiss?: () => void;
	className?: string;
}> = ({ error, onDismiss, className = "" }) => {
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

/* ==========================================================================
   LOADING & ROUTE FALLBACK COMPONENTS
   ========================================================================== */

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

function SkeletonBlock({
	className,
	style,
	role,
	"aria-label": ariaLabel,
	"aria-busy": ariaBusy,
	"aria-live": ariaLive,
}: {
	className?: string;
	style?: React.CSSProperties;
	role?: string;
	"aria-label"?: string;
	"aria-busy"?: "true" | "false" | boolean;
	"aria-live"?: "polite" | "assertive" | "off";
}) {
	return (
		<div
			className={cn(
				"animate-pulse rounded-lg bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.12),rgba(255,255,255,0.04))] bg-[length:200%_100%]",
				className,
			)}
			style={style}
			role={role}
			aria-label={ariaLabel}
			aria-busy={ariaBusy}
			aria-live={ariaLive}
			aria-hidden={role ? undefined : true}
		/>
	);
}

export const Loading: React.FC<LoadingProps> = memo(
	({ variant = "spinner", text, className = "", height = 20 }) => {
		const containerClasses = cn("flex flex-col items-center justify-center gap-3 p-4", className);

		if (variant === "skeleton") {
			return (
				<SkeletonBlock
					role="status"
					aria-label="Loading"
					aria-busy="true"
					aria-live="polite"
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
					role="status"
					aria-label="Loading"
					aria-busy="true"
					aria-live="polite"
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
				<div
					className={containerClasses}
					role="status"
					aria-label="Loading"
					aria-busy="true"
					aria-live="polite"
				>
					<img
						src={FALLBACK_CAT_IMAGE}
						alt=""
						aria-hidden="true"
						className="h-28 w-auto select-none object-contain opacity-90 motion-safe:animate-pulse"
						onError={handleImgError}
					/>
					{text && <p className="text-[12px] font-bold tracking-wide text-foreground/50">{text}</p>}
				</div>
			);
		}

		return (
			<div
				className={containerClasses}
				role="status"
				aria-label="Loading"
				aria-busy="true"
				aria-live="polite"
			>
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
	return <Loading variant="spinner" text={text} className="min-h-[82dvh]" />;
}

/* ==========================================================================
   TOAST PROVIDER & HOOK
   ========================================================================== */

const DEFAULT_TOAST_DURATION_MS = 5000;
const DEFAULT_MAX_TOASTS = 5;

type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
	duration?: number;
	autoDismiss?: boolean;
}

interface ToastItem {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
	autoDismiss: boolean;
	createdAt: number;
}

export interface ToastContextValue {
	toasts: ToastItem[];
	showToast: (message: string, type?: ToastType, options?: ToastOptions) => string;
	hideToast: (id: string) => void;
	clearToasts: () => void;
	showSuccess: (message: string, options?: ToastOptions) => string;
	showError: (message: string, options?: ToastOptions) => string;
	showInfo: (message: string, options?: ToastOptions) => string;
	showWarning: (message: string, options?: ToastOptions) => string;
}

type ToastPosition =
	| "top-left"
	| "top-center"
	| "top-right"
	| "bottom-left"
	| "bottom-center"
	| "bottom-right";

const POSITION_CLASSES: Record<ToastPosition, string> = {
	"top-left": "top-4 left-4 items-start",
	"top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
	"top-right": "top-16 right-4 sm:top-18 sm:right-6 items-end",
	"bottom-left": "bottom-4 left-4 items-start",
	"bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
	"bottom-right": "bottom-4 right-4 items-end",
};

const TYPE_STYLES: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
	success: { bg: "bg-chart-2", icon: <CheckCircle className="size-5" /> },
	error: { bg: "bg-destructive", icon: <XCircle className="size-5" /> },
	warning: {
		bg: "bg-chart-4 text-foreground",
		icon: <AlertTriangle className="size-5" />,
	},
	info: { bg: "bg-primary", icon: <Info className="size-5" /> },
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error(
			"useToast must be used within <Providers>. Wrap your component tree with <Providers> in main.tsx.",
		);
	}
	return context;
}

function ToastMessage({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
	const style = TYPE_STYLES[toast.type];
	return (
		<div
			className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${style.bg}`}
			role="alert"
		>
			<span className="text-base leading-none" aria-hidden={true}>
				{style.icon}
			</span>
			<span className="flex-1">{toast.message}</span>
			<button
				onClick={() => onDismiss(toast.id)}
				className="ml-2 -mr-2 rounded-md p-1.5 opacity-70 transition-all hover:opacity-100 hover:bg-black/10 active:scale-95"
				aria-label="Dismiss"
				title="Dismiss"
				type="button"
			>
				<X className="size-4" />
			</button>
		</div>
	);
}

function ToastContainer({
	toasts,
	onDismiss,
	position,
}: {
	toasts: ToastItem[];
	onDismiss: (id: string) => void;
	position: ToastPosition;
}) {
	if (toasts.length === 0) {
		return null;
	}

	return (
		<section
			className={`fixed z-[9999] flex flex-col gap-2 ${POSITION_CLASSES[position]}`}
			aria-live="polite"
			aria-label="Notifications"
		>
			{toasts.map((toast) => (
				<ToastMessage key={toast.id} toast={toast} onDismiss={onDismiss} />
			))}
		</section>
	);
}

function useToastProvider(
	maxToasts: number,
	defaultDuration: number,
): ToastContextValue & {
	toastList: ToastItem[];
	dismiss: (id: string) => void;
} {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	const toastCounter = useRef(0);

	const scheduleAutoDismiss = useCallback((id: string, duration: number) => {
		const timer = setTimeout(() => {
			setToasts((previous) => previous.filter((toast) => toast.id !== id));
			timers.current.delete(id);
		}, duration);
		timers.current.set(id, timer);
	}, []);

	useEffect(() => {
		return () => {
			for (const timer of timers.current.values()) {
				clearTimeout(timer);
			}
			timers.current.clear();
		};
	}, []);

	const showToast = useCallback(
		(message: string, type: ToastType = "info", options: ToastOptions = {}): string => {
			const id = `toast-${++toastCounter.current}`;
			const duration = options.duration ?? defaultDuration;
			const autoDismiss = options.autoDismiss ?? true;

			const item: ToastItem = {
				id,
				message,
				type,
				duration,
				autoDismiss,
				createdAt: Date.now(),
			};

			setToasts((previous) => [item, ...previous].slice(0, maxToasts));

			if (autoDismiss) {
				scheduleAutoDismiss(id, duration);
			}

			return id;
		},
		[defaultDuration, maxToasts, scheduleAutoDismiss],
	);

	const hideToast = useCallback((id: string) => {
		setToasts((previous) => previous.filter((toast) => toast.id !== id));
		const timer = timers.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.current.delete(id);
		}
	}, []);

	const clearToasts = useCallback(() => {
		setToasts([]);
		for (const timer of timers.current.values()) {
			clearTimeout(timer);
		}
		timers.current.clear();
	}, []);

	const showSuccess = useCallback(
		(message: string, options?: ToastOptions) => showToast(message, "success", options),
		[showToast],
	);
	const showError = useCallback(
		(message: string, options?: ToastOptions) => showToast(message, "error", options),
		[showToast],
	);
	const showInfo = useCallback(
		(message: string, options?: ToastOptions) => showToast(message, "info", options),
		[showToast],
	);
	const showWarning = useCallback(
		(message: string, options?: ToastOptions) => showToast(message, "warning", options),
		[showToast],
	);

	return useMemo(
		() => ({
			toasts,
			showToast,
			hideToast,
			clearToasts,
			showSuccess,
			showError,
			showInfo,
			showWarning,
			toastList: toasts,
			dismiss: hideToast,
		}),
		[toasts, showToast, hideToast, clearToasts, showSuccess, showError, showInfo, showWarning],
	);
}

export interface ProvidersProps {
	children: ReactNode;
	toastMaxToasts?: number;
	toastDefaultDuration?: number;
	toastPosition?: ToastPosition;
}

export function Providers({
	children,
	toastMaxToasts = DEFAULT_MAX_TOASTS,
	toastDefaultDuration = DEFAULT_TOAST_DURATION_MS,
	toastPosition = "top-right",
}: ProvidersProps) {
	const { toastList, dismiss, ...value } = useToastProvider(toastMaxToasts, toastDefaultDuration);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastContainer toasts={toastList} onDismiss={dismiss} position={toastPosition} />
		</ToastContext.Provider>
	);
}

/* ==========================================================================
   APP BOOT SCREEN
   ========================================================================== */

export function AppBootScreen({
	message = "Preparing the tournament...",
	visible = true,
}: {
	message?: string;
	visible?: boolean;
}) {
	if (!visible) {
		return null;
	}

	return (
		<div
			data-testid="boot-screen"
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground"
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			<motion.div
				{...scaleFadeMotionPreset}
				className="flex flex-col items-center space-y-6 px-4 text-center max-w-md"
			>
				<div className="relative flex h-16 w-16 items-center justify-center" aria-hidden="true">
					<div className="absolute h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute h-16 w-16 rounded-full border-4 border-t-primary animate-spin" />
				</div>

				<div className="space-y-2">
					<h2 className="text-xl font-bold tracking-tight text-foreground">{message}</h2>
					<p className="text-sm text-muted-foreground animate-pulse">
						Please wait a moment while we load the application context...
					</p>
				</div>
			</motion.div>
		</div>
	);
}

/* ==========================================================================
   GLOBAL ERROR DISPLAY
   ========================================================================== */

export const GlobalErrorDisplay = memo(function GlobalErrorDisplay() {
	const currentError = useAppStore((s) => s.errors.current);
	const errorActions = useAppStore((s) => s.errorActions);

	const handleDismissError = useCallback(() => {
		errorActions.clearError();
	}, [errorActions]);

	if (!currentError) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 w-full max-w-4xl px-3 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
			<ErrorComponent error={String(currentError)} onDismiss={handleDismissError} />
		</div>
	);
});

/* ==========================================================================
   GLOBAL LOADING OVERLAY
   ========================================================================== */

export const GlobalLoadingOverlay = memo(function GlobalLoadingOverlay() {
	const isLoading = useAppStore((s) => s.tournament.isLoading);

	if (!isLoading) {
		return null;
	}

	return (
		<div className="global-loading-overlay" role="status" aria-live="polite" aria-busy="true">
			<Loading variant="spinner" text="Initializing Tournament..." />
		</div>
	);
});

/* ==========================================================================
   SKIP TO MAIN BUTTON
   ========================================================================== */

export const SkipToMainButton = memo(function SkipToMainButton() {
	const handleSkipToMain = useCallback(() => {
		const main = document.getElementById("main-content");
		if (!main) {
			return;
		}
		main.focus();
		main.scrollIntoView({ behavior: "smooth" });
	}, []);

	return (
		<button
			type="button"
			className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:p-4 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring focus:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
			onClick={handleSkipToMain}
		>
			Skip to main content
		</button>
	);
});

/* ==========================================================================
   PWA INSTALL PROMPT
   ========================================================================== */

const INSTALL_DESCRIPTION =
	"Add Name Nosferatu to your home screen for quick access to cat name tournaments and your rankings.";
const PWA_TINT = "hsl(152, 26%, 42%)";

export function PwaInstallPrompt() {
	const installRef = React.useRef<PWAInstallElement | null>(null);

	useEffect(() => {
		const element = installRef.current;
		if (!element) {
			return;
		}

		element.manifestUrl = "/manifest.json";
		element.useLocalStorage = true;
		element.installDescription = INSTALL_DESCRIPTION;
		element.styles = { "--tint-color": PWA_TINT };

		const deferred = window.__deferredPwaPrompt;
		if (deferred) {
			element.externalPromptEvent = deferred;
		}
	}, []);

	return <pwa-install ref={installRef} />;
}

/* ==========================================================================
   APP LAYOUT SHELL
   ========================================================================== */

const IRIDESCENCE_COLOR: [number, number, number] = [1, 1, 1];

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<ErrorBoundary context="Main Application Layout">
			<div className="app relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
				<Iridescence
					color={IRIDESCENCE_COLOR}
					speed={0.8}
					amplitude={0.08}
					mouseReact={true}
					className="fixed inset-0 z-0 opacity-100 pointer-events-none"
				/>
				<PwaInstallPrompt />
				<OfflineIndicator />
				<SkipToMainButton />
				<main
					id="main-content"
					className="app-main relative z-10 flex w-full flex-col pt-0"
					tabIndex={-1}
				>
					<GlobalErrorDisplay />
					<div className="app-main__content flex w-full flex-1 flex-col items-stretch">
						{children}
					</div>
					<GlobalLoadingOverlay />
				</main>
			</div>
		</ErrorBoundary>
	);
}
