/**
 * @module FluidNav
 * @description Fluid navigation component using NavButton for DRY code.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAppStore from "@/store/appStore";
import { BarChart3, CheckCircle, Layers, LayoutGrid, Lightbulb, Trophy, User } from "@/icons";
import { cn, hapticNavTap, hapticTournamentStart } from "@/utils/basic";
import { AnimatedNavButton, NavButton } from "./NavButton";

// Map nav keys to Section IDs
const keyToId: Record<string, string> = {
	pick: "pick",
	play: "play",
	analyze: "analysis",
	suggest: "suggest",
	profile: "profile",
};

type UnifiedButtonState = {
	label: string;
	icon: typeof CheckCircle;
	action: "scroll-top" | "start" | "navigate-pick";
	highlight: boolean;
	disabled: boolean;
};

/**
 * Get the unified button state based on current context
 */
const getUnifiedButtonState = (
	activeSection: string,
	selectedCount: number,
	isTournamentActive: boolean,
	isComplete: boolean,
): UnifiedButtonState => {
	const isOnPickSection = activeSection === "pick";
	const hasEnoughNames = selectedCount >= 2;

	// If tournament is complete, show Analyze
	if (isComplete) {
		return {
			label: "Analyze",
			icon: BarChart3,
			action: "navigate-pick",
			highlight: false,
			disabled: false,
		};
	}

	// If tournament is active, show Pick to go back
	if (isTournamentActive) {
		return {
			label: "Pick",
			icon: CheckCircle,
			action: "navigate-pick",
			highlight: false,
			disabled: false,
		};
	}

	// On pick section with enough names - ready to start
	if (isOnPickSection && hasEnoughNames) {
		return {
			label: `Start (${selectedCount})`,
			icon: Trophy,
			action: "start",
			highlight: true,
			disabled: false,
		};
	}

	// On pick section without enough names
	if (isOnPickSection) {
		return {
			label: "Pick",
			icon: CheckCircle,
			action: "scroll-top",
			highlight: false,
			disabled: false,
		};
	}

	// On other sections - show Start if ready, otherwise Pick
	if (hasEnoughNames) {
		return {
			label: `Start (${selectedCount})`,
			icon: Trophy,
			action: "start",
			highlight: true,
			disabled: false,
		};
	}

	return {
		label: "Pick",
		icon: CheckCircle,
		action: "navigate-pick",
		highlight: false,
		disabled: false,
	};
};

/**
 * Fluid Bottom Navigation Bar
 * Renders as a fluid, percentage-width floating dock on all screen sizes
 */
export function FluidNav() {
	const appStore = useAppStore();
	const navigate = useNavigate();
	const location = useLocation();
	const { tournament, tournamentActions, user, ui, uiActions } = appStore;
	const { selectedNames } = tournament;
	const { isLoggedIn, name: userName, avatarUrl } = user;
	const { isSwipeMode } = ui;
	const { setSwipeMode } = uiActions;
	const [activeSection, setActiveSection] = useState("pick");
	const isAnalysisRoute = location.pathname === "/analysis";

	const { isComplete, names: tournamentNames } = tournament;
	const isTournamentActive = !!tournamentNames;
	const selectedCount = selectedNames?.length || 0;

	// Get unified button state
	const buttonState = getUnifiedButtonState(
		activeSection,
		selectedCount,
		isTournamentActive,
		isComplete,
	);

	const handleStartTournament = () => {
		hapticTournamentStart();
		if (isAnalysisRoute) {
			navigate("/");
		}
		tournamentActions.resetTournament();
		tournamentActions.setLoading(true);
		if (selectedNames && selectedNames.length >= 2) {
			tournamentActions.setNames(selectedNames);
		}
		setTimeout(() => {
			tournamentActions.setLoading(false);
			const element = document.getElementById("play");
			element?.scrollIntoView({ behavior: "smooth" });
			setActiveSection("play");
		}, 100);
	};

	const handleUnifiedButtonClick = () => {
		if (navigator.vibrate) {
			navigator.vibrate(10);
		}

		switch (buttonState.action) {
			case "start":
				handleStartTournament();
				break;
			case "navigate-pick":
				if (isAnalysisRoute) {
					navigate("/");
				} else {
					document.getElementById("pick")?.scrollIntoView({ behavior: "smooth" });
				}
				setActiveSection("pick");
				break;
			case "scroll-top":
				document.getElementById("pick")?.scrollIntoView({ behavior: "smooth" });
				break;
		}
	};

	// Navigate or scroll to section
	const handleNavClick = (key: string) => {
		hapticNavTap();
		if (key === "analyze") {
			navigate("/analysis");
			setActiveSection("analysis");
			return;
		}
		if (key === "pick" && isAnalysisRoute) {
			navigate("/");
			setActiveSection("pick");
			return;
		}
		// Suggest and Profile only exist on home; navigate first if on analysis
		if ((key === "suggest" || key === "profile") && isAnalysisRoute) {
			const id = keyToId[key];
			navigate("/");
			setActiveSection(id);
			requestAnimationFrame(() => {
				setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
			});
			return;
		}
		const id = keyToId[key];
		if (id) {
			const element = document.getElementById(id);
			if (element) {
				element.scrollIntoView({ behavior: "smooth" });
				setActiveSection(id);
			}
		}
	};

	// Sync active section with route (analysis is route-based; home uses scroll)
	useEffect(() => {
		if (location.pathname === "/analysis") {
			setActiveSection("analysis");
		} else if (location.pathname === "/") {
			setActiveSection("pick");
		}
	}, [location.pathname]);

	// Track active section on scroll (home route only)
	useEffect(() => {
		if (location.pathname !== "/" || isAnalysisRoute) {
			return;
		}
		let rafId: number | null = null;
		const handleScroll = () => {
			if (rafId) {
				return;
			}
			rafId = requestAnimationFrame(() => {
				rafId = null;
				const sections = ["pick", "play", "suggest", "profile"];
				let current = "pick";
				let minDistance = Infinity;

				for (const id of sections) {
					const element = document.getElementById(id);
					if (element) {
						const rect = element.getBoundingClientRect();
						const distance = Math.abs(rect.top);
						if (distance < minDistance && distance < window.innerHeight * 0.6) {
							minDistance = distance;
							current = id;
						}
					}
				}

				setActiveSection(current);
			});
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();
		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (rafId) {
				cancelAnimationFrame(rafId);
			}
		};
	}, [location.pathname, isAnalysisRoute]);

	const isActive = (key: string) => {
		const targetId = keyToId[key];
		return activeSection === targetId;
	};

	const IconComponent = buttonState.icon;

	return (
		<motion.nav
			className={cn(
				"fixed z-[100] transition-all duration-500 ease-out",
				"flex items-center justify-evenly gap-4",
				"h-auto py-3 px-6",
				"bottom-0 left-1/2 -translate-x-1/2",
				"w-[95%]",
				"bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl",
			)}
			initial={{ y: 100, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ type: "spring", stiffness: 260, damping: 20 }}
		>
			{/* Unified Pick/Start Button - Uses AnimatedNavButton for pulse effect */}
			<AnimatedNavButton
				id="pick"
				icon={IconComponent}
				label={buttonState.label}
				isActive={isActive("pick")}
				onClick={handleUnifiedButtonClick}
				highlight={buttonState.highlight}
				disabled={buttonState.disabled}
				animateScale={buttonState.highlight}
				customIcon={
					<AnimatePresence mode="wait">
						<motion.div
							key={buttonState.icon.name}
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.8, opacity: 0 }}
						>
							<IconComponent
								className={cn("w-5 h-5", buttonState.highlight && "text-cyan-400")}
								aria-hidden={true}
							/>
						</motion.div>
					</AnimatePresence>
				}
			/>

			{/* View Mode Toggle - Shows when on pick section */}
			{isActive("pick") && !isTournamentActive && (
				<motion.button
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.8 }}
					type="button"
					onClick={() => setSwipeMode(!isSwipeMode)}
					className={cn(
						"flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all",
						"text-white/70 hover:text-white hover:bg-white/10",
						isSwipeMode && "bg-purple-500/20 text-purple-400",
					)}
					aria-label={isSwipeMode ? "Switch to grid view" : "Switch to swipe view"}
				>
					<AnimatePresence mode="wait">
						<motion.div
							key={isSwipeMode ? "swipe" : "grid"}
							initial={{ rotate: -90, opacity: 0 }}
							animate={{ rotate: 0, opacity: 1 }}
							exit={{ rotate: 90, opacity: 0 }}
							transition={{ duration: 0.15 }}
						>
							{isSwipeMode ? (
								<Layers className="w-5 h-5" aria-hidden={true} />
							) : (
								<LayoutGrid className="w-5 h-5" aria-hidden={true} />
							)}
						</motion.div>
					</AnimatePresence>
					<span className="text-[10px] font-medium">{isSwipeMode ? "Swipe" : "Grid"}</span>
				</motion.button>
			)}

			{/* Analyze Button - Only shows when tournament complete */}
			{isComplete && (
				<NavButton
					id="analyze"
					icon={BarChart3}
					label="Analyze"
					isActive={isActive("analyze")}
					onClick={() => handleNavClick("analyze")}
				/>
			)}

			{/* Suggest Button */}
			<NavButton
				id="suggest"
				icon={Lightbulb}
				label="Suggest"
				isActive={isActive("suggest")}
				onClick={() => handleNavClick("suggest")}
				ariaLabel="Suggest a name"
			/>

			{/* Profile/Login Button */}
			<NavButton
				id="profile"
				icon={User}
				label={isLoggedIn ? userName?.split(" ")[0] || "Profile" : "Login"}
				isActive={isActive("profile")}
				onClick={() => handleNavClick("profile")}
				ariaLabel={isLoggedIn ? "Edit profile" : "Login"}
				customIcon={
					isLoggedIn && avatarUrl ? (
						<div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
							<img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
						</div>
					) : (
						<User className={cn("w-5 h-5", isLoggedIn && "text-purple-400")} aria-hidden={true} />
					)
				}
				badge={
					isLoggedIn ? (
						<div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-black" />
					) : undefined
				}
			/>
		</motion.nav>
	);
}
/**
 * @module NavButton
 * @description Reusable navigation button component for FluidNav.
 * Extracts repeated button pattern into a single DRY component.
 */

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type React from "react";
import { cn } from "@/utils/basic";

interface NavButtonProps {
	/** Unique identifier for the button */
	id: string;
	/** Lucide icon component */
	icon: LucideIcon;
	/** Button label text */
	label: string;
	/** Whether this button is currently active */
	isActive: boolean;
	/** Click handler */
	onClick: () => void;
	/** Optional aria-label override */
	ariaLabel?: string;
	/** Additional className */
	className?: string;
	/** Whether button is highlighted (for special states) */
	highlight?: boolean;
	/** Whether button is disabled */
	disabled?: boolean;
	/** Custom content to render instead of icon (e.g., avatar) */
	customIcon?: React.ReactNode;
	/** Badge content (e.g., green dot for logged in) */
	badge?: React.ReactNode;
}

export function NavButton({
	id: _id,
	icon: Icon,
	label,
	isActive,
	onClick,
	ariaLabel,
	className,
	highlight = false,
	disabled = false,
	customIcon,
	badge,
}: NavButtonProps) {
	return (
		<button
			className={cn(
				"relative flex flex-col items-center justify-center flex-1 gap-1 p-2 rounded-xl transition-all",
				isActive && !highlight
					? "text-white bg-white/10"
					: "text-white/50 hover:text-white hover:bg-white/5",
				highlight && "text-cyan-400 bg-cyan-950/30 border border-cyan-500/30",
				disabled && "opacity-50 cursor-not-allowed",
				className,
			)}
			onClick={onClick}
			type="button"
			aria-label={ariaLabel || label}
			disabled={disabled}
		>
			<div className="relative">
				{customIcon || (
					<Icon className={cn("w-5 h-5", highlight && "text-cyan-400")} aria-hidden={true} />
				)}
				{badge}
			</div>
			<span className="text-[10px] font-medium tracking-wide truncate max-w-[60px]">{label}</span>
			{isActive && !highlight && (
				<motion.div
					layoutId="dockIndicator"
					className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/80 rounded-b-full"
				/>
			)}
		</button>
	);
}

/**
 * Animated version of NavButton with motion effects
 */
export function AnimatedNavButton({
	animateScale = false,
	...props
}: NavButtonProps & { animateScale?: boolean }) {
	const { icon: Icon, highlight, customIcon } = props;

	return (
		<motion.button
			className={cn(
				"relative flex flex-col items-center justify-center flex-1 gap-1 p-2 rounded-xl transition-all",
				props.isActive && !highlight
					? "text-white bg-white/10"
					: "text-white/50 hover:text-white hover:bg-white/5",
				highlight && "text-cyan-400 bg-cyan-950/30 border border-cyan-500/30",
				props.disabled && "opacity-50 cursor-not-allowed",
				props.className,
			)}
			onClick={props.onClick}
			type="button"
			disabled={props.disabled}
			animate={animateScale && highlight ? { scale: [1, 1.05, 1] } : {}}
			transition={animateScale && highlight ? { duration: 2, repeat: Infinity } : {}}
		>
			<div className="relative">
				{customIcon || (
					<Icon className={cn("w-5 h-5", highlight && "text-cyan-400")} aria-hidden={true} />
				)}
				{props.badge}
			</div>
			<span className="text-[10px] font-medium tracking-wide truncate max-w-[60px]">
				{props.label}
			</span>
			{props.isActive && !highlight && (
				<motion.div
					layoutId="dockIndicator"
					className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/80 rounded-b-full"
				/>
			)}
		</motion.button>
	);
}
/**
 * @module GlassPresets
 * @description Standardized glass configuration presets for LiquidGlass components.
 * Single source of truth for glassmorphism effects across the app.
 */

export interface GlassPreset {
	radius: number;
	frost: number;
	saturation: number;
	outputBlur: number;
	inputBlur?: number;
	scale?: number;
	width?: number;
	height?: number;
}

/**
 * Standardized glass presets for consistent glassmorphism effects
 */
export const GLASS_PRESETS = {
	/**
	 * Card preset - Used for ProfileSection, NameSuggestion, and similar containers
	 * Provides a subtle, elegant frosted glass effect
	 */
	card: {
		radius: 24,
		frost: 0.2,
		saturation: 1.1,
		outputBlur: 0.8,
	} satisfies GlassPreset,

	/**
	 * Toast preset - Used for notification toasts
	 * Lighter effect for quick-dismiss UI elements
	 */
	toast: {
		radius: 10,
		frost: 0.02,
		saturation: 1.0,
		outputBlur: 0.4,
		inputBlur: 6,
		scale: -100,
		width: 280,
		height: 60,
	} satisfies GlassPreset,

	/**
	 * Modal preset - Used for modal dialogs
	 * Stronger effect for overlay contexts
	 */
	modal: {
		radius: 20,
		frost: 0.08,
		saturation: 1.05,
		outputBlur: 1.2,
		inputBlur: 8,
		scale: -80,
		width: 500,
		height: 600,
	} satisfies GlassPreset,

	/**
	 * Panel preset - Used for larger containers and panels
	 * Balanced effect for content-heavy areas
	 */
	panel: {
		radius: 16,
		frost: 0.15,
		saturation: 1.08,
		outputBlur: 0.6,
	} satisfies GlassPreset,

	/**
	 * Subtle preset - Used for minimal glass effects
	 * Very light frosting for backgrounds
	 */
	subtle: {
		radius: 12,
		frost: 0.05,
		saturation: 1.02,
		outputBlur: 0.3,
	} satisfies GlassPreset,
} as const;

export type GlassPresetKey = keyof typeof GLASS_PRESETS;

/**
 * Get a glass preset by key with optional overrides
 */
export function getGlassPreset(key: GlassPresetKey, overrides?: Partial<GlassPreset>): GlassPreset {
	return { ...GLASS_PRESETS[key], ...overrides };
}
/**
 * @module FormPrimitives
 * @description Unified form system with validated inputs and textareas.
 * Single source of truth for all form components in the application.
 */

import { AnimatePresence, motion } from "framer-motion";
import React, { forwardRef, useCallback, useEffect, useId, useState } from "react";
import type { z } from "zod";
import { cn } from "@/utils/basic";

// ============================================================================
// TYPES
// ============================================================================

interface BaseFieldProps {
	label?: string;
	error?: string | null;
	required?: boolean;
	showSuccess?: boolean;
	className?: string;
}

interface ValidationProps {
	schema?: z.ZodSchema;
	onValidationChange?: (isValid: boolean) => void;
	debounceMs?: number;
	externalError?: string | null;
	externalTouched?: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

interface FormFieldContextValue {
	id: string;
	errorId: string | undefined;
	error: string | null;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

// ============================================================================
// HOOKS
// ============================================================================

const useFormValidation = (
	schema: z.ZodSchema | undefined,
	value: unknown,
	onValidationChange?: (isValid: boolean) => void,
	debounceMs = 300,
	externalError?: string | null,
	externalTouched?: boolean,
) => {
	const [internalError, setInternalError] = useState<string | null>(null);
	const [isTouched, setIsTouched] = useState(false);
	const [isValidating, setIsValidating] = useState(false);

	const validate = useCallback(
		(val: string) => {
			if (!schema) {
				return;
			}

			const result = schema.safeParse(val);
			if (result.success) {
				setInternalError(null);
				onValidationChange?.(true);
			} else {
				setInternalError(result.error.issues[0]?.message || "Invalid input");
				onValidationChange?.(false);
			}
			setIsValidating(false);
		},
		[schema, onValidationChange],
	);

	useEffect(() => {
		if (!isTouched || !schema) {
			return;
		}

		setIsValidating(true);
		const timer = setTimeout(() => {
			validate(String(value || ""));
		}, debounceMs);

		return () => clearTimeout(timer);
	}, [value, isTouched, schema, validate, debounceMs]);

	const currentError = externalError !== undefined ? externalError : internalError;
	const currentTouched = externalTouched !== undefined ? externalTouched : isTouched;
	const hasError = currentTouched && currentError && !isValidating;

	return {
		internalError,
		isTouched,
		setIsTouched,
		isValidating,
		validate,
		currentError,
		currentTouched,
		hasError,
	};
};

// ============================================================================
// STYLES
// ============================================================================

const inputBaseStyles =
	"flex h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all text-white backdrop-blur-sm";

const errorStyles = "border-red-500/50 focus-visible:ring-red-500/50 animate-pulse";
const successStyles = "border-green-500/50 focus-visible:ring-green-500/50";

// ============================================================================
// FORM FIELD WRAPPER
// ============================================================================

interface FormFieldProps extends BaseFieldProps {
	children: React.ReactNode;
	id?: string;
	name?: string;
}

const FormField: React.FC<FormFieldProps> = ({
	id,
	name,
	label,
	error,
	required = false,
	children,
	className = "",
}) => {
	const generatedId = useId();
	const fieldId = id || (name ? `${name}-field` : `field-${generatedId}`);
	const errorId = error ? `${fieldId}-error` : undefined;

	return (
		<FormFieldContext.Provider value={{ id: fieldId, errorId, error: error || null }}>
			<div className={cn("flex flex-col gap-2 w-full", className)}>
				{label && (
					<label
						htmlFor={fieldId}
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white/80 ml-1"
					>
						{label}
						{required && <span className="text-red-400 ml-1">*</span>}
					</label>
				)}
				{children}
				<AnimatePresence mode="wait">
					{error && errorId && (
						<motion.div
							id={errorId}
							key={error}
							initial={{ opacity: 0, y: -5 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -5 }}
							className="text-xs font-medium text-red-400 ml-1"
							role="alert"
						>
							{error}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</FormFieldContext.Provider>
	);
};

FormField.displayName = "FormField";

// ============================================================================
// INPUT COMPONENT
// ============================================================================

interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">,
		BaseFieldProps,
		ValidationProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			label,
			required,
			schema,
			value,
			onChange,
			onValidationChange,
			debounceMs = 300,
			showSuccess = false,
			externalError,
			externalTouched,
			className = "",
			...props
		},
		ref,
	) => {
		const internalId = useId();
		const id = props.id || internalId;
		const { setIsTouched, validate, currentError, currentTouched, hasError, isValidating } =
			useFormValidation(
				schema,
				value,
				onValidationChange,
				debounceMs,
				externalError,
				externalTouched,
			);

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setIsTouched(true);
			onChange?.(e);
		};

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsTouched(true);
			validate(String(value || ""));
			props.onBlur?.(e);
		};

		const isSuccess =
			showSuccess &&
			currentTouched &&
			!currentError &&
			!isValidating &&
			String(value || "").length > 0;

		return (
			<FormField id={id} label={label} error={hasError ? currentError : null} required={required}>
				<div className="relative">
					<input
						{...props}
						id={id}
						ref={ref}
						value={value}
						onChange={handleChange}
						onBlur={handleBlur}
						className={cn(
							inputBaseStyles,
							hasError && errorStyles,
							isSuccess && successStyles,
							className,
						)}
						aria-invalid={hasError || undefined}
						aria-describedby={hasError ? `${id}-error` : undefined}
					/>
					<AnimatePresence>
						{isSuccess && (
							<motion.span
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0, opacity: 0 }}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 pointer-events-none"
							>
								✅
							</motion.span>
						)}
						{hasError && (
							<motion.span
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0, opacity: 0 }}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none"
							>
								❌
							</motion.span>
						)}
					</AnimatePresence>
				</div>
			</FormField>
		);
	},
);

Input.displayName = "Input";

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

interface TextareaProps
	extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">,
		BaseFieldProps,
		ValidationProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	(
		{
			label,
			required,
			schema,
			value,
			onChange,
			onValidationChange,
			debounceMs = 300,
			showSuccess = false,
			externalError,
			externalTouched,
			className = "",
			...props
		},
		ref,
	) => {
		const internalId = useId();
		const id = props.id || internalId;
		const { setIsTouched, validate, currentError, currentTouched, hasError, isValidating } =
			useFormValidation(
				schema,
				value,
				onValidationChange,
				debounceMs,
				externalError,
				externalTouched,
			);

		const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setIsTouched(true);
			onChange?.(e);
		};

		const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
			setIsTouched(true);
			validate(String(value || ""));
			props.onBlur?.(e);
		};

		const isSuccess =
			showSuccess &&
			currentTouched &&
			!currentError &&
			!isValidating &&
			String(value || "").length > 0;

		return (
			<FormField id={id} label={label} error={hasError ? currentError : null} required={required}>
				<textarea
					{...props}
					id={id}
					ref={ref}
					value={value}
					onChange={handleChange}
					onBlur={handleBlur}
					className={cn(
						inputBaseStyles,
						"min-h-[80px] py-3",
						hasError && errorStyles,
						isSuccess && successStyles,
						className,
					)}
					aria-invalid={hasError || undefined}
					aria-describedby={hasError ? `${id}-error` : undefined}
				/>
			</FormField>
		);
	},
);

Textarea.displayName = "Textarea";
