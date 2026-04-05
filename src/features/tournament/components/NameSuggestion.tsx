/**
 * @module NameSuggestion
 * @description Unified name suggestion component with inline and modal variants.
 * Uses the shared useNameSuggestion hook for consistent submission logic.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import { Button, Input, Textarea } from "@/shared/components/layout";
import { useNameSuggestion } from "@/shared/hooks";
import { CheckCircle, Lightbulb } from "@/shared/lib/icons";

// ============================================================================
// TYPES
// ============================================================================

interface NameSuggestionProps {
        /** Variant: inline (compact) or modal (full-featured) */
        variant?: "inline" | "modal";
        /** For modal variant: controls visibility */
        isOpen?: boolean;
        /** For modal variant: close callback */
        onClose?: () => void;
}

// ============================================================================
// INNER CONTENT (no wrapper — used when embedded in a shared container)
// ============================================================================

export function NameSuggestionInner() {
	const { values, isSubmitting, handleChange, handleSubmit, globalError, successMessage } =
		useNameSuggestion();

	const handleLocalSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await handleSubmit();
	};

	const isFormComplete = values.name.trim().length > 0 && values.description.trim().length > 0;

	return (
		<form onSubmit={handleLocalSubmit} className="w-full max-w-2xl mx-auto">
			{/* Header Section */}
			<div className="text-center space-y-4 mb-8 sm:mb-10">
				<div className="inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-5 py-2">
					<Lightbulb size={16} className="text-primary" />
					<span className="text-xs font-bold uppercase tracking-widest text-primary">
						Pitch a Name
					</span>
				</div>
				<h2 className="text-3xl sm:text-5xl font-black text-foreground leading-tight">
					What would you name him?
				</h2>
				<p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
					Every suggestion enters the bracket for voting.
				</p>
			</div>

			{/* Form Fields Container */}
			<div className="space-y-6 mb-8">
				{/* Name Field */}
				<div className="space-y-3">
					<div className="flex items-baseline justify-between">
						<label
							htmlFor="suggest-name"
							className="text-sm font-semibold text-foreground"
						>
							Suggested Name
						</label>
						<span className="text-xs text-muted-foreground tabular-nums">
							{values.name.length}/50
						</span>
					</div>
					<Input
						id="suggest-name"
						type="text"
						value={values.name}
						onChange={(e) => handleChange("name", e.target.value)}
						placeholder="e.g. Count Whiskula, Sir Paws-a-lot, Meow-zart"
						className="h-14 text-base placeholder:text-muted-foreground/50 border-2 border-border/40 focus:border-primary focus:bg-foreground/5 bg-foreground/5 rounded-xl transition-all"
						disabled={isSubmitting}
						maxLength={50}
					/>
				</div>

				{/* Description Field */}
				<div className="space-y-3">
					<div className="flex items-baseline justify-between">
						<label
							htmlFor="suggest-description"
							className="text-sm font-semibold text-foreground"
						>
							Why This Name?
						</label>
						<span className="text-xs text-muted-foreground tabular-nums">
							{values.description.length}/500
						</span>
					</div>
					<Textarea
						id="suggest-description"
						value={values.description}
						onChange={(e) => handleChange("description", e.target.value)}
						placeholder="What makes it special? Help voters feel the vibe."
						rows={5}
						className="text-base placeholder:text-muted-foreground/50 border-2 border-border/40 focus:border-primary focus:bg-foreground/5 bg-foreground/5 rounded-xl transition-all resize-none"
						disabled={isSubmitting}
						maxLength={500}
						showCount={false}
					/>
					<p className="text-xs text-muted-foreground">
						Be creative and specific to stand out!
					</p>
				</div>
			</div>

			{/* Submit Section */}
			<div className="flex flex-col gap-4">
				<Button
					type="submit"
					disabled={!isFormComplete || isSubmitting}
					loading={isSubmitting}
					className="w-full py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-primary-foreground transition-all"
				>
					{isSubmitting ? "Submitting…" : "Add to Bracket"}
				</Button>
				<p className="text-xs text-center text-muted-foreground">
					Goes into the shared pool for everyone to discover
				</p>
			</div>

			{/* Status Messages */}
			<AnimatePresence mode="wait">
				{globalError && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className="mt-6 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm font-medium text-center flex items-center justify-center gap-2"
					>
						<X size={16} className="text-destructive shrink-0" />
						{globalError}
					</motion.div>
				)}
				{successMessage && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className="mt-6 p-4 rounded-xl border border-chart-2/30 bg-chart-2/10 text-sm font-medium text-center flex items-center justify-center gap-2 text-chart-2"
					>
						<CheckCircle size={16} className="shrink-0" />
						{successMessage}
					</motion.div>
				)}
			</AnimatePresence>
		</form>
	);
}

// ============================================================================
// INLINE VARIANT (self-contained with LiquidGlass wrapper)
// ============================================================================

function InlineNameSuggestion() {
        return <NameSuggestionInner />;
}

// ============================================================================
// MODAL CONTENT (content only, wrapper provided by parent Modal)
// ============================================================================

interface ModalNameSuggestionProps {
	onClose: () => void;
}

function ModalNameSuggestionContent({ onClose }: ModalNameSuggestionProps) {
	const isMountedRef = useRef(true);
	const nameInputRef = useRef<HTMLInputElement | null>(null);

	const {
		values,
		errors,
		touched,
		isSubmitting,
		isValid,
		handleChange,
		handleBlur,
		handleSubmit,
		reset,
		globalError,
		successMessage: success,
		setGlobalError,
	} = useNameSuggestion({
		onSuccess: () => {
			setTimeout(() => {
				if (isMountedRef.current) {
					onClose();
				}
			}, 3000);
		},
	});

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		nameInputRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				reset();
				onClose();
			}
		};

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [onClose, reset]);

	const handleClose = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		reset();
		setGlobalError("");
		onClose();
	}, [isSubmitting, onClose, reset, setGlobalError]);

	return (
		<>
			<p className="text-sm text-muted-foreground mb-6">
				Help us expand the list by suggesting new cat names!
			</p>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					void handleSubmit();
				}}
				className="flex flex-col gap-5"
			>
				<Input
					id="modal-name-input"
					label="Name"
					ref={nameInputRef}
					type="text"
					value={values.name}
					onChange={(e) => {
						handleChange("name", e.target.value);
						if (globalError) {
							setGlobalError("");
						}
					}}
					onBlur={() => handleBlur("name")}
					placeholder="e.g., Whiskers"
					maxLength={50}
					showSuccess={true}
					error={touched.name ? errors.name : null}
				/>

				<Textarea
					id="modal-description-input"
					label="Description"
					value={values.description}
					onChange={(e) => {
						handleChange("description", e.target.value);
						if (globalError) {
							setGlobalError("");
						}
					}}
					onBlur={() => handleBlur("description")}
					placeholder="Why is this name special? (e.g. 'He looks like a vampire!')"
					disabled={isSubmitting}
					maxLength={500}
					rows={4}
					error={touched.description ? errors.description : null}
					showCount={true}
				/>

				{globalError && (
					<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive-foreground text-sm font-medium animate-in fade-in slide-in-from-top-2">
						{globalError}
					</div>
				)}
				{success && (
					<div className="p-3 bg-chart-2/10 border border-chart-2/20 rounded-lg text-chart-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
						{success}
					</div>
				)}

				<div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
					<Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="glass"
						disabled={isSubmitting || !isValid}
						loading={isSubmitting}
						className="px-6"
					>
						Submit Suggestion
					</Button>
				</div>
			</form>
		</>
	);
}

// ============================================================================
// UNIFIED EXPORT
// ============================================================================

export function NameSuggestion({
	variant = "inline",
	isOpen = false,
	onClose,
}: NameSuggestionProps) {
	if (variant === "modal") {
		return (
			<ModalNameSuggestionContent
				onClose={
					onClose ||
					(() => {
						/* No-op default */
					})
				}
			/>
		);
	}
	return <InlineNameSuggestion />;
}
